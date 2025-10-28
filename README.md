# NYC Affordability Calculator

**A two-tier system to calculate true cost of living across New York City**

An interactive web application that reveals the neighborhoods where your **total cost of living** - not just rent - is truly affordable. Combines an interactive heatmap of all NYC zip codes with detailed rental listings showing housing, transportation, daily living, and grocery affordability scores.

![NYC Heatmap Preview](https://via.placeholder.com/800x400?text=NYC+Affordability+Calculator)

## The Problem

A $2,500 rental in a car-dependent neighborhood can cost MORE overall than a $3,000 rental with excellent subway access and nearby discount grocers.

## The Solution

### Two-Tier System

**TIER 1: NYC Zip Code Heatmap** (Python/Flask - port 5000)
- Interactive map showing all NYC zip codes
- Color-coded by overall Affordability Index
- Aggregate scores: median rent, avg transit/daily living/grocery
- Click zip code to drill down to listings

**TIER 2: Individual Rental Listings** (Node.js/Express - port 3000)
- Manually collected Zillow listings with detailed affordability scores
- Four scores displayed in-app with visual progress bars
- Customizable weight sliders (60/20/10/10 defaults)
- No external links - all data displayed in-app

## Features

- **Four Affordability Scores**: Housing (60%), Transportation (20%), Daily Living (10%), Grocery (10%)
- **Comprehensive Cost Analysis**: Reveals $400-800/month savings from good transit and $100-200/month from discount grocers
- **Manual Data Collection**: Rent prices collected from Zillow, enriched with Google API scores
- **Interactive UI**: Sort, filter, adjust weights, see real-time recalculation
- **Production-Ready**: Clean Bootstrap 5 design, scalable to 100+ listings

## Quick Start

### TIER 1: Run the Heatmap (Python/Flask)

**Prerequisites:** Python 3.x, Flask, pandas

```bash
# Install dependencies
pip install flask pandas

# Run the heatmap server
python app_nyc.py

# Open browser to: http://localhost:5000
```

### TIER 2: Run the Rental Listings App (Node.js/Express)

**Prerequisites:** Node.js, Google API keys

```bash
cd nyc-affordability-calculator

# Install dependencies
npm install

# Configure .env with Google API keys
# GOOGLE_PLACES_API_KEY=your_key
# GOOGLE_DISTANCE_MATRIX_API_KEY=your_key

# Run the rental listings server
npm start

# Open browser to: http://localhost:3000
```

See `nyc-affordability-calculator/README.md` for detailed setup instructions.

## How It Works

### Affordability Index (0-100)

The overall Affordability Index combines four factors tied to monthly cost savings:

- **💰 Housing Affordability (60%)**: Rent vs. neighborhood median - saves $200-500/month
- **🚇 Transportation Affordability (20%)**: Good transit eliminates car ownership - saves $400-800/month
- **☕ Daily Living Affordability (10%)**: Walkable venues eliminate delivery fees - saves $100-200/month
- **🛒 Grocery Affordability (10%)**: Discount stores vs. premium stores - saves $100-200/month

**Higher scores = Lower total monthly cost of living**

**Key Insight:** Car ownership costs $9,000+/year ($750/month). A $3,000 rental with excellent transit and grocery access can cost LESS overall than a $2,500 rental that requires a car.

### Heatmap Color Coding

| Color | Score Range | Meaning |
|-------|-------------|---------|
| Dark Green | 80-100 | Excellent affordability |
| Green | 60-80 | Good affordability |
| Light Green | 40-60 | Moderate affordability |
| Yellow | 20-40 | Fair affordability |
| Red | 0-20 | Poor affordability |

### NYC Coverage

**Current:** Prototype with 20 Brooklyn rentals (2 zip codes)
**Planned:** 100+ listings across 10-20 priority NYC zip codes

- Manhattan, Brooklyn, Queens, Bronx, Staten Island
- 10 listings per target zip code
- Scalable to 500+ listings for full NYC coverage

## Usage

### Using the Heatmap (TIER 1)
1. Visit `http://localhost:5000` to see the NYC zip code heatmap
2. Filter by borough: Manhattan, Brooklyn, Queens, Bronx, or Staten Island
3. Click a zip code to see aggregate scores (median rent, avg scores)
4. Use aggregate data to identify affordable neighborhoods

### Using the Rental Listings App (TIER 2)
1. Visit `http://localhost:3000` for detailed rental comparisons
2. View rental cards with all four affordability scores
3. Adjust weight sliders to customize priorities (60/20/10/10 defaults)
4. Sort by Affordability Index, rent price, or individual scores
5. Filter by zip code to focus on specific neighborhoods
6. All data displayed in-app - no external Zillow links

## Project Structure

```
affordability-heatmap/
├── app_nyc.py                           # TIER 1: Flask heatmap server (port 5000)
├── nyc_affordability_scores.csv         # Zip code aggregate scores for heatmap
├── templates/index_nyc.html             # Heatmap UI
├── static/ny_zip_codes.json             # GeoJSON boundaries
├── scripts/                             # Data processing scripts
│   ├── create_nyc_only_data.py
│   └── ... (scoring scripts)
├── nyc-affordability-calculator/        # TIER 2: Rental listings app (port 3000)
│   ├── server.js                        # Express server
│   ├── scoreCalculator.js               # Affordability Index (60/20/10/10)
│   ├── placesAPI.js                     # Google Places API integration
│   ├── transitAPI.js                    # Google Distance Matrix API
│   ├── rentals.csv                      # Manually collected listings with scores
│   ├── zipcode_scores.csv               # Aggregate scores for heatmap
│   ├── updateDailyLivingScores.js       # Script: Coffee shops, restaurants
│   ├── updateGroceryScores.js           # Script: Grocery store categorization
│   ├── updateTransitScores.js           # Script: Transit times
│   ├── calculateZipCodeScores.js        # Script: Zip code aggregates
│   ├── public/index.html                # Rental listings UI (in-app cards)
│   ├── .env                             # Google API keys
│   └── README.md                        # Detailed documentation
└── README.md                            # This file (project overview)
```

## Data Sources

**Rental Prices:** Manually collected from Zillow (10 listings per zip code)

**Transit Scores:** Google Distance Matrix API
- Measures commute times to Manhattan Financial District, Midtown, Downtown Brooklyn
- Uses public transit mode

**Daily Living Scores:** Google Places API
- Counts coffee shops and restaurants within 0.5 miles

**Grocery Scores:** Google Places API
- Categorizes grocery stores as budget (+10), regular (+5), or premium (-3)
- Formula: `(budget × 10) + (regular × 5) - (premium × 3)`

**Geographic Data:** US Census Bureau ZIP Code Tabulation Areas (ZCTA)

## Data Collection Workflow

1. **Manually add listings to rentals.csv**
   - Collect 10 Zillow listings per target zip code
   - Include address, price, coordinates, property details

2. **Run API enrichment scripts**
   ```bash
   cd nyc-affordability-calculator
   node updateDailyLivingScores.js
   node updateGroceryScores.js
   node updateTransitScores.js
   ```

3. **Generate zip code aggregates**
   ```bash
   node calculateZipCodeScores.js
   ```

4. **View results**
   - Heatmap: `http://localhost:5000`
   - Detailed listings: `http://localhost:3000`

## Future Enhancements

### Phase 2 (Post-Launch)
- Mobile-responsive optimizations
- Expand to 100-500 listings across 20+ NYC zip codes
- User accounts and saved searches
- Email alerts for new affordable listings

### Phase 3 (Advanced Features)
- StreetEasy integration as alternative data source
- Subway station overlay on heatmap
- School quality and crime statistics
- Custom commute calculator (enter your work address)

## Technical Details

- **Frontend**: Bootstrap 5, Vanilla JS, Leaflet.js
- **Backend**: Flask (Python) for heatmap, Express (Node.js) for rental listings
- **APIs**: Google Places API (New), Google Distance Matrix API
- **Data Storage**: CSV files (manual entry + API enrichment)
- **Deployment**: Ready for Heroku, Render, or any Node.js/Python host

## Author

Joseph Chanwoo Jung

## License

MIT License

---

**Note**: This project links to external services (Zillow) for rental listings. The affordability scores are calculated from publicly available data and are for informational purposes only.
