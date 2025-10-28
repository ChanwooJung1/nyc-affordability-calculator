"""
Update Overall Score Formula
New formula uses: Housing (40%), Social (30%), Transit (30%)
Old scores (tax, healthcare) are kept in CSV but not used in overall score
"""

import pandas as pd

def calculate_new_overall_score(row, weights=None):
    """
    Calculate overall score using new formula

    Args:
        row: DataFrame row with score columns
        weights: Dict with weights for each factor
                Default: housing 40%, social 30%, transit 30%

    Returns:
        float: Overall score (0-100)
    """
    if weights is None:
        weights = {
            'housing': 0.40,
            'social': 0.30,
            'transit': 0.30
        }

    # Get scores (use 0 if not available)
    housing_score = row.get('housing_score', 0) or 0
    social_score = row.get('social_score', 0) or 0
    transit_score = row.get('transit_score', 0) or 0

    # Calculate weighted average
    overall = (
        housing_score * weights['housing'] +
        social_score * weights['social'] +
        transit_score * weights['transit']
    )

    return round(overall, 2)

def main():
    print("\n=== Update Overall Score Formula ===\n")

    # Read NYC data
    csv_path = '../nyc_affordability_scores.csv'
    print(f"Reading {csv_path}...")
    df = pd.read_csv(csv_path)
    print(f"Found {len(df)} NYC ZIP codes\n")

    # Check if new scores exist
    has_social = 'social_score' in df.columns and df['social_score'].notna().any()
    has_transit = 'transit_score' in df.columns and df['transit_score'].notna().any()

    if not has_social:
        print("⚠️  Warning: social_score column is empty or missing")
        print("   Run calculate_social_scores.py first\n")

    if not has_transit:
        print("⚠️  Warning: transit_score column is empty or missing")
        print("   Run calculate_transit_scores.py first\n")

    if not has_social and not has_transit:
        print("Cannot update overall score without social and transit scores.")
        print("\nNext steps:")
        print("1. Run: python calculate_social_scores.py")
        print("2. Run: python calculate_transit_scores.py")
        print("3. Run: python update_overall_score.py")
        return

    # Show current formula
    print("=== New Overall Score Formula ===")
    print("Overall Score = (Housing × 40%) + (Social × 30%) + (Transit × 30%)")
    print("")
    print("Old scores (tax, healthcare) are preserved in CSV for future use\n")

    # Recalculate overall scores
    print("Recalculating overall scores...")
    df['overall_score'] = df.apply(calculate_new_overall_score, axis=1)

    # Save results
    print("Saving updated scores...")
    df.to_csv(csv_path, index=False)
    print(f"✓ Data saved to {csv_path}\n")

    # Print summary
    print("=== Summary ===")
    print(f"Total ZIP codes: {len(df)}")
    print(f"Average overall score: {df['overall_score'].mean():.1f}/100")
    print(f"Max overall score: {df['overall_score'].max()}/100")
    print(f"Min overall score: {df['overall_score'].min()}/100")

    # Show top 5 overall best ZIP codes
    print("\nTop 5 Best Overall ZIP Codes:")
    top_overall = df.nlargest(5, 'overall_score')[['zip_code', 'borough', 'housing_score', 'social_score', 'transit_score', 'overall_score']]
    print(top_overall.to_string(index=False))

    # Show breakdown by borough
    print("\n=== Average Scores by Borough ===")
    borough_avg = df.groupby('borough')[['housing_score', 'social_score', 'transit_score', 'overall_score']].mean().round(1)
    print(borough_avg.to_string())

    print("\n✓ Overall scores updated successfully!")
    print("\nNote: Old scores (tax_score, healthcare_score) are still in the CSV")
    print("      but are not used in the current overall_score calculation.")

if __name__ == '__main__':
    main()
