from flask import Flask, render_template
import pandas as pd

app = Flask(__name__)

# Load the affordability and housing data
affordability_path = 'C:/Users/Joseph Chanwoo Jung/affordability-heatmap/ny_affordability_scores.csv'
housing_path = 'C:/Users/Joseph Chanwoo Jung/affordability-heatmap/ny_zip_codes_with_housing.csv'
affordability_df = pd.read_csv(affordability_path)
housing_df = pd.read_csv(housing_path)

# Merge with geographic data
merged_df = pd.merge(affordability_df, housing_df[['zip_code', 'lat', 'lng']], on='zip_code', how='left')

# Define weights (housing 50%, tax 25%, healthcare 25%)
weights = {'housing_score': 0.50, 'tax_score': 0.25, 'healthcare_score': 0.25}
# Calculate the weighted overall score
merged_df['overall_score'] = (merged_df['housing_score'] * weights['housing_score'] +
                              merged_df['tax_score'] * weights['tax_score'] +
                              merged_df['healthcare_score'] * weights['healthcare_score'])

# Prepare data for charts
chart_data = merged_df.to_dict(orient='records')  # All ZIP codes
zip_codes = [str(row['zip_code']) for row in chart_data]  # Ensure string format
overall_scores = [row['overall_score'] for row in chart_data]
latitudes = [row.get('lat', 40.7128) for row in chart_data]  # Default NYC lat
longitudes = [row.get('lng', -74.0060) for row in chart_data]  # Default NYC lng
# Normalize overall_scores for heatmap color (0-1 scale for gradient)
min_score = min(overall_scores)
max_score = max(overall_scores)
normalized_scores = [(score - min_score) / (max_score - min_score + 1e-10) for score in overall_scores]

# Debug: Print sample ZIP codes from data
print("Sample ZIP codes from data:", zip_codes[:10])

@app.route('/')
def index():
    return render_template('index.html', 
                          zip_codes=zip_codes, 
                          overall_scores=overall_scores,
                          latitudes=latitudes, 
                          longitudes=longitudes, 
                          normalized_scores=normalized_scores)

if __name__ == '__main__':
    app.run(debug=True)