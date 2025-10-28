import pandas as pd

# Load IRS data
print("Loading IRS data...")
irs = pd.read_excel("21zp33ny.xlsx", skiprows=6)  # Skip to data start
print("IRS data loaded, shape:", irs.shape)

# Print column names to verify
print("Column names:", irs.columns.tolist())

# Filter for per-zip total rows (column 1 is NaN, column 0 is numeric zip > 0)
print("Filtering for per-zip total rows...")
irs_total = irs[irs.iloc[:, 1].isna() & pd.to_numeric(irs.iloc[:, 0], errors='coerce').notna() & (pd.to_numeric(irs.iloc[:, 0], errors='coerce') > 0)]
print("Per-zip total rows filtered, shape:", irs_total.shape)

# Debug: Check if 10162 is in the data
print("Checking for ZIP 10162...")
if 10162 in pd.to_numeric(irs.iloc[:, 0], errors='coerce').dropna().values:
    print("ZIP 10162 found in raw data.")
    irs_10162 = irs[pd.to_numeric(irs.iloc[:, 0], errors='coerce') == 10162]
    print("Row for 10162:", irs_10162.iloc[:, [0, 1, 7, 55]].to_string())
else:
    print("ZIP 10162 not found in raw data.")

# Create full list of NY zip codes
ny_zips = pd.DataFrame({'zip_code': [str(z).zfill(5) for z in range(10001, 14998)]})  # All potential NY zips

# Proceed if not empty
if not irs_total.empty:
    # Extract and format zip code
    irs_total['zip_code'] = pd.to_numeric(irs_total.iloc[:, 0], errors='coerce').astype(str).str.zfill(5)

    # Calculate effective tax rate
    print("Calculating tax rate...")
    irs_total['tax_rate'] = irs_total.iloc[:, 55].div(irs_total.iloc[:, 7], fill_value=0)  # A07100 / A00100
    irs_total['tax_rate'] = irs_total['tax_rate'].replace([float('inf'), -float('inf')], 0)  # Handle infinity
    print("Tax rate calculated, sample:", irs_total['tax_rate'].head())

    # Normalize to tax score (lower rate = higher score)
    print("Normalizing tax scores...")
    min_rate = irs_total['tax_rate'].min()
    max_rate = irs_total['tax_rate'].max()
    if min_rate == max_rate:
        print("Min and max tax rates are equal. Setting tax_score to 100.")
        irs_total['tax_score'] = 100
    else:
        irs_total['tax_score'] = 100 - ((irs_total['tax_rate'] - min_rate) / (max_rate - min_rate) * 100)
    print(f"Tax scores normalized, min rate: {min_rate}, max rate: {max_rate}, sample scores:", irs_total['tax_score'].head())

    # Merge with full zip list and fill missing with mean
    tax_data = pd.merge(ny_zips, irs_total[['zip_code', 'tax_rate', 'tax_score']], on='zip_code', how='left')
    tax_data['tax_score'] = tax_data['tax_score'].fillna(tax_data['tax_score'].mean())
    tax_data['tax_rate'] = tax_data['tax_rate'].fillna(0)  # Placeholder for missing rates
    print(f"Missing zips filled with mean tax_score: {tax_data['tax_score'].mean()}")

    # Save results
    print("Saving tax scores...")
    tax_data[['zip_code', 'tax_rate', 'tax_score']].to_csv("ny_property_tax_scores.csv", index=False)
    print("Tax scores saved to ny_property_tax_scores.csv")
else:
    print("No data to save. Check the unique values and adjust the filter.")