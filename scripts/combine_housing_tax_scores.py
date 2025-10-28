import pandas as pd

# Load housing data
print("Loading housing data...")
housing = pd.read_csv("ny_zip_codes_with_housing.csv")
print("Housing data loaded, shape:", housing.shape)

# Load property tax data
print("Loading property tax data...")
tax = pd.read_csv("ny_property_tax_scores.csv")
print("Property tax data loaded, shape:", tax.shape)

# Merge datasets on zip_code
print("Merging datasets...")
combined = pd.merge(housing, tax, on='zip_code', how='left')
print("Merged data shape:", combined.shape)

# Fill missing tax scores with mean (if any)
if combined['tax_score'].isna().any():
    mean_tax_score = combined['tax_score'].mean()
    combined['tax_score'] = combined['tax_score'].fillna(mean_tax_score)
    print(f"Missing tax scores filled with mean: {mean_tax_score}")

# Calculate weighted affordability score
print("Calculating affordability score...")
weights = {'housing_score': 0.6, 'tax_score': 0.4}  # Adjust weights as needed
combined['affordability_score'] = (
    combined['housing_score'] * weights['housing_score'] +
    combined['tax_score'] * weights['tax_score']
)
print("Affordability score calculated, range:", combined['affordability_score'].min(), "to", combined['affordability_score'].max())

# Save results
print("Saving combined scores...")
combined.to_csv("ny_affordability_scores.csv", index=False)
print("Combined scores saved to ny_affordability_scores.csv")