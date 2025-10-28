# Project Context - NYC Affordability Calculator

## What This Project Is

A **production-ready** web application that calculates the **true cost of living** across New York City using a two-tier system: an interactive heatmap showing all NYC zip codes, and detailed rental listings displayed in-app with comprehensive affordability scoring.

**THIS IS NOT A PROTOTYPE.** This is the full production version designed to help young professionals and students understand total living costs beyond just rent.

---

## Project Vision: Two-Tier System

### TIER 1: NYC Zip Code Heatmap (The Big Picture)
- Interactive heatmap showing **~180 NYC zip codes** across all 5 boroughs
- Color-coded by overall **Affordability Index** (green = most affordable, red = least affordable)
- Each zip code displays aggregate scores:
  - Median rent (calculated from manually collected listings)
  - Average transit affordability score
  - Average daily living affordability score
  - Average grocery affordability score
  - Overall Affordability Index
- Users click zip codes to see details and filter to that neighborhood
- **This is the main landing page**

### TIER 2: Individual Rental Listings (Displayed In-App)
- Shows **10 manually collected Zillow listings** per selected zip code
- Each listing displays **entirely within the app** (NO external Zillow links):
  - Full address (e.g., "123 Court St, Brooklyn, NY 11201")
  - Monthly rent price (prominent display)
  - Housing Affordability Score (60% weight)
  - Transportation Affordability Score (20% weight)
  - Daily Living Affordability Score (10% weight)
  - Grocery Affordability Score (10% weight)
  - Overall Affordability Index (highlighted)
  - Property details (bedrooms, bathrooms, sqft if available)
- Users can sort and filter rentals by any score
- Interactive sliders allow users to adjust weights (60/20/10/10 default) and see real-time recalculation

---

## Core Philosophy: Affordability, Not Lifestyle

**Everything in this app is tied directly to monthly cost savings**, not lifestyle preferences or "vibrancy."

### The Four Pillars of Affordability (60/20/10/10 weights)

1. **Housing Affordability (60%)**
   - Compares rent to neighborhood median
   - Finding below-median rentals saves $200-500/month
   - **Data source**: Manually collected Zillow listings

2. **Transportation Affordability (20%)**
   - Good subway access eliminates car ownership
   - Saves $400-800/month (car payments, insurance, gas, parking)
   - Saves 10-20 hours/month in commute time
   - **Data source**: Google Distance Matrix API (transit times to key destinations)

3. **Daily Living Affordability (10%)**
   - Walkable restaurants and cafes eliminate car-dependent errands
   - Reduces transportation costs and delivery fees ($5-15 per trip)
   - Dense neighborhoods mean no car ownership needed
   - **Data source**: Google Places API (coffee shops & restaurants within 0.5 miles)

4. **Grocery Affordability (10%)**
   - Access to discount stores (Trader Joe's, Aldi, Costco) vs premium stores (Whole Foods)
   - Can save $100-200/month on food costs
   - More stores enable price comparison and eliminate delivery fees
   - **Data source**: Google Places API (categorized grocery stores within 0.5 miles)

### Real-World Example
A $3,000 rental with excellent transit and grocery access can cost **LESS overall** than a $2,500 rental that requires car ownership.

---

## Current Project Status

### Completed:
✅ Legacy Brooklyn Rentals prototype (in `brooklyn-rentals/` folder)
✅ NYC Heatmap prototype with old scoring system (Housing/Tax/Healthcare)
✅ Google Places and Distance Matrix API integrations working

### In Progress (THIS REDESIGN):
🔄 Complete rebranding: "Brooklyn Rentals" → "NYC Affordability Calculator"
🔄 Remove ALL RentCast API code and references
🔄 Rename "Vibrant Score" → "Affordability Index" everywhere
🔄 Update weights to 60/20/10/10 (Housing/Transit/Daily Living/Grocery)
🔄 Add Grocery Affordability Score (fourth score)
🔄 Reframe all descriptions to emphasize monthly cost savings
🔄 Redesign UI to display rentals in-app (no external Zillow links)
🔄 Create zip code aggregate scoring system
🔄 Update heatmap to use new Affordability Index
🔄 Add "Why This Matters" educational section
🔄 Prepare for manual data collection (50-100+ Zillow listings)

---

## Project Structure

### Root Directory (`affordability-heatmap/`)

**Main NYC Heatmap Files (Python/Flask):**
- `app_nyc.py` - Flask app for NYC affordability heatmap (port 5000)
- `nyc_affordability_scores.csv` - Will contain ~180 NYC zip codes with aggregate scores
- `templates/index_nyc.html` - Interactive heatmap UI
- `static/ny_zip_codes.json` - GeoJSON boundaries for zip code polygons

**Data Processing Scripts:**
- `scripts/calculate_social_scores.py` - Daily living scores (coffee shops, restaurants)
- `scripts/calculate_transit_scores.py` - Transit accessibility scores
- `scripts/calculate_grocery_scores.py` - NEW: Grocery affordability scores
- `scripts/update_overall_score.py` - Recalculate Affordability Index with 60/20/10/10 weights

### NYC Affordability Calculator Subfolder (`nyc-affordability-calculator/`)

**RENAMED FROM `brooklyn-rentals/`** - This is where the detailed rental listing system lives.

**Key Files:**
- `server.js` - Express web server (port 3000)
- `rentals.csv` - Rental listings with all affordability scores (will grow to 50-100+ entries)
- `placesAPI.js` - Google Places API for daily living + grocery scores
- `transitAPI.js` - Google Distance Matrix API for transit scores
- `dataHandler.js` - CSV reading/writing
- `scoreCalculator.js` - Affordability Index calculations (60/20/10/10 weights)
- `updateSocialScores.js` - RENAMED TO: `updateDailyLivingScores.js`
- `updateGroceryScores.js` - NEW: Fetch grocery store counts and calculate scores
- `updateTransitScores.js` - Fetch transit times
- `public/index.html` - Interactive rental comparison UI (in-app display)
- `.env` - API keys (Google Places, Distance Matrix only)
- `PROJECT_CONTEXT.md` - Detailed documentation

**REMOVED FILES:**
- ~~`rentcastAPI.js`~~ - Deleted (no RentCast API)
- ~~`updateRentPrices.js`~~ - Deleted (manual data collection instead)

---

## Data Collection Strategy

### Manual Zillow Data Collection
**I (the user) will manually collect rental listings from Zillow:**
- Target: 10 listings per zip code
- Starting with: 5-10 priority NYC zip codes
- Scaling to: 50-100+ total listings across NYC
- Data collected per listing:
  - Full address
  - Monthly rent price
  - Bedrooms, bathrooms, sqft
  - Coordinates (latitude, longitude)

### API Enrichment
**After manual collection, scripts will calculate:**
- Transit scores (Google Distance Matrix API)
- Daily living scores (Google Places API - coffee shops, restaurants)
- Grocery scores (Google Places API - categorized grocery stores)
- Housing affordability (comparison to neighborhood median from collected data)

### Zip Code Aggregates
**Scripts will calculate for each zip code:**
- Median rent from collected listings
- Average transit score (sample multiple points or use centroid)
- Average daily living score
- Average grocery score
- Overall Affordability Index (60/20/10/10 formula)
- Save to `zipcode_scores.csv` for heatmap visualization

---

## Scoring System Details

### Affordability Index Formula
**Affordability Index** = (Housing × 60%) + (Transit × 20%) + (Daily Living × 10%) + (Grocery × 10%)

### Score Ranges (0-100 scale, higher = more affordable)
- **90-100**: Exceptional affordability
- **80-89**: Excellent affordability
- **70-79**: Very good affordability
- **60-69**: Good affordability
- **50-59**: Moderate affordability
- **40-49**: Fair affordability
- **30-39**: Below average affordability
- **20-29**: Poor affordability
- **0-19**: Very poor affordability

### Heatmap Color Coding
- **Dark Green**: 80-100 (Excellent affordability)
- **Green**: 60-80 (Good affordability)
- **Light Green**: 40-60 (Moderate affordability)
- **Yellow**: 20-40 (Fair affordability)
- **Red**: 0-20 (Poor affordability)

---

## Grocery Score Calculation (NEW)

### Store Categorization:
**Budget Stores (+10 points each):**
- Trader Joe's
- Aldi
- Costco
- Target
- Stop & Shop
- Key Food
- C-Town

**Regular Stores (+5 points each):**
- Food Bazaar
- Associated Supermarket
- Met Fresh
- ShopRite

**Premium Stores (-3 points each):**
- Whole Foods
- Dean & DeLuca
- Gourmet Garage
- Fairway Market

### Formula:
`Raw Score = (budget_count × 10) + (regular_count × 5) - (premium_count × 3)`

Normalized to 0-100 scale based on NYC distribution.

---

## User Interface Design

### Landing Page: NYC Heatmap
1. Header: "NYC Affordability Calculator - True Cost of Living"
2. Tagline: "Find genuinely affordable rentals across New York City"
3. **"Why This Matters" Section** (Bootstrap accordion):
   - Explains rent vs. total living costs
   - Car ownership costs: $9,000+/year ($750/month)
   - Transit users: 3-5% of budget vs. 15-20% for car owners
   - Walkable neighborhoods eliminate $100-200/month in delivery fees
   - Discount grocers save $100-200/month
   - Real example comparing $3,000 vs. $2,500 rentals
4. Interactive heatmap (Leaflet.js)
5. Borough filters
6. Click zip code → Show aggregate scores + rental listings

### Rental Listings View (In-App)
**Displayed when user clicks a zip code:**
1. Zip code aggregate scores card:
   - Median rent
   - Average transit, daily living, grocery scores
   - Overall Affordability Index
2. List of 10 rental listings (cards):
   - Address (prominent)
   - Monthly rent (large text)
   - Housing Affordability Score (bar indicator)
   - Transportation Score (bar indicator)
   - Daily Living Score (bar indicator)
   - Grocery Score (bar indicator)
   - Overall Affordability Index (highlighted, colored)
   - Property details (beds, baths, sqft)
3. Sort/filter controls:
   - Sort by: Affordability Index, Rent, Transit Score, etc.
   - Filter by score ranges
4. **Interactive weight sliders**:
   - Housing: 60% (default)
   - Transit: 20% (default)
   - Daily Living: 10% (default)
   - Grocery: 10% (default)
   - Sliders total to 100%
   - Real-time recalculation of Affordability Index

### NO External Links
- All data displayed in-app
- No "View on Zillow" buttons
- Self-contained rental comparison experience

---

## How to Run the App

### Prerequisites:
- Python 3.x (for heatmap backend)
- Node.js (for rental listings app)
- Google API keys in `nyc-affordability-calculator/.env`:
  - `GOOGLE_PLACES_API_KEY`
  - `GOOGLE_DISTANCE_MATRIX_API_KEY`

### Running the Heatmap (Main Page):
```bash
cd "C:\Users\Joseph Chanwoo Jung\affordability-heatmap"
python app_nyc.py
# Open: http://localhost:5000
```

### Running the Rental Listings App:
```bash
cd nyc-affordability-calculator
npm install
npm start
# Open: http://localhost:3000
```

### Data Processing Workflow:
```bash
cd nyc-affordability-calculator

# 1. Manually add listings to rentals.csv

# 2. Calculate scores (run in order):
node updateDailyLivingScores.js  # Coffee shops, restaurants
node updateGroceryScores.js      # Grocery stores
node updateTransitScores.js      # Transit times

# 3. Calculate zip code aggregates:
node calculateZipCodeScores.js   # Creates zipcode_scores.csv

# 4. Restart apps to see updated data
```

---

## API Usage and Costs

### Google Places API (New):
- **Purpose**: Daily living scores (coffee, restaurants) + grocery scores
- **Calls per rental**: 2-3 calls (different search categories)
- **Cost**: ~$17 per 1,000 calls
- **Monthly free tier**: $200 credit (enough for ~11,000+ calls)

### Google Distance Matrix API:
- **Purpose**: Transit times to key destinations
- **Calls per rental**: 3 calls (Financial District, Midtown, Downtown Brooklyn)
- **Cost**: ~$5-10 per 1,000 calls
- **Monthly free tier**: Covered by $200 credit

### Total Estimated Cost:
- **For 100 rentals**: ~$5-8 (well within free tier)
- **For 500 rentals**: ~$25-40
- **For 1000 rentals**: ~$50-80

---

## Technical Architecture

### Frontend:
- **Heatmap**: Leaflet.js with OpenStreetMap tiles
- **Rental UI**: HTML, CSS, Bootstrap 5, Vanilla JS
- **Interactive elements**: Sliders, filters, sort controls
- **Responsive design**: Mobile-friendly (priority for second phase)

### Backend:
- **Heatmap server**: Flask (Python) - serves zip code aggregates
- **Rental server**: Express (Node.js) - serves individual listings
- **Data storage**: CSV files (simple, portable, easy to edit manually)

### APIs:
- Google Places API (New) - Nearby places search
- Google Distance Matrix API - Transit routing
- NO RentCast API (removed)

### Data Flow:
1. User manually adds Zillow listings to `rentals.csv`
2. Scripts call Google APIs to calculate scores
3. Scripts calculate zip code aggregates
4. Heatmap displays aggregates
5. Clicking zip code shows filtered rentals in-app

---

## Key Terminology Changes

### Old → New:
- "Brooklyn Rentals" → "NYC Affordability Calculator"
- "Vibrant Score" → "Affordability Index"
- "Social Score" → "Daily Living Score" (tooltip: coffee shops & restaurants)
- "Walk Score" → "Transit Score" (unchanged, but verified correct)
- "Rent affordability" → "Housing Affordability Score"

### Removed Terms:
- ~~RentCast~~
- ~~"Lifestyle"~~
- ~~"Vibrancy"~~
- ~~"Fun neighborhoods"~~

---

## README.md Structure (To Be Updated)

1. **Title**: NYC Affordability Calculator
2. **Tagline**: True cost of living across New York City
3. **Overview**: Two-tier system (heatmap + listings)
4. **Why This Matters**: Rent is only part of monthly cost
5. **Scoring System**: 60/20/10/10 breakdown with cost savings
6. **Data Collection**: Manual Zillow + Google API enrichment
7. **How to Use**: Heatmap navigation + in-app rental viewing
8. **Technical Details**: Stack, APIs, architecture
9. **Data Processing**: Scripts and workflow
10. **Future Enhancements**: Mobile optimization, more zip codes

---

## Timeline and Deliverables

### Deadline: October 12
**This is production-ready, not an MVP.**

### Deliverables:
1. ✅ Folder renamed to `nyc-affordability-calculator`
2. ✅ All RentCast code removed
3. ✅ "Vibrant Score" → "Affordability Index" everywhere
4. ✅ Four scores with 60/20/10/10 weights
5. ✅ Grocery score implemented with store categorization
6. ✅ All descriptions emphasize monthly cost savings
7. ✅ "Why This Matters" section in UI
8. ✅ NYC branding throughout (no "Brooklyn Rentals")
9. ✅ In-app rental display (no external Zillow links)
10. ✅ Zip code aggregate scoring system
11. ✅ Updated heatmap with Affordability Index
12. ✅ README.md reflects production tool
13. ✅ Ready to accept 50-100+ manual Zillow listings
14. ✅ All tests passing, no errors

---

## Testing Checklist

After all changes:
- [ ] App starts without errors (both Flask and Node servers)
- [ ] Heatmap displays all NYC zip codes correctly
- [ ] Clicking zip code shows aggregate scores
- [ ] Clicking zip code filters rental listings
- [ ] Rental listings display in-app (no external links)
- [ ] All four scores calculate correctly
- [ ] Sliders work with 60/20/10/10 defaults
- [ ] Sliders total to 100% and recalculate in real-time
- [ ] Affordability Index uses correct formula
- [ ] Google Places API calls work (daily living + grocery)
- [ ] Google Distance Matrix API calls work (transit)
- [ ] No RentCast references remain anywhere
- [ ] All "Vibrant Score" replaced with "Affordability Index"
- [ ] All "Brooklyn Rentals" replaced with "NYC Affordability Calculator"
- [ ] UI clearly explains cost savings for each score
- [ ] "Why This Matters" section displays correctly
- [ ] README.md reflects production tool with manual data collection
- [ ] Can manually add listings to rentals.csv
- [ ] Median rent calculated from manual listings (not API)

---

## Future Enhancements (Post-Launch)

### Phase 2:
- Mobile-responsive optimizations
- Expand to all ~180 NYC zip codes
- Add 500-1000 total rental listings
- User accounts and saved searches
- Email alerts for new listings in saved zip codes

### Phase 3:
- StreetEasy integration as alternative data source
- Subway station overlay on heatmap
- School quality scores
- Crime statistics overlay
- Commute time calculator (enter work address)

---

## Contact Information

- **Student**: Joseph Chanwoo Jung
- **Working Directory**: `C:\Users\Joseph Chanwoo Jung\affordability-heatmap`
- **Main Heatmap**: `app_nyc.py` (port 5000)
- **Rental Listings App**: `nyc-affordability-calculator/server.js` (port 3000)
- **Counselor Requirement**: Everything tied to affordability, not lifestyle

---

## How to Reference This Project in Future Sessions

Say: **"Read .claude/project_context.md"** and Claude will understand:
- This is the NYC Affordability Calculator (production tool, not MVP)
- Two-tier system: heatmap + in-app rental listings
- Four scores with 60/20/10/10 weights, all tied to monthly cost savings
- Manual Zillow data collection enriched with Google APIs
- No RentCast API (removed)
- "Affordability Index" not "Vibrant Score"
- "NYC Affordability Calculator" not "Brooklyn Rentals"
- Ready to scale to 50-100+ listings across NYC
- Deadline: October 12
