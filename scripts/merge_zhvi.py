import pandas as pd

# Load the ZHVI dataset
zhvi_file = "ZHVI 06-30-25 - Zip_zhvi_uc_sfrcondo_tier_0.33_0.67_sm_sa_month (2).csv"  # Adjust if filename differs
zhvi = pd.read_csv(zhvi_file)

# Filter for NY zip codes
zhvi_ny = zhvi[zhvi['StateName'] == 'NY'].copy()

# Ensure zip code is 5 digits and rename for merging
zhvi_ny['zip_code'] = zhvi_ny['RegionName'].astype(str).str.zfill(5)
zhvi_ny = zhvi_ny[['zip_code', '06-30-25']]  # Keep zip and ZHVI value
zhvi_ny = zhvi_ny.rename(columns={'06-30-25': 'zhvi_value'})  # Rename for clarity

# Load your existing ny_zip_codes.csv
ny_zips_file = "ny_zip_codes.csv"
ny_zips = pd.read_csv(ny_zips_file)

# Convert zip_code in ny_zips to string to match types
ny_zips['zip_code'] = ny_zips['zip_code'].astype(str).str.zfill(5)

# Merge ZHVI data into ny_zip_codes on zip_code
updated_ny_zips = pd.merge(ny_zips, zhvi_ny, on='zip_code', how='left')

# Handle missing ZHVI (if any, fill with mean or 0)
updated_ny_zips['zhvi_value'] = updated_ny_zips['zhvi_value'].fillna(updated_ny_zips['zhvi_value'].mean())

# Save the updated file (overwrites or save as new)
updated_ny_zips.to_csv("ny_zip_codes_with_zhvi.csv", index=False)  # Or overwrite "ny_zip_codes.csv"

print("NY zip codes with ZHVI values saved to ny_zip_codes_with_zhvi.csv")