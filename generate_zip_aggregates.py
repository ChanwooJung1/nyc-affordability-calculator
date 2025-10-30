"""
Generate ZIP-Level Aggregate Scores for Heatmap

This script:
1. Reads rental data from 3 ZIPs with full data (10001, 11201, 11203)
2. Calculates ZIP-level aggregates (average Transit/Social/Grocery, median Housing)
3. Updates nyc_affordability_scores.csv with new aggregate scores
4. Adds data_quality flag to distinguish full vs partial data
"""

import pandas as pd
import os

# Baseline for housing score calculation (Brooklyn median rent)
BASELINE_RENT = 3000

# Score weights
WEIGHTS = {
    'housing': 0.6,
    'transit': 0.2,
    'social': 0.1,
    'grocery': 0.1
}

def calculate_housing_score(median_rent, baseline=BASELINE_RENT):
    """
    Calculate housing affordability score from median rent
    Lower rent = higher score
    """
    if median_rent <= baseline * 0.5:
        return 100
    elif median_rent >= baseline * 1.5:
        return 0
    else:
        score = 100 - ((median_rent / baseline - 0.5) * 100)
        return max(0, min(100, int(round(score))))

def load_rental_data(zip_code):
    """Load rental data from ZIP-specific CSV"""
    csv_path = os.path.join('nyc-affordability-calculator', f'{zip_code} Rental Listings.csv')

    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"CSV not found: {csv_path}")

    df = pd.read_csv(csv_path)

    # Normalize column names
    df.columns = df.columns.str.strip()

    return df

def calculate_zip_aggregate(zip_code):
    """Calculate aggregate scores for a ZIP code from rental data"""

    print(f"\n[CALC] Calculating aggregate for ZIP {zip_code}...")

    # Load rental data
    df = load_rental_data(zip_code)
    print(f"   Loaded {len(df)} rentals")

    # Extract scores (handle both naming conventions)
    prices = df['price'].dropna() if 'price' in df.columns else df['Rental Price'].dropna()
    transit_scores = df['Transit Score'].dropna()
    social_scores = df['Social Score'].dropna()
    grocery_scores = df['Grocery Score'].dropna()

    # Calculate aggregates
    median_rent = prices.median()
    housing_score = calculate_housing_score(median_rent)
    transit_score = int(round(transit_scores.mean()))
    social_score = int(round(social_scores.mean()))
    grocery_score = int(round(grocery_scores.mean()))

    # Calculate overall score (60/20/10/10)
    overall_score = int(round(
        housing_score * WEIGHTS['housing'] +
        transit_score * WEIGHTS['transit'] +
        social_score * WEIGHTS['social'] +
        grocery_score * WEIGHTS['grocery']
    ))

    print(f"   Median Rent: ${median_rent:.0f}")
    print(f"   Housing Score: {housing_score}")
    print(f"   Transit Score: {transit_score}")
    print(f"   Social Score: {social_score}")
    print(f"   Grocery Score: {grocery_score}")
    print(f"   Overall Score: {overall_score}")

    return {
        'housing_score': housing_score,
        'transit_score': transit_score,
        'social_score': social_score,
        'grocery_score': grocery_score,
        'overall_score': overall_score,
        'rental_count': len(df)
    }

def main():
    print('================================================================')
    print('      Generate ZIP-Level Aggregate Scores for Heatmap          ')
    print('================================================================\n')

    # ZIPs with full rental data
    full_data_zips = ['10001', '11201', '11203']

    # Load existing affordability scores
    csv_path = 'nyc_affordability_scores.csv'
    print(f"[LOAD] Loading existing data from {csv_path}...")
    df = pd.read_csv(csv_path)
    print(f"   Found {len(df)} ZIP codes total\n")

    # Add new columns if they don't exist
    new_columns = ['transit_score', 'social_score', 'grocery_score', 'data_quality', 'rental_count']
    for col in new_columns:
        if col not in df.columns:
            df[col] = 0 if col != 'data_quality' else 'Housing Only'

    # Calculate and update aggregates for ZIPs with full data
    print('=' * 66)
    print('Calculating Aggregates for ZIPs with Full Rental Data')
    print('=' * 66)

    for zip_code in full_data_zips:
        try:
            aggregate = calculate_zip_aggregate(zip_code)

            # Update the row for this ZIP
            mask = df['zip_code'].astype(str) == zip_code

            if mask.any():
                df.loc[mask, 'housing_score'] = aggregate['housing_score']
                df.loc[mask, 'transit_score'] = aggregate['transit_score']
                df.loc[mask, 'social_score'] = aggregate['social_score']
                df.loc[mask, 'grocery_score'] = aggregate['grocery_score']
                df.loc[mask, 'overall_score'] = aggregate['overall_score']
                df.loc[mask, 'data_quality'] = 'Full Data'
                df.loc[mask, 'rental_count'] = aggregate['rental_count']
                print(f"   [OK] Updated ZIP {zip_code}\n")
            else:
                print(f"   [WARN] ZIP {zip_code} not found in CSV (will need to add manually)\n")

        except Exception as e:
            print(f"   [ERROR] Error processing ZIP {zip_code}: {e}\n")

    # Mark remaining ZIPs as partial data
    partial_mask = ~df['zip_code'].astype(str).isin(full_data_zips)
    df.loc[partial_mask, 'data_quality'] = 'Housing Only'
    df.loc[partial_mask, 'rental_count'] = 0

    # Ensure all scores are integers (no decimals)
    score_columns = ['housing_score', 'transit_score', 'social_score', 'grocery_score', 'overall_score', 'rental_count']
    for col in score_columns:
        if col in df.columns:
            df[col] = df[col].fillna(0).astype(int)

    # Save updated CSV
    print('\n' + '=' * 66)
    print('Saving Updated Data')
    print('=' * 66)
    print(f"\n[SAVE] Writing to {csv_path}...")
    df.to_csv(csv_path, index=False)
    print("   [OK] CSV updated successfully!\n")

    # Summary statistics
    print('\n================================================================')
    print('                          Summary                               ')
    print('================================================================\n')

    full_data_count = (df['data_quality'] == 'Full Data').sum()
    partial_data_count = (df['data_quality'] == 'Housing Only').sum()

    print(f"Total ZIP codes: {len(df)}")
    print(f"  [FULL] Full Data: {full_data_count} ZIPs")
    print(f"  [PARTIAL] Housing Only: {partial_data_count} ZIPs\n")

    # Show the 3 updated ZIPs
    print("Updated ZIP Aggregate Scores:")
    print("-" * 66)
    print("| ZIP     | Housing | Transit | Social  | Grocery | Overall |")
    print("-" * 66)

    for zip_code in full_data_zips:
        mask = df['zip_code'].astype(str) == zip_code
        if mask.any():
            row = df[mask].iloc[0]
            print(f"| {zip_code}   | {str(row['housing_score']).rjust(7)} | {str(row['transit_score']).rjust(7)} | {str(row['social_score']).rjust(7)} | {str(row['grocery_score']).rjust(7)} | {str(row['overall_score']).rjust(7)} |")

    print("-" * 66 + "\n")

    print("[SUCCESS] ZIP-level aggregate scores generated successfully!")
    print("[READY] Your heatmap is ready to display accurate affordability data\n")

if __name__ == '__main__':
    main()
