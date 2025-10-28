import pandas as pd

# Load the affordability scores CSV
data_path = 'C:/Users/Joseph Chanwoo Jung/affordability-heatmap/ny_affordability_scores.csv'
df = pd.read_csv(data_path)

# Define weights (sum to 1, housing at least 50%)
weights = {
    'housing_score': 0.50,  # 50%
    'tax_score': 0.25,     # 25%
    'healthcare_score': 0.25  # 25%
}

# Calculate the weighted overall score
df['overall_score'] = (df['housing_score'] * weights['housing_score'] +
                       df['tax_score'] * weights['tax_score'] +
                       df['healthcare_score'] * weights['healthcare_score'])

# Save the updated CSV
df.to_csv(data_path, index=False)

# Preview the first few rows to verify
print(df.head())