import pandas as pd

# Load ZHVI (use the actual filename)
print("Loading ZHVI file...")
zhvi = pd.read_csv("Housing Fee data.csv")
print("ZHVI loaded, shape:", zhvi.shape)

# Filter for NY
print("Filtering for NY...")
zhvi_ny = zhvi[zhvi['StateName'] == 'NY'].copy()
zhvi_ny['zip_code'] = zhvi_ny['RegionName'].astype(str).str.zfill(5)
zhvi_ny = zhvi_ny[['zip_code', '06-30-25']].rename(columns={'06-30-25': 'housing_value'})
print("NY ZHVI filtered, shape:", zhvi_ny.shape)

# Normalize to housing score (lower value = higher score)
print("Normalizing housing scores...")
min_val = zhvi_ny['housing_value'].min()
max_val = zhvi_ny['housing_value'].max()
zhvi_ny['housing_score'] = 100 - ((zhvi_ny['housing_value'] - min_val) / (max_val - min_val) * 100)
print("Housing scores calculated, min:", min_val, "max:", max_val)

# Load ny_zip_codes.csv
print("Loading ny_zip_codes.csv...")
ny_zips = pd.read_csv("ny_zip_codes.csv")
ny_zips['zip_code'] = ny_zips['zip_code'].astype(str).str.zfill(5)
print("NY zips loaded, shape:", ny_zips.shape)

# Merge
print("Merging data...")
updated_ny = pd.merge(ny_zips, zhvi_ny, on='zip_code', how='left')
print("Merged data shape:", updated_ny.shape)

# Fill missing with mean
print("Filling missing values...")
updated_ny['housing_value'] = updated_ny['housing_value'].fillna(updated_ny['housing_value'].mean())
updated_ny['housing_score'] = updated_ny['housing_score'].fillna(updated_ny['housing_score'].mean())
print("Filled missing values, housing_value mean:", updated_ny['housing_value'].mean())

# Save
print("Saving file...")
updated_ny.to_csv("ny_zip_codes_with_housing.csv", index=False)
print("Housing scores saved to ny_zip_codes_with_housing.csv")