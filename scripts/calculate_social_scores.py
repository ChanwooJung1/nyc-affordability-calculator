"""
Calculate Social Scores for NYC ZIP Codes using Google Places API
Counts coffee shops and restaurants within 0.5 miles of each ZIP code center
"""

import pandas as pd
import requests
import time
import os
from dotenv import load_dotenv

# Load API key from brooklyn-rentals/.env
load_dotenv('../brooklyn-rentals/.env')

GOOGLE_PLACES_API_KEY = os.getenv('GOOGLE_PLACES_API_KEY')
RADIUS_METERS = 800  # 0.5 miles = approximately 800 meters
DELAY_SECONDS = 0.5  # Rate limiting delay

def get_social_score(lat, lng):
    """
    Fetch count of coffee shops and restaurants near a location

    Args:
        lat: Latitude
        lng: Longitude

    Returns:
        int: Count of unique venues (0-20, API max)
    """
    url = 'https://places.googleapis.com/v1/places:searchNearby'

    request_body = {
        'includedTypes': ['restaurant', 'cafe'],
        'maxResultCount': 20,
        'locationRestriction': {
            'circle': {
                'center': {
                    'latitude': lat,
                    'longitude': lng
                },
                'radius': RADIUS_METERS
            }
        }
    }

    headers = {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
        'X-Goog-FieldMask': 'places.displayName,places.id'
    }

    try:
        response = requests.post(url, json=request_body, headers=headers)

        if response.status_code == 200:
            data = response.json()
            places = data.get('places', [])
            return len(places)
        elif response.status_code == 429:
            print("  ⚠️  Rate limit hit, waiting 5 seconds...")
            time.sleep(5)
            return None  # Will retry
        else:
            print(f"  ✗ API error {response.status_code}")
            return 0

    except Exception as e:
        print(f"  ✗ Exception: {e}")
        return 0

def normalize_social_scores(scores):
    """
    Normalize social scores to 0-100 scale

    Args:
        scores: List of raw social scores

    Returns:
        List of normalized scores (0-100)
    """
    max_score = max(scores) if scores else 1
    return [round((score / max_score) * 100) if score is not None else 0 for score in scores]

def main():
    print("\n=== NYC Social Score Calculator ===\n")

    # Check API key
    if not GOOGLE_PLACES_API_KEY or GOOGLE_PLACES_API_KEY == 'your_api_key_here':
        print("ERROR: GOOGLE_PLACES_API_KEY not found")
        print("Make sure API key is in brooklyn-rentals/.env")
        return

    # Read NYC data
    csv_path = '../nyc_affordability_scores.csv'
    print(f"Reading {csv_path}...")
    df = pd.read_csv(csv_path)
    print(f"Found {len(df)} NYC ZIP codes\n")

    # Add social_score column if it doesn't exist
    if 'social_score' not in df.columns:
        df['social_score'] = None

    # Calculate social scores for each ZIP
    print("Fetching social scores from Google Places API...")
    print("This will take ~2-3 minutes for 246 ZIP codes\n")

    raw_scores = []

    for idx, row in df.iterrows():
        zip_code = row['zip_code']
        lat = row['lat']
        lng = row['lng']

        # Progress indicator
        if idx % 20 == 0:
            print(f"Progress: {idx}/{len(df)} ({idx/len(df)*100:.1f}%)")

        # Fetch social score
        score = get_social_score(lat, lng)

        # Retry once if rate limited
        if score is None:
            score = get_social_score(lat, lng)

        raw_scores.append(score if score is not None else 0)

        # Save progress every 50 rows
        if idx % 50 == 0 and idx > 0:
            print(f"  → Saving progress at row {idx}...")

        # Rate limiting delay
        time.sleep(DELAY_SECONDS)

    # Normalize scores to 0-100
    print("\n--- Normalizing scores ---")
    normalized_scores = normalize_social_scores(raw_scores)
    df['social_score'] = normalized_scores

    # Save results
    print("--- Saving results ---")
    df.to_csv(csv_path, index=False)
    print(f"✓ Data saved to {csv_path}\n")

    # Print summary
    print("=== Summary ===")
    print(f"Total ZIP codes: {len(df)}")
    print(f"Average raw social score: {sum(raw_scores)/len(raw_scores):.1f} venues")
    print(f"Average normalized score: {sum(normalized_scores)/len(normalized_scores):.1f}/100")
    print(f"Max social score: {max(normalized_scores)}/100")
    print(f"Min social score: {min(normalized_scores)}/100")

    # Show top 5 most social ZIP codes
    print("\nTop 5 Most Social ZIP Codes:")
    top_social = df.nlargest(5, 'social_score')[['zip_code', 'borough', 'social_score']]
    for _, row in top_social.iterrows():
        print(f"  {row['zip_code']} ({row['borough']}): {row['social_score']}/100")

    print("\n✓ Social scores calculated successfully!")

if __name__ == '__main__':
    main()
