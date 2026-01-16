# Project Context - Brooklyn Rental Affordability App

## What This Project Is

A web application to help young professionals and college students find affordable rentals in Brooklyn, NY. The app calculates a **"Vibrant Score"** for each rental based on three factors:

- **Affordability** (rental price vs. median)
- **Transit Score** (average transit time to key destinations via Google Distance Matrix API)
- **Social Score** (number of coffee shops & restaurants within 0.5 miles via Google Places API)

## Project Structure

Located in: `brooklyn-rentals/` subfolder

**Key Files:**
- `placesAPI.js` - Google Places API integration with error handling
- `transitAPI.js` - Google Distance Matrix API for transit score calculation
- `rentcastAPI.js` - RentCast API integration for real rent price data
- `dataHandler.js` - CSV reading/writing with PapaParse
- `scoreCalculator.js` - Affordability, transit, social, and Vibrant Score calculations
- `server.js` - Express web server with API endpoints
- `updateSocialScores.js` - Script to fetch social scores from Google Places API
- `updateTransitScores.js` - Script to fetch transit scores from Google Distance Matrix API
- `updateRentPrices.js` - Script to fetch real rent prices from RentCast API
- `rentals.csv` - 20 sample rentals (11201 & 11215 zip codes)
- `public/index.html` - Interactive web UI with Bootstrap
- `.env` - **Contains Google Places API key, Distance Matrix API key, and RentCast API key** (not committed to Git)
- `README.md` - Full documentation

## Current Status (as of January 8, 2026)

✅ **Scraped 1,789 rental listings** across 190 NYC zip codes (all 5 boroughs)
✅ **ScraperAPI integration** - Automated rental data collection from Zillow
✅ **Data quality filtering** - Top 10 listings per zip code, anomalies removed
✅ **All scores calculated** - Transit, Daily Living, and Grocery scores for all 1,789 listings
✅ **ZIP code aggregates generated** - Median rent and average scores per ZIP code
✅ **Server running locally** at http://localhost:3000 with full heatmap and rentals
✅ **Google APIs tested and working** (Distance Matrix, Places API)
⏳ **TODO: Deploy to live website** (nyaffordability.online)

### Coverage
- 🏙️ Manhattan: 45 zip codes
- 🌆 Bronx: 25 zip codes
- 🌉 Brooklyn: 50 zip codes
- 🏘️ Queens: 70 zip codes
- 🏖️ Staten Island: 14 zip codes

## What Was Built in Current Session (January 8, 2026)

1. **ZIP Code Aggregate Score Calculation**
   - Ran `calculateZipCodeScores.js` to generate aggregate data for heatmap
   - Loaded 1,789 individual rental listings from 190 NYC ZIP codes
   - Calculated per-ZIP aggregates:
     - Median Rent
     - Average Transit Score
     - Average Daily Living Score
     - Average Grocery Score
     - Overall Affordability Index (weighted 60/20/10/10)
   - Created `zipcode_scores.csv` with complete data for 190 ZIP codes

2. **Updated Server for Heatmap Data**
   - Modified `/api/heatmap` endpoint to read from `zipcode_scores.csv`
   - Added borough classification based on ZIP code patterns
   - Calculate housing scores from median rent (lower rent = higher score)
   - Verified all scores are populated with real data (no more zeros)

3. **Current App Status**
   - Server running locally at http://localhost:3000
   - Heatmap shows all 190 NYC ZIP codes with real affordability data
   - Individual rental listings fully scored and filterable by ZIP
   - Top affordable ZIPs: 10451 (Bronx), 11208 (Brooklyn), 11405 (Queens) - all scoring 67/100
   - **NOT YET DEPLOYED** to live website (nyaffordability.online)

## What Was Built in Previous Session (January 3, 2026)

1. **Automated Rental Data Collection**
   - Built web scraper using ScraperAPI to bypass Zillow's anti-bot protection
   - Scraped 4,697 raw listings from 204 NYC zip codes
   - Used 190 ScraperAPI requests (810 free requests remaining)
   - Script: `scrapeWithAPI.py` with API key configured

2. **Data Quality Filtering**
   - Created `filterTop10PerZip.js` to remove anomalies
   - Filtered down to 1,789 quality listings (top 10 per zip)
   - Removed price outliers (<$500 or >$20,000)
   - Ensured diverse price ranges (budget, mid-range, luxury)
   - 61.9% reduction in dataset size

3. **System Updates**
   - Updated `dataHandler.js` to load all 190 zip codes
   - Server tested and verified with 1,789 listings
   - All listings have complete data (address, price, coordinates)

4. **Cost Analysis**
   - Original dataset (4,697): ~$310 API cost, 5-6 hours
   - Filtered dataset (1,789): ~$118 API cost, 2.3 hours
   - Breakdown: Transit $27, Social $61, Grocery $30

5. **Files Created**
   - `scrapeWithAPI.py` - ScraperAPI-based Zillow scraper
   - `scrapeAllZips.py` - Batch processor for all zip codes
   - `filterTop10PerZip.js` - Data quality filter
   - `all_nyc_zipcodes.txt` - Complete NYC zip code list
   - 190 individual CSV files (one per zip code)

## What Was Built in Previous Session (October 26, 2025)

1. **Integrated Flask Heatmap with Node.js Affordability Calculator**
   - Enhanced Flask landing page with compelling affordability messaging
   - Added API endpoint (`/api/rentals/<zip_code>`) to serve rental data by ZIP
   - Updated heatmap popup to show sample rental listings for ZIP codes 10001, 11201, 11203
   - Added "View Affordability Calculator" button that links to Node.js app with ZIP filter
   - Node.js app now reads `?zip=XXXXX` URL parameter and auto-filters results

2. **Updated Grocery Scores for ZIP 11201**
   - Ran `updateGroceryScores.js` for all 10 rentals in Brooklyn Heights (11201)
   - Scores range from 85-115 based on budget/regular/premium grocery store access
   - Successfully verified data saved to `rentals.csv`

3. **Data Files Created**
   - `10001 Rental Listings.csv` - 10 rentals in Chelsea/Garment District
   - `11201 Rental Listings.csv` - 10 rentals in Brooklyn Heights
   - `11203 Rental Listings.csv` - 8 rentals in East Flatbush
   - Total: 28 manually collected rental listings

4. **Integration Workflow**
   - User visits Flask heatmap at `http://localhost:5000`
   - Clicks on ZIP code → sees sample rentals in popup
   - Clicks "View Affordability Calculator" → opens `http://localhost:3000?zip=XXXXX`
   - Calculator automatically filters to that ZIP and shows full breakdown

## What Was Built in Previous Session (October 22, 2025)

1. **RentCast API Integration for Real Rent Prices**
   - Created `rentcastAPI.js` with RentCast API integration
   - Supports fetching rent estimates by address or coordinates
   - Includes market statistics (median rent) by ZIP code
   - Returns price ranges, property details, and square footage
   - Comprehensive error handling for API limits and failures

2. **Updated Data Handler for Rent Data**
   - Added `updateRentalRentData()` function to `dataHandler.js`
   - Supports new fields: RentCast Price, Price Range, Bathrooms, Square Feet, Property Type
   - Preserves backward compatibility with existing data

3. **Created Rent Price Update Script**
   - Built `updateRentPrices.js` to bulk-update all rentals
   - Fetches market statistics for each ZIP code
   - Updates individual rent estimates from RentCast API
   - Includes rate limiting (1 second delay between requests)
   - Supports single-rental updates for testing

4. **Enhanced Score Calculator**
   - Modified `scoreCalculator.js` to use RentCast prices when available
   - Falls back to original prices if RentCast data unavailable
   - Maintains backward compatibility with existing affordability calculations

## What Was Built in Previous Session (October 17, 2025)

1. **Replaced Walk Score with Transit Score**
   - Created `transitAPI.js` using Google Distance Matrix API
   - Calculates average transit time to 3 key destinations (Manhattan Financial District, Downtown Brooklyn, Williamsburg)
   - Converts transit time to 0-100 score (15 min = 100, 90+ min = 0)

2. **Updated all components for Transit Score**
   - Modified `scoreCalculator.js` to use Transit Score instead of Walk Score
   - Updated `server.js` API endpoints (`transitWeight` parameter)
   - Refreshed `index.html` UI with 🚇 Transit Score slider and display
   - Created `updateTransitScores.js` script to bulk-update transit data

3. **Verified Google Places API integration**
   - Tested API connection successfully
   - Confirmed all 20 Brooklyn locations return 20 venues (hitting API max)
   - Added detailed logging to `updateSocialScores.js` for debugging
   - All social scores working correctly

## Previous Sessions

**October 1, 2025:**
1. Complete Google Places API (New) integration
2. CSV data handler with 20 Brooklyn rental samples
3. Score calculation system (affordability, social, vibrant)
4. Express web server with REST API
5. Interactive landing page with sliders for customizing priorities
6. Script to bulk-update social scores from Google Places API
7. Moved entire project from root to `brooklyn-rentals/` subfolder to separate from existing Python affordability project

## Parent Project

The parent folder (`affordability-heatmap/`) contains a separate **Python-based** NY State affordability analysis project with:
- Flask app (`app.py`)
- CSV data for healthcare, housing, property tax scores
- Analysis of all NY zip codes
- These files are unrelated to the Brooklyn rental app

## Important Technical Notes

### Windows PowerShell Issue
- PowerShell execution policy blocks npm on this system
- **Solution**: Use Command Prompt (cmd) instead of PowerShell for npm commands
- Or run `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser` as Administrator

### API Key Security
- API keys are stored in `.env` file (gitignored)
- Keys have been restricted to Places API (New), Distance Matrix API, and RentCast API
- **Never share API keys publicly or commit to Git**
- Note: New API keys may take 15-30 minutes to propagate
- RentCast free tier includes monthly API call limits - monitor usage at https://app.rentcast.io/

## TODO: Next Steps

**Deploy to Live Website** (nyaffordability.online)

The app is fully functional locally with all data calculated. Next steps:

1. **Prepare for deployment:**
   - Verify all CSV files are present (190 individual ZIP files + zipcode_scores.csv)
   - Test heatmap and rentals pages locally
   - Confirm all API endpoints working

2. **Deploy to production:**
   - Upload all files to web hosting
   - Configure environment variables (.env with API keys)
   - Test live site functionality
   - Update DNS if needed

3. **Post-deployment:**
   - Verify heatmap loads all 190 ZIP codes
   - Test ZIP code drill-down to individual rentals
   - Monitor API usage and costs
   - Plan for periodic data updates (monthly/quarterly)

## Next Steps to Run the App

1. **Install dependencies** (use cmd, not PowerShell):
   ```bash
   cd brooklyn-rentals
   npm install
   ```

2. **Set up RentCast API key**:
   - Sign up for a free RentCast account at https://app.rentcast.io/
   - Get your API key from the dashboard
   - Add to `.env` file: `RENTCAST_API_KEY=your_key_here`

3. **Test API connections** (optional):
   ```bash
   node -e "require('./placesAPI').testAPI()"
   node -e "require('./transitAPI').testAPI()"
   node -e "require('./rentcastAPI').testAPI()"
   ```

4. **Fetch social scores for all rentals**:
   ```bash
   node updateSocialScores.js
   ```
   - Queries Google Places API for each rental
   - Updates CSV with real social score data
   - Takes ~1-2 minutes for 20 rentals
   - ✅ Verified working - all locations have 20 venues

5. **Fetch transit scores for all rentals**:
   ```bash
   node updateTransitScores.js
   ```
   - Queries Google Distance Matrix API for each rental
   - Calculates average transit time to 3 key destinations
   - Updates CSV with transit scores
   - Takes ~20 minutes for 20 rentals (with rate limit delays)

6. **Fetch real rent prices for all rentals** (NEW):
   ```bash
   node updateRentPrices.js
   ```
   - Queries RentCast API for each rental
   - Updates CSV with real rent estimates, price ranges, and property details
   - Fetches market statistics (median rent) by ZIP code
   - Takes ~20-30 seconds for 20 rentals
   - **Note**: RentCast has monthly API limits on free tier

7. **Start the web server**:
   ```bash
   npm start
   ```

8. **View the app**:
   Open browser to: http://localhost:3000

## Key Features

- ✅ Interactive NYC heatmap with 190 ZIP codes color-coded by affordability
- ✅ Click ZIP codes to view detailed rental listings
- ✅ 1,789 real rental listings scraped from Zillow
- ✅ Four-factor scoring system:
  - Housing Affordability (60%) - rent vs median
  - Transportation (20%) - transit times to key destinations
  - Daily Living (10%) - walkable cafes/restaurants
  - Grocery Access (10%) - budget vs premium stores
- ✅ Interactive weight sliders for personalized scoring
- ✅ Filter by borough (Manhattan, Brooklyn, Queens, Bronx, Staten Island)
- ✅ Sort rentals by any score or price
- ✅ Real-time score recalculation
- ✅ Clean, modern UI with full-screen map
- ✅ Google Places API integration for social venues and groceries
- ✅ Google Distance Matrix API for transit accessibility

## Deadlines

- **October 5, 2025**: API integration complete ✅
- **October 12, 2025**: Full prototype complete

## Future Enhancements (Post-MVP)

- 🗺️ **Heatmap visualization** of affordability across NY State
  - Use existing Python project's `ny_affordability_scores.csv` data
  - Add as separate page/view
  - **Decision**: Implement AFTER basic prototype is working
- Map view of rental locations
- Mobile-responsive improvements
- User accounts to save favorites
- Email alerts for new rentals

## How to Reference This Project in Future Sessions

Say: "Read PROJECT_CONTEXT.md in brooklyn-rentals folder" and Claude will understand the full context.

## Contact Info

- Student: Joseph Chanwoo Jung
- Working directory: `C:\Users\Joseph Chanwoo Jung\affordability-heatmap\brooklyn-rentals`
