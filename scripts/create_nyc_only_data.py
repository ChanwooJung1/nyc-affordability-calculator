"""
Create NYC-only dataset from NY State data
Filters to only 5 boroughs: Manhattan, Brooklyn, Queens, Bronx, Staten Island
"""

import pandas as pd

# NYC ZIP code ranges by borough
# Source: USPS and NYC Open Data
NYC_ZIP_RANGES = {
    'Manhattan': list(range(10001, 10283)),  # 10001-10282
    'Bronx': list(range(10451, 10476)),      # 10451-10475
    'Brooklyn': list(range(11201, 11257)),   # 11201-11256
    'Queens': list(range(11351, 11698)) + list(range(11001, 11006)),  # Multiple ranges
    'Staten Island': list(range(10301, 10315))  # 10301-10314
}

# Flatten all NYC ZIP codes into one list
NYC_ZIPS = []
for borough, zip_list in NYC_ZIP_RANGES.items():
    NYC_ZIPS.extend(zip_list)

# Convert to strings for matching
NYC_ZIPS = [str(z) for z in NYC_ZIPS]

def main():
    print("\n=== Creating NYC-Only Dataset ===\n")

    # Read full NY State data
    input_file = 'ny_affordability_scores.csv'
    output_file = 'nyc_affordability_scores.csv'

    print(f"Reading {input_file}...")
    df = pd.read_csv(input_file)
    print(f"Total NY State ZIP codes: {len(df)}")

    # Convert zip_code to string for matching
    df['zip_code'] = df['zip_code'].astype(str).str.zfill(5)

    # Filter to NYC only
    nyc_df = df[df['zip_code'].isin(NYC_ZIPS)].copy()

    print(f"\nFiltered to NYC only: {len(nyc_df)} ZIP codes")

    # Add borough column
    def get_borough(zip_code):
        zip_int = int(zip_code)
        if 10001 <= zip_int <= 10282:
            return 'Manhattan'
        elif 10451 <= zip_int <= 10475:
            return 'Bronx'
        elif 11201 <= zip_int <= 11256:
            return 'Brooklyn'
        elif (11351 <= zip_int <= 11697) or (11001 <= zip_int <= 11005):
            return 'Queens'
        elif 10301 <= zip_int <= 10314:
            return 'Staten Island'
        return 'Unknown'

    nyc_df['borough'] = nyc_df['zip_code'].apply(get_borough)

    # Print breakdown by borough
    print("\nBreakdown by borough:")
    borough_counts = nyc_df['borough'].value_counts()
    for borough, count in borough_counts.items():
        print(f"  {borough}: {count} ZIP codes")

    # Save NYC-only data
    nyc_df.to_csv(output_file, index=False)
    print(f"\n✓ NYC data saved to {output_file}")

    # Print sample statistics
    print("\n=== NYC Affordability Statistics ===")
    print(f"Average overall score: {nyc_df['overall_score'].mean():.2f}")
    print(f"Best ZIP (highest score): {nyc_df.loc[nyc_df['overall_score'].idxmax(), 'zip_code']} "
          f"(Score: {nyc_df['overall_score'].max():.2f})")
    print(f"Worst ZIP (lowest score): {nyc_df.loc[nyc_df['overall_score'].idxmin(), 'zip_code']} "
          f"(Score: {nyc_df['overall_score'].min():.2f})")

    print("\n✓ Complete!")

if __name__ == '__main__':
    main()
