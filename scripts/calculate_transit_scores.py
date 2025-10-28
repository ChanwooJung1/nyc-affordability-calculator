"""
Calculate Transit Scores for NYC ZIP Codes using Google Distance Matrix API
Calculates average transit time to key NYC destinations
"""

import pandas as pd
import requests
import time
import os
from dotenv import load_dotenv

# Load API key from brooklyn-rentals/.env
load_dotenv('../brooklyn-rentals/.env')

GOOGLE_DISTANCE_MATRIX_API_KEY = os.getenv('GOOGLE_DISTANCE_MATRIX_API_KEY')
DELAY_SECONDS = 0.5  # Rate limiting delay

# Key NYC destinations for transit scoring
KEY_DESTINATIONS = [
    {'name': 'Manhattan Financial District', 'lat': 40.7074, 'lng': -74.0113},
    {'name': 'Midtown Manhattan', 'lat': 40.7580, 'lng': -73.9855},
    {'name': 'Downtown Brooklyn', 'lat': 40.6925, 'lng': -73.9874}
]

def get_transit_time(origin_lat, origin_lng, dest_lat, dest_lng):
    """
    Get transit time from origin to destination using Distance Matrix API

    Args:
        origin_lat, origin_lng: Origin coordinates
        dest_lat, dest_lng: Destination coordinates

    Returns:
        int: Transit time in minutes (None if no route available)
    """
    origins = f"{origin_lat},{origin_lng}"
    destinations = f"{dest_lat},{dest_lng}"

    url = f"https://maps.googleapis.com/maps/api/distancematrix/json?origins={origins}&destinations={destinations}&mode=transit&key={GOOGLE_DISTANCE_MATRIX_API_KEY}"

    try:
        response = requests.get(url)

        if response.status_code == 200:
            data = response.json()

            if data['status'] == 'OK':
                element = data['rows'][0]['elements'][0]

                if element['status'] == 'OK':
                    duration_seconds = element['duration']['value']
                    return round(duration_seconds / 60)  # Convert to minutes

        return None

    except Exception as e:
        return None

def calculate_transit_score(avg_time_minutes):
    """
    Convert average transit time to 0-100 score
    Lower time = higher score

    Args:
        avg_time_minutes: Average transit time in minutes

    Returns:
        int: Transit score (0-100)
    """
    if avg_time_minutes is None or avg_time_minutes == 0:
        return 0

    # Score formula:
    # 15 min or less = 100 (excellent)
    # 30 min = 75 (good)
    # 45 min = 50 (moderate)
    # 60 min = 25 (poor)
    # 90+ min = 0 (very poor)

    if avg_time_minutes <= 15:
        score = 100
    elif avg_time_minutes >= 90:
        score = 0
    else:
        # Linear scale from 15 to 90 minutes
        score = round(100 - ((avg_time_minutes - 15) / 75) * 100)

    return max(0, min(100, score))  # Clamp to 0-100

def main():
    print("\n=== NYC Transit Score Calculator ===\n")

    # Check API key
    if not GOOGLE_DISTANCE_MATRIX_API_KEY or GOOGLE_DISTANCE_MATRIX_API_KEY == 'your_api_key_here':
        print("ERROR: GOOGLE_DISTANCE_MATRIX_API_KEY not found")
        print("Make sure API key is in brooklyn-rentals/.env")
        return

    # Read NYC data
    csv_path = '../nyc_affordability_scores.csv'
    print(f"Reading {csv_path}...")
    df = pd.read_csv(csv_path)
    print(f"Found {len(df)} NYC ZIP codes\n")

    # Add transit_score column if it doesn't exist
    if 'transit_score' not in df.columns:
        df['transit_score'] = None

    # Calculate transit scores
    print("Fetching transit times from Google Distance Matrix API...")
    print("This will take ~10-15 minutes for 246 ZIP codes\n")
    print("Note: Each ZIP code requires 3 API calls (one per destination)\n")

    for idx, row in df.iterrows():
        zip_code = row['zip_code']
        lat = row['lat']
        lng = row['lng']

        # Progress indicator
        if idx % 10 == 0:
            print(f"Progress: {idx}/{len(df)} ({idx/len(df)*100:.1f}%)")

        transit_times = []

        # Get transit time to each destination
        for dest in KEY_DESTINATIONS:
            time_minutes = get_transit_time(lat, lng, dest['lat'], dest['lng'])

            if time_minutes is not None:
                transit_times.append(time_minutes)

            # Small delay between API calls
            time.sleep(DELAY_SECONDS)

        # Calculate average transit time
        if transit_times:
            avg_time = round(sum(transit_times) / len(transit_times))
            score = calculate_transit_score(avg_time)
            df.at[idx, 'transit_score'] = score
        else:
            df.at[idx, 'transit_score'] = 0

        # Save progress every 25 rows
        if idx % 25 == 0 and idx > 0:
            df.to_csv(csv_path, index=False)
            print(f"  → Progress saved at row {idx}")

    # Save final results
    print("\n--- Saving final results ---")
    df.to_csv(csv_path, index=False)
    print(f"✓ Data saved to {csv_path}\n")

    # Print summary
    print("=== Summary ===")
    print(f"Total ZIP codes: {len(df)}")
    print(f"Average transit score: {df['transit_score'].mean():.1f}/100")
    print(f"Max transit score: {df['transit_score'].max()}/100")
    print(f"Min transit score: {df['transit_score'].min()}/100")

    # Show top 5 best transit ZIP codes
    print("\nTop 5 Best Transit Access ZIP Codes:")
    top_transit = df.nlargest(5, 'transit_score')[['zip_code', 'borough', 'transit_score']]
    for _, row in top_transit.iterrows():
        print(f"  {row['zip_code']} ({row['borough']}): {row['transit_score']}/100")

    print("\n✓ Transit scores calculated successfully!")

if __name__ == '__main__':
    main()
