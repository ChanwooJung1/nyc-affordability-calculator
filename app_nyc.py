from flask import Flask, render_template, jsonify, request
import pandas as pd
import numpy as np
import os
import math

app = Flask(__name__)

# Load the NYC affordability data
# Use relative paths that work on both local and production
base_dir = os.path.dirname(os.path.abspath(__file__))
affordability_path = os.path.join(base_dir, 'nyc_affordability_scores.csv')
affordability_df = pd.read_csv(affordability_path)

# Load rental listings for test ZIP codes
rental_data = {}
all_rentals = []
test_zip_codes = ['10001', '11201', '11203']
for zip_code in test_zip_codes:
    csv_path = os.path.join(base_dir, 'nyc-affordability-calculator', f'{zip_code} Rental Listings.csv')
    if os.path.exists(csv_path):
        df = pd.read_csv(csv_path)
        # Normalize column names
        df_normalized = df.rename(columns={
            'address': 'Address',
            'zip': 'Zip Code',
            'price': 'Rental Price',
            'lat': 'Latitude',
            'lng': 'Longitude',
            'bedrooms': 'Bedrooms',
            'bathrooms': 'Bathrooms',
            'sqft': 'Square Feet',
            'Transit Score': 'Transit Score',
            'Social Score': 'Social Score',
            'Grocery Score': 'Grocery Score'
        })
        # Ensure Zip Code exists
        if 'Zip Code' not in df_normalized.columns:
            df_normalized['Zip Code'] = zip_code
        # Fill missing scores with 0
        for col in ['Transit Score', 'Social Score', 'Grocery Score']:
            if col not in df_normalized.columns:
                df_normalized[col] = 0

        # Fill NaN values before converting to dict
        df_normalized = df_normalized.fillna({
            'Transit Score': 0,
            'Social Score': 0,
            'Grocery Score': 0,
            'Bedrooms': 1,
            'Bathrooms': 1,
            'Square Feet': 0
        })

        # Convert to dict
        rentals_list = df_normalized.to_dict(orient='records')

        # Additional cleanup to ensure no NaN values slip through
        cleaned_rentals = []
        for rental in rentals_list:
            cleaned = {}
            for key, value in rental.items():
                # Check for various forms of NaN
                if value is None or (isinstance(value, float) and (math.isnan(value) or math.isinf(value))):
                    # Set defaults for numeric fields
                    if key in ['Transit Score', 'Social Score', 'Grocery Score']:
                        cleaned[key] = 0
                    elif key in ['Bedrooms', 'Bathrooms']:
                        cleaned[key] = 1
                    elif key in ['Square Feet']:
                        cleaned[key] = 0
                    elif key in ['Rental Price']:
                        cleaned[key] = 3000  # Default price
                    else:
                        cleaned[key] = ""  # Empty string instead of None for text fields
                else:
                    cleaned[key] = value
            cleaned_rentals.append(cleaned)

        rental_data[zip_code] = cleaned_rentals
        all_rentals.extend(cleaned_rentals)
        print(f"Loaded {len(rentals_list)} rentals for ZIP {zip_code}")
    else:
        rental_data[zip_code] = []

print(f"Total rentals loaded: {len(all_rentals)}")

# Prepare data for charts
chart_data = affordability_df.to_dict(orient='records')
zip_codes = [str(row['zip_code']) for row in chart_data]
overall_scores = [row['overall_score'] for row in chart_data]

# New scores (social, transit, housing)
housing_scores = [row.get('housing_score', 0) for row in chart_data]
social_scores = [row.get('social_score', 0) for row in chart_data]
transit_scores = [row.get('transit_score', 0) for row in chart_data]

# Old scores (kept for reference, not displayed by default)
tax_scores = [row.get('tax_score', 0) for row in chart_data]
healthcare_scores = [row.get('healthcare_score', 0) for row in chart_data]

boroughs = [row['borough'] for row in chart_data]
latitudes = [row.get('lat', 40.7128) for row in chart_data]
longitudes = [row.get('lng', -74.0060) for row in chart_data]

# Normalize overall_scores for heatmap color (0-1 scale)
min_score = min(overall_scores)
max_score = max(overall_scores)
normalized_scores = [(score - min_score) / (max_score - min_score + 1e-10) for score in overall_scores]

# Debug: Print sample ZIP codes
print("Sample NYC ZIP codes:", zip_codes[:10])
print(f"Total NYC ZIP codes: {len(zip_codes)}")

@app.route('/')
def index():
    return render_template('index_nyc.html',
                          zip_codes=zip_codes,
                          overall_scores=overall_scores,
                          housing_scores=housing_scores,
                          social_scores=social_scores,
                          transit_scores=transit_scores,
                          tax_scores=tax_scores,
                          healthcare_scores=healthcare_scores,
                          boroughs=boroughs,
                          latitudes=latitudes,
                          longitudes=longitudes,
                          normalized_scores=normalized_scores)

def calculate_affordability_scores(rentals, weights):
    """Calculate affordability scores for rentals"""
    if not rentals:
        return []

    # Get median price for normalization
    prices = [r.get('Rental Price', 0) for r in rentals if r.get('Rental Price')]
    median_price = pd.Series(prices).median() if prices else 3000

    scored_rentals = []
    for rental in rentals:
        price = rental.get('Rental Price', 0)
        transit = rental.get('Transit Score', 0)
        social = rental.get('Social Score', 0)
        grocery = rental.get('Grocery Score', 0)

        # Housing affordability (0-100, lower price = higher score)
        housing_score = max(0, min(100, 100 - ((price - median_price) / median_price * 100)))

        # Social and Grocery scores are already normalized to 0-100 (no decimals needed)
        social_normalized = int(social) if social > 0 else 0
        grocery_normalized = int(grocery) if grocery > 0 else 0

        # Calculate overall affordability index
        affordability_index = (
            housing_score * weights['affordability'] +
            transit * weights['transit'] +
            social_normalized * weights['social'] +
            grocery_normalized * weights['grocery']
        )

        # Add calculated scores to rental (all integers, no decimals)
        rental_copy = rental.copy()
        rental_copy['Affordability Score'] = int(round(housing_score))
        rental_copy['Social Score (Normalized)'] = social_normalized
        rental_copy['Grocery Score (Normalized)'] = grocery_normalized
        rental_copy['Affordability Index'] = int(round(affordability_index))

        scored_rentals.append(rental_copy)

    return scored_rentals

@app.route('/calculator')
def calculator():
    """Main calculator page"""
    zip_filter = request.args.get('zip', '')
    return render_template('calculator.html', zip_filter=zip_filter)

@app.route('/rental')
def rental_detail():
    """Individual rental detail page"""
    zip_code = request.args.get('zip', '')
    index = request.args.get('index', 0, type=int)
    return render_template('rental_detail.html', zip_code=zip_code, index=index)

@app.route('/api/rentals')
def get_all_rentals():
    """API endpoint to get all rentals with scores"""
    weights = {
        'affordability': float(request.args.get('affordabilityWeight', 0.6)),
        'transit': float(request.args.get('transitWeight', 0.2)),
        'social': float(request.args.get('socialWeight', 0.1)),
        'grocery': float(request.args.get('groceryWeight', 0.1))
    }

    rentals_with_scores = calculate_affordability_scores(all_rentals, weights)

    # Sort by affordability index (descending)
    sort_by = request.args.get('sortBy', 'Affordability Index')
    reverse = True if sort_by == 'Affordability Index' else False
    rentals_with_scores.sort(key=lambda x: x.get(sort_by, 0), reverse=reverse)

    return jsonify({
        'success': True,
        'count': len(rentals_with_scores),
        'rentals': rentals_with_scores,
        'weights': weights
    })

@app.route('/api/rentals/zip/<zip_code>')
def get_rentals_by_zip(zip_code):
    """API endpoint to get rental listings for a specific ZIP code with scores"""
    if zip_code in rental_data and rental_data[zip_code]:
        weights = {
            'affordability': float(request.args.get('affordabilityWeight', 0.6)),
            'transit': float(request.args.get('transitWeight', 0.2)),
            'social': float(request.args.get('socialWeight', 0.1)),
            'grocery': float(request.args.get('groceryWeight', 0.1))
        }

        rentals_with_scores = calculate_affordability_scores(rental_data[zip_code], weights)
        rentals_with_scores.sort(key=lambda x: x.get('Affordability Index', 0), reverse=True)

        return jsonify({
            'success': True,
            'zip_code': zip_code,
            'rentals': rentals_with_scores,
            'count': len(rentals_with_scores)
        })
    else:
        return jsonify({
            'success': False,
            'zip_code': zip_code,
            'message': 'No rental data available for this ZIP code',
            'count': 0
        })

@app.route('/api/rental')
def get_single_rental():
    """API endpoint to get a single rental by ZIP and index"""
    zip_code = request.args.get('zip')
    index = request.args.get('index', type=int)

    if not zip_code or index is None:
        return jsonify({
            'success': False,
            'error': 'Missing zip or index parameter'
        }), 400

    if zip_code not in rental_data or not rental_data[zip_code]:
        return jsonify({
            'success': False,
            'error': 'No rental data for this ZIP code'
        }), 404

    if index < 0 or index >= len(rental_data[zip_code]):
        return jsonify({
            'success': False,
            'error': 'Invalid rental index'
        }), 404

    weights = {
        'affordability': float(request.args.get('affordabilityWeight', 0.6)),
        'transit': float(request.args.get('transitWeight', 0.2)),
        'social': float(request.args.get('socialWeight', 0.1)),
        'grocery': float(request.args.get('groceryWeight', 0.1))
    }

    rentals_with_scores = calculate_affordability_scores(rental_data[zip_code], weights)

    return jsonify({
        'success': True,
        'rental': rentals_with_scores[index],
        'weights': weights
    })

if __name__ == '__main__':
    # Use environment variable for port (required for Render)
    port = int(os.environ.get('PORT', 5000))
    # Debug mode should be False in production
    debug = os.environ.get('FLASK_ENV') != 'production'
    app.run(host='0.0.0.0', port=port, debug=debug)
