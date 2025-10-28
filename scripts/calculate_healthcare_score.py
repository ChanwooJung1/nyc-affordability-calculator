import pandas as pd
import numpy as np

# Load datasets
hospital_columns = [
    'Facility ID', 'Facility Name', 'Address', 'City', 'State', 'Zip Code', 'County', 'Phone', 
    'Facility Type', 'Ownership', 'Emergency Services', 'Meets EHR', 'Overall Rating', 
    'Unnamed1', 'Metric2', 'Metric2a', 'Metric2b', 'Metric2c', 'Metric2d', 'Unnamed2', 
    'Metric3', 'Metric3a', 'Metric3b', 'Metric3c', 'Metric3d', 'Unnamed3', 
    'Metric4', 'Metric4a', 'Metric4b', 'Metric4c', 'Metric4d', 'Unnamed4', 
    'Metric5', 'Metric5a', 'Unnamed5', 'Metric6', 'Metric6a', 'Unnamed6'
]
hospitals = pd.read_csv('C:/Users/Joseph Chanwoo Jung/affordability-heatmap/NY_Hospital_General_Information.csv', header=None, names=hospital_columns)
housing = pd.read_csv('C:/Users/Joseph Chanwoo Jung/affordability-heatmap/ny_zip_codes_with_housing.csv')
places = pd.read_csv('C:/Users/Joseph Chanwoo Jung/affordability-heatmap/places_ny_zcta.csv', low_memory=False)

# Extract and standardize zip codes
places['location_zfill'] = places['LocationName'].astype(str).str.zfill(5)
places_zip_codes = set(places['location_zfill'].unique())
housing['zip_code'] = housing['zip_code'].astype(str).str.zfill(5)
housing_zip_codes = set(housing['zip_code'].unique())
hospitals['zip_code'] = hospitals['Zip Code'].astype(str).str.zfill(5)

# Find common zip codes
common_zip_codes = places_zip_codes.intersection(housing_zip_codes)
print(f"Found {len(common_zip_codes)} common zip codes: {sorted(list(common_zip_codes))[:10]}...")

# If there are common zip codes, process the hospital data for those
if common_zip_codes:
    # Filter datasets for common zip codes
    hospitals_filtered = hospitals[hospitals['zip_code'].isin(common_zip_codes)].copy()
    places_filtered = places[places['location_zfill'].isin(common_zip_codes)].copy()
    housing_filtered = housing[housing['zip_code'].isin(common_zip_codes)].copy()
    print(f"Length of housing_filtered: {len(housing_filtered)}")
    print(f"Length of places_filtered: {len(places_filtered)}")
    print(f"Length of hospitals_filtered: {len(hospitals_filtered)}")

    # Extract population from PLACES
    population_df = places_filtered[['location_zfill', 'TotalPopulation']].drop_duplicates()
    population_df = population_df.rename(columns={'location_zfill': 'zip_code'})
    print(f"Length of population_df: {len(population_df)}")

    # Step 1: Filter relevant hospitals
    hospitals_filtered = hospitals_filtered[~hospitals_filtered['Facility Type'].isin(['Psychiatric', 'Childrens', 'Acute Care - Veterans Administration', 'Acute Care - Department of Defense'])]

    # Step 2: Access - Count hospitals per zip code, normalize by population with new method
    hospital_counts = hospitals_filtered.groupby('zip_code').size().reset_index(name='hospital_count')
    print(f"Length of hospital_counts: {len(hospital_counts)}")
    merged = pd.merge(hospital_counts, population_df[['zip_code', 'TotalPopulation']], on='zip_code', how='right')
    merged['hospital_count'] = merged['hospital_count'].fillna(0)
    merged['density_per_100k'] = (merged['hospital_count'] / merged['TotalPopulation']) * 100000
    log_density = np.log1p(merged['density_per_100k'])
    min_log = log_density.min()
    max_log = log_density.max()
    merged['access_score'] = (log_density - min_log) / (max_log - min_log + 1e-10) * 100
    print(f"Length of merged (access): {len(merged)}")

    # Step 3: Quality - Use overall hospital rating
    hospitals_filtered['Overall Rating'] = pd.to_numeric(hospitals_filtered['Overall Rating'], errors='coerce')
    quality_scores = hospitals_filtered.groupby('zip_code')['Overall Rating'].mean().reset_index(name='quality_score')
    if not quality_scores.empty:
        quality_scores['quality_score'] = (quality_scores['quality_score'] - quality_scores['quality_score'].min()) / (quality_scores['quality_score'].max() - quality_scores['quality_score'].min() + 1e-10) * 100
    else:
        quality_scores['quality_score'] = 50.0
    print(f"Length of quality_scores: {len(quality_scores)}")

    # Step 4: Insurance - Filter PLACES for uninsured measure
    places_uninsured = places_filtered[(places_filtered['MeasureId'] == 'ACCESS2') & (places_filtered['DataValueTypeID'] == 'CrdPrv')].copy()
    if places_uninsured.empty:
        print("Warning: No 'ACCESS2' and 'CrdPrv' data found. Available MeasureId:", places_filtered['MeasureId'].unique())
        print("Available DataValueTypeID:", places_filtered['DataValueTypeID'].unique())
        places_uninsured = places_filtered[places_filtered['Measure'].str.contains('Uninsured', case=False, na=False)].copy()
    print(f"Length of places_uninsured: {len(places_uninsured)}")
    if not places_uninsured.empty:
        places_uninsured['zip_code'] = places_uninsured['LocationName'].astype(str).str.zfill(5)
        places_uninsured['insurance_score'] = 100 - pd.to_numeric(places_uninsured['Data_Value'], errors='coerce')
    else:
        places_uninsured = pd.DataFrame({'zip_code': list(common_zip_codes), 'insurance_score': 50.0})

    # Step 5: Merge all components
    df = housing_filtered[['zip_code']].copy()
    print(f"Length of df after housing: {len(df)}")
    df = pd.merge(df, merged[['zip_code', 'access_score']], on='zip_code', how='left')
    print(f"Length of df after access merge: {len(df)}")
    df = pd.merge(df, quality_scores[['zip_code', 'quality_score']], on='zip_code', how='left')
    print(f"Length of df after quality merge: {len(df)}")
    df = pd.merge(df, places_uninsured[['zip_code', 'insurance_score']].drop_duplicates(subset='zip_code'), on='zip_code', how='left')
    print(f"Length of df after insurance merge: {len(df)}")

    # Step 6: Fill missing values with means
    df['access_score'] = df['access_score'].fillna(df['access_score'].mean())
    df['quality_score'] = df['quality_score'].fillna(df['quality_score'].mean())
    df['insurance_score'] = df['insurance_score'].fillna(df['insurance_score'].mean())

    # Step 7: Compute healthcare score
    df['healthcare_score'] = (0.4 * df['access_score'] + 0.4 * df['quality_score'] + 0.2 * df['insurance_score'])

    # Step 8: Save to CSV with all scores
    df[['zip_code', 'access_score', 'quality_score', 'insurance_score', 'healthcare_score']].to_csv('C:/Users/Joseph Chanwoo Jung/affordability-heatmap/ny_healthcare_scores.csv', index=False)
    print(df[['zip_code', 'access_score', 'quality_score', 'insurance_score', 'healthcare_score']].head())
else:
    print("No common zip codes found. Cannot proceed with healthcare score calculation.")