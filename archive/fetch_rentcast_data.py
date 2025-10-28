"""
Fetch RentCast Median Rent Data for All NY ZIP Codes
This script adds rent affordability scores to ny_affordability_scores.csv
"""

import pandas as pd
import requests
import time
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('./brooklyn-rentals/.env')

RENTCAST_API_KEY = os.getenv('RENTCAST_API_KEY')
BASE_URL = 'https://api.rentcast.io/v1'

# Rate limiting delay (1 second between requests)
DELAY_SECONDS = 1

def get_median_rent_for_zip(zip_code, bedrooms=1):
    """
    Fetch median rent for a ZIP code from RentCast API

    Args:
        zip_code: ZIP code to query
        bedrooms: Number of bedrooms (default: 1)

    Returns:
        dict with median_rent and status
    """
    url = f"{BASE_URL}/markets?zipCode={zip_code}&bedrooms={bedrooms}"

    headers = {
        'Accept': 'application/json',
        'X-Api-Key': RENTCAST_API_KEY
    }

    try:
        response = requests.get(url, headers=headers)

        if response.status_code == 200:
            data = response.json()
            median_rent = data.get('medianRent', None)
            return {
                'median_rent': median_rent,
                'status': 'success'
            }
        elif response.status_code == 404:
            # No data available for this ZIP
            return {
                'median_rent': None,
                'status': 'no_data'
            }
        elif response.status_code == 429:
            # Rate limit exceeded
            return {
                'median_rent': None,
                'status': 'rate_limit'
            }
        else:
            return {
                'median_rent': None,
                'status': f'error_{response.status_code}'
            }
    except Exception as e:
        print(f"Exception for ZIP {zip_code}: {e}")
        return {
            'median_rent': None,
            'status': 'exception'
        }

def calculate_rent_score(median_rent, state_median=2500):
    """
    Calculate rent affordability score (0-100)
    Lower rent = higher score (more affordable)

    Args:
        median_rent: Median rent for the area
        state_median: NY State median rent (default: $2500)

    Returns:
        Rent score (0-100)
    """
    if median_rent is None:
        return None

    ratio = median_rent / state_median

    if ratio <= 0.5:
        score = 100  # Very affordable
    elif ratio >= 1.5:
        score = 0    # Very expensive
    else:
        # Linear scale between 50% and 150% of median
        score = round(100 - ((ratio - 0.5) * 100))

    return max(0, min(100, score))  # Clamp to 0-100

def main():
    print("\n=== RentCast NY ZIP Code Data Fetcher ===\n")

    # Check API key
    if not RENTCAST_API_KEY or RENTCAST_API_KEY == 'your_api_key_here':
        print("ERROR: RENTCAST_API_KEY not found in .env file")
        print("Please add your RentCast API key to brooklyn-rentals/.env")
        return

    # Read existing affordability data
    csv_path = 'ny_affordability_scores.csv'
    print(f"Reading {csv_path}...")
    df = pd.read_csv(csv_path)
    print(f"Found {len(df)} ZIP codes\n")

    # Add new columns if they don't exist
    if 'median_rent' not in df.columns:
        df['median_rent'] = None
    if 'rent_score' not in df.columns:
        df['rent_score'] = None

    # Track statistics
    stats = {
        'success': 0,
        'no_data': 0,
        'rate_limit': 0,
        'error': 0
    }

    # Process each ZIP code
    print("Fetching rent data from RentCast API...")
    print("This will take ~30-60 minutes for 1,826 ZIP codes\n")

    for idx, row in df.iterrows():
        zip_code = str(row['zip_code']).zfill(5)  # Ensure 5-digit format

        # Progress indicator
        if idx % 50 == 0:
            print(f"Progress: {idx}/{len(df)} ({idx/len(df)*100:.1f}%)")
            print(f"  Success: {stats['success']}, No data: {stats['no_data']}, "
                  f"Rate limit: {stats['rate_limit']}, Errors: {stats['error']}")

        # Fetch rent data
        result = get_median_rent_for_zip(zip_code, bedrooms=1)

        # Update DataFrame
        df.at[idx, 'median_rent'] = result['median_rent']

        # Calculate rent score if data available
        if result['median_rent'] is not None:
            rent_score = calculate_rent_score(result['median_rent'])
            df.at[idx, 'rent_score'] = rent_score
            stats['success'] += 1
        else:
            if result['status'] == 'no_data':
                stats['no_data'] += 1
            elif result['status'] == 'rate_limit':
                stats['rate_limit'] += 1
                print(f"\n⚠️  RATE LIMIT HIT at ZIP {zip_code} (row {idx})")
                print("Saving progress so far...")
                break
            else:
                stats['error'] += 1

        # Save progress every 100 rows
        if idx % 100 == 0 and idx > 0:
            df.to_csv(csv_path, index=False)
            print(f"  → Progress saved at row {idx}")

        # Rate limiting delay
        time.sleep(DELAY_SECONDS)

    # Save final results
    print("\n--- Saving final results ---")
    df.to_csv(csv_path, index=False)
    print(f"✓ Data saved to {csv_path}\n")

    # Print summary
    print("=== Summary ===")
    print(f"Total ZIP codes processed: {idx + 1}")
    print(f"Successful fetches: {stats['success']}")
    print(f"No data available: {stats['no_data']}")
    print(f"Rate limit hits: {stats['rate_limit']}")
    print(f"Errors: {stats['error']}")

    if stats['success'] > 0:
        avg_rent = df['median_rent'].mean()
        print(f"\nAverage median rent: ${avg_rent:.2f}/month")
        print(f"Min rent: ${df['median_rent'].min():.2f}")
        print(f"Max rent: ${df['median_rent'].max():.2f}")

    if stats['rate_limit'] > 0:
        print("\n⚠️  Rate limit was hit. You can:")
        print("1. Wait 24 hours and run script again (it will resume)")
        print("2. Upgrade your RentCast plan at https://app.rentcast.io/")

    print("\n✓ Script complete!")

if __name__ == '__main__':
    main()
