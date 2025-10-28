import pandas as pd

# Load your CSV file
file_path = "uszips.csv"  # Confirm this matches your file name
df = pd.read_csv(file_path, low_memory=False)  # Added low_memory=False to handle mixed types

# Ensure zip codes are 5 digits
df['zip'] = df['zip'].astype(str).str.zfill(5)  # Use 'zip' as the column name from uszips.csv

# Filter for New York
ny_df = df[df['state_name'] == 'New York']  # Filter where state_name is 'New York'

# Select relevant columns: zip, lat, lng
ny_data = ny_df[['zip', 'lat', 'lng']].dropna()  # Drop rows with missing lat or lng

# Save to CSV with zip, lat, and lng
ny_zip_df = ny_data.rename(columns={'zip': 'zip_code'})  # Rename 'zip' to 'zip_code' for consistency
ny_zip_df.to_csv("ny_zip_codes.csv", index=False)

print(f"Extracted {len(ny_zip_df)} NY zip codes with lat/lng. Saved to ny_zip_codes.csv")