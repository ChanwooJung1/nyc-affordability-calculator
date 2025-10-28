# NYC Affordability Calculator

**A comprehensive tool to calculate the true cost of living across New York City neighborhoods**

This production-ready application helps young professionals and students understand that **rent is only part of monthly housing costs**. True affordability includes transportation, daily living expenses, and grocery access - factors that can add or save hundreds of dollars per month.

---

## Why NYC Affordability Calculator?

**The Problem:** A $2,500 rental in a car-dependent neighborhood can cost MORE overall than a $3,000 rental with excellent subway access and nearby discount grocers.

**The Solution:** This calculator measures total cost of living using four affordability scores:

### The Four Pillars of Affordability (60/20/10/10)

1. **💰 Housing Affordability (60%)**
   - Compares rent to neighborhood median
   - Finding below-median rentals saves $200-500/month
   - Data: Manually collected from Zillow

2. **🚇 Transportation Affordability (20%)**
   - Measures subway access and commute times
   - Good transit eliminates car ownership: saves $400-800/month
   - Shorter commutes save 10-20 hours/month
   - Data: Google Distance Matrix API

3. **☕ Daily Living Affordability (10%)**
   - Counts walkable restaurants and cafes within 0.5 miles
   - Eliminates car-dependent errands and delivery fees: saves $100-200/month
   - Data: Google Places API

4. **🛒 Grocery Affordability (10%)**
   - Measures access to discount vs. premium grocery stores
   - Budget stores (Trader Joe's, Aldi) vs premium (Whole Foods): saves $100-200/month
   - Data: Google Places API with store categorization

**Combined, these factors calculate an overall Affordability Index (0-100 scale) that reveals the true monthly cost of living in each neighborhood.**

---

## Features

### Two-Tier System

**TIER 1: NYC Zip Code Heatmap**
- Interactive map showing all NYC zip codes
- Color-coded by Affordability Index
- Aggregate scores per zip code (median rent, avg transit/daily living/grocery)
- Click zip code to drill down to listings

**TIER 2: Individual Rental Listings**
- 10+ manually collected Zillow listings per zip code
- All data displayed in-app (no external links)
- Four detailed scores with visual progress bars
- Sort and filter by any score
- Interactive weight sliders (customize 60/20/10/10 defaults)
- Real-time recalculation

### Production-Ready
- ✅ Clean, modern Bootstrap 5 UI
- ✅ Comprehensive score explanations
- ✅ Mobile-responsive design
- ✅ CSV-based data storage (easy manual entry)
- ✅ Google API integration
- ✅ Scalable to 100+ listings across all NYC neighborhoods

---

## Quick Start

### Prerequisites

- **Node.js** (v14 or higher)
- **Google Cloud account** with:
  - Places API (New) enabled
  - Distance Matrix API enabled
- **Google API keys** (see setup below)

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up API keys:**

   Edit `.env` and verify your Google API keys are present:
   ```
   GOOGLE_PLACES_API_KEY=your_key_here
   GOOGLE_DISTANCE_MATRIX_API_KEY=your_key_here
   ```

   **How to get API keys:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Enable "Places API (New)" and "Distance Matrix API"
   - Create API keys in Credentials section
   - (Optional) Restrict keys for security

3. **Start the web server:**
   ```bash
   npm start
   ```

4. **Open your browser:**
   ```
   http://localhost:3000
   ```

---

## Data Collection Workflow

### Step 1: Manual Zillow Data Entry

Add rental listings to `rentals.csv` with:
- Address, Zip Code, Rental Price
- Bedrooms, Bathrooms, Square Feet (optional)
- Latitude, Longitude (required for API calls)
- Initial scores set to 0

**Finding coordinates:**
- Use [latlong.net](https://www.latlong.net/) or Google Maps
- Right-click location → "What's here?"

### Step 2: Calculate Scores

Run scripts in order to enrich data with Google APIs:

```bash
# Calculate daily living scores (coffee shops, restaurants)
node updateDailyLivingScores.js

# Calculate grocery scores (categorized grocery stores)
node updateGroceryScores.js

# Calculate transit scores (commute times to key destinations)
node updateTransitScores.js
```

Each script:
- Queries Google APIs for each rental
- Updates `rentals.csv` with scores
- Includes delays to avoid rate limiting
- Takes 1-3 minutes for 20 rentals

### Step 3: Generate Zip Code Aggregates

```bash
# Calculate aggregate scores for heatmap
node calculateZipCodeScores.js
```

This creates `zipcode_scores.csv` with:
- Median rent per zip code
- Average transit/daily living/grocery scores
- Overall Affordability Index
- Used by the heatmap visualization

### Step 4: View Results

Restart the server and view your affordability-scored rentals at `http://localhost:3000`

---

## Project Structure

```
nyc-affordability-calculator/
├── server.js                    # Express web server (port 3000)
├── scoreCalculator.js           # Affordability Index calculations (60/20/10/10)
├── placesAPI.js                 # Google Places API (daily living + grocery scores)
├── transitAPI.js                # Google Distance Matrix API (transit scores)
├── dataHandler.js               # CSV read/write operations
├── rentals.csv                  # Rental listings with all scores
├── zipcode_scores.csv           # Aggregate scores for heatmap
├── updateDailyLivingScores.js   # Script: Daily living scores
├── updateGroceryScores.js       # Script: Grocery scores
├── updateTransitScores.js       # Script: Transit scores
├── calculateZipCodeScores.js    # Script: Zip code aggregates
├── public/
│   └── index.html               # Web UI with in-app rental cards
├── .env                         # API keys (Google Places, Distance Matrix)
├── package.json                 # Dependencies
└── README.md                    # This file
```

---

## API Reference

### `GET /api/rentals`

Get all rentals with calculated Affordability Index.

**Query Parameters:**
- `affordabilityWeight` - Housing weight (0-1, default: 0.6)
- `transitWeight` - Transportation weight (0-1, default: 0.2)
- `socialWeight` - Daily living weight (0-1, default: 0.1)
- `groceryWeight` - Grocery weight (0-1, default: 0.1)
- `sortBy` - Sort field (default: 'Affordability Index')

**Example:**
```
GET /api/rentals?affordabilityWeight=0.5&transitWeight=0.3&socialWeight=0.1&groceryWeight=0.1
```

### `GET /api/rentals/zip/:zipCode`

Get rentals filtered by zip code with custom weights.

**Example:**
```
GET /api/rentals/zip/11201
```

---

## How It Works

### Housing Affordability Score (60%)
- Compares rental price to median for the area
- Formula: Linear scale where median = 50, half of median = 100, 1.5x median = 0
- Lower price relative to median = higher score

### Transportation Affordability Score (20%)
- Measures transit times to 3 key NYC destinations:
  - Manhattan Financial District (40.706, -74.009)
  - Midtown Manhattan (40.758, -73.986)
  - Downtown Brooklyn (40.694, -73.987)
- Uses Google Distance Matrix API with transit mode
- Shorter average commute = higher score
- Normalized to 0-100 scale

### Daily Living Affordability Score (10%)
- Counts coffee shops and restaurants within 0.5 miles (800m)
- Uses Google Places API with `cafe` and `restaurant` types
- More walkable venues = higher score
- Normalized to 0-100 scale across all rentals

### Grocery Affordability Score (10%)
- Counts grocery stores within 0.5 miles by category:
  - **Budget** (+10 pts): Trader Joe's, Aldi, Costco, Target, Stop & Shop, Key Food, C-Town
  - **Regular** (+5 pts): Food Bazaar, Associated, Met Fresh, ShopRite
  - **Premium** (-3 pts): Whole Foods, Dean & DeLuca, Gourmet Garage, Fairway
- Formula: `(budget × 10) + (regular × 5) - (premium × 3)`
- Normalized to 0-100 scale

### Overall Affordability Index
```
Affordability Index = (Housing × 60%) + (Transit × 20%) + (Daily Living × 10%) + (Grocery × 10%)
```

Users can adjust these weights via sliders in the UI for personalized scoring.

---

## API Costs

### Google Places API (New)
- **Purpose:** Daily living + grocery scores
- **Pricing:** ~$17 per 1,000 requests
- **Calls per rental:** 2-3 calls
- **Monthly free tier:** $200 credit (~11,000+ calls)

### Google Distance Matrix API
- **Purpose:** Transit times
- **Pricing:** ~$5-10 per 1,000 requests
- **Calls per rental:** 3 calls (3 destinations)
- **Monthly free tier:** Covered by $200 credit

### Total Cost Estimates
- **20 rentals:** ~$0.50 (well within free tier)
- **100 rentals:** ~$5-8
- **500 rentals:** ~$25-40

**Cost-saving tips:**
- Only run scripts when adding new rentals
- Scores don't change frequently (monthly updates sufficient)
- Manual data entry for rent prices (no RentCast API needed)

---

## Grocery Store Categorization

### Budget Stores (+10 points each)
Trader Joe's, Aldi, Costco, Target, Stop & Shop, Key Food, C-Town

### Regular Stores (+5 points each)
Food Bazaar, Associated Supermarket, Met Fresh, ShopRite

### Premium Stores (-3 points each)
Whole Foods, Dean & DeLuca, Gourmet Garage, Fairway Market

This categorization reflects real-world price differences. Neighborhoods with more budget stores score higher on grocery affordability.

---

## CSV Data Format

### rentals.csv
```csv
Address,Zip Code,Rental Price,Walk Score,Social Score,Grocery Score,Transit Score,Bedrooms,Bathrooms,Square Feet,Latitude,Longitude,URL
123 Court St,11201,2800,98,15,45,92,1,1,650,40.6960,-73.9917,https://zillow.com/...
```

**Required fields:** Address, Zip Code, Rental Price, Latitude, Longitude

**API-populated fields:** Social Score, Grocery Score, Transit Score

**Optional fields:** Bedrooms, Bathrooms, Square Feet, URL

### zipcode_scores.csv
```csv
Zip Code,Latitude,Longitude,Listing Count,Median Rent,Avg Transit Score,Avg Daily Living Score,Avg Grocery Score,Affordability Index
11201,40.6960,-73.9917,10,2850,88,82,75,85
```

Used by heatmap to display aggregate scores per zip code.

---

## Troubleshooting

### API key errors
- Verify `.env` file exists with valid API keys
- Check APIs are enabled in Google Cloud Console
- Restart server after adding keys

### No results from API
- Verify latitude/longitude coordinates are correct
- Check RADIUS_METERS in `placesAPI.js` (default: 800m)
- Some areas may genuinely have few venues

### Scores are all zero
- Run the update scripts in order:
  1. `updateDailyLivingScores.js`
  2. `updateGroceryScores.js`
  3. `updateTransitScores.js`
- Check for API errors in console output

### Server won't start
- Ensure Node.js installed: `node --version`
- Install dependencies: `npm install`
- Check port 3000 is available

---

## Scaling to Full NYC Coverage

### Current Status
- Prototype with 20 Brooklyn rentals (2 zip codes)
- Fully functional with all four scores

### Path to 100+ Listings
1. **Add 10 listings per target zip code**
   - Focus on 5-10 priority NYC zip codes initially
   - Manually collect from Zillow
   - Run API scripts to calculate scores

2. **Generate aggregate scores**
   - Run `calculateZipCodeScores.js`
   - Creates heatmap data with median rents and averages

3. **Expand gradually**
   - Add more zip codes over time
   - Target diverse neighborhoods (Manhattan, Brooklyn, Queens, Bronx)
   - Scale to 100-500 listings for comprehensive NYC coverage

---

## Future Enhancements

### Phase 2 (Post-Launch)
- Mobile-responsive optimizations
- User accounts and saved searches
- Email alerts for new listings in saved zip codes
- Expand to all ~180 NYC zip codes

### Phase 3 (Advanced Features)
- StreetEasy integration as alternative data source
- Subway station overlay on heatmap
- School quality scores
- Crime statistics
- Custom commute calculator (enter work address)

---

## Technical Details

- **Frontend:** Bootstrap 5, Vanilla JavaScript, Leaflet.js (for heatmap)
- **Backend:** Node.js, Express
- **APIs:** Google Places API (New), Google Distance Matrix API
- **Data:** CSV files (manual entry + API enrichment)
- **Deployment:** Ready for Heroku, Render, or any Node.js host

---

## Support and Documentation

- **Google Places API:** https://developers.google.com/maps/documentation/places
- **Distance Matrix API:** https://developers.google.com/maps/documentation/distance-matrix
- **Node.js:** https://nodejs.org/docs
- **Express:** https://expressjs.com/

---

## Author

**Joseph Chanwoo Jung**

Built as a production tool for measuring true cost of living across NYC neighborhoods.

---

## License

MIT License - Feel free to adapt for other cities!

---

**Key Insight:** Car ownership costs $9,000+/year ($750/month). Transit users spend 3-5% of budget on transportation vs. 15-20% for car owners. Walkable neighborhoods eliminate $100-200/month in delivery fees. A $3,000 rental with excellent transit and grocery access can cost LESS overall than a $2,500 rental that requires a car.

**This calculator reveals the neighborhoods where your total cost of living - not just rent - is truly affordable.**
