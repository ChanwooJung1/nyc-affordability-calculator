import pandas as pd

# Load datasets
healthcare_df = pd.read_csv('C:/Users/Joseph Chanwoo Jung/affordability-heatmap/ny_healthcare_scores.csv')
affordability_df = pd.read_csv('C:/Users/Joseph Chanwoo Jung/affordability-heatmap/ny_affordability_scores.csv')

# Ensure zip_code is standardized (though already 5-digit from previous steps)
healthcare_df['zip_code'] = healthcare_df['zip_code'].astype(str).str.zfill(5)
affordability_df['zip_code'] = affordability_df['zip_code'].astype(str).str.zfill(5)

# Merge datasets on zip_code, keeping all rows from affordability_df
merged_df = pd.merge(affordability_df, healthcare_df, on='zip_code', how='left', suffixes=('_afford', '_health'))

# Fill missing healthcare scores with NaN (or a default like 0 if preferred, but NaN preserves intent)
merged_df['access_score'] = merged_df['access_score'].fillna(0)
merged_df['quality_score'] = merged_df['quality_score'].fillna(0)
merged_df['insurance_score'] = merged_df['insurance_score'].fillna(0)
merged_df['healthcare_score'] = merged_df['healthcare_score'].fillna(0)

# Save the merged dataframe back to ny_affordability_scores.csv
merged_df.to_csv('C:/Users/Joseph Chanwoo Jung/affordability-heatmap/ny_affordability_scores.csv', index=False)

# Preview the first few rows
print(merged_df.head())

# Check for any zip codes that didn't merge
missing_healthcare_zips = merged_df[merged_df['healthcare_score'].isna()]['zip_code'].unique()
if len(missing_healthcare_zips) > 0:
    print(f"Warning: {len(missing_healthcare_zips)} zip codes from affordability_df have no healthcare data: {missing_healthcare_zips[:10]}...")
else:
    print("All zip codes successfully merged with healthcare data.")