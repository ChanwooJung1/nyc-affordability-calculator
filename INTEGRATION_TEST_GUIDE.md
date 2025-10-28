# NYC Affordability App - Integration Test Guide

## What Was Built

I've successfully integrated your Flask heatmap with your Node.js affordability calculator to create a seamless three-level navigation:

**Level 1: Heatmap (Landing Page)** → **Level 2: ZIP Rentals** → **Level 3: Individual Rental Details**

## Integration Flow

### 1. **Heatmap Landing Page** (Port 5000)
   - Shows NYC ZIP codes colored by affordability scores
   - Click any ZIP code polygon on the map
   - Popup appears with:
     - ZIP code info and scores
     - Sample rental listings (top 3)
     - **NEW:** "View Details →" button for each rental
     - "View Affordability Calculator →" button to see all rentals

### 2. **ZIP Rentals List** (Port 3000)
   - Shows all rentals filtered by ZIP code
   - **NEW:** Rental cards are now clickable
   - Hover effect: card lifts slightly
   - Click any card to view full details

### 3. **Individual Rental Detail Page** (Port 3000)
   - **NEW PAGE:** Dedicated detail view for each rental
   - Shows:
     - Full address, price, bed/bath/sqft
     - Large overall affordability score
     - Detailed breakdown of all 4 scores with progress bars
     - Descriptions explaining what each score means
     - Interactive map showing rental location
     - Budget impact summary
     - Current weight priorities

## How to Test

### Step 1: Start Flask Server (Heatmap)
```bash
cd C:\Users\Joseph Chanwoo Jung\affordability-heatmap
python app_nyc.py
```
- Server will run on: http://localhost:5000

### Step 2: Start Node.js Server (Calculator)
Open a **separate** terminal:
```bash
cd C:\Users\Joseph Chanwoo Jung\affordability-heatmap\nyc-affordability-calculator
npm start
```
- Server will run on: http://localhost:3000

### Step 3: Test Integration Flow

#### Test Path 1: Heatmap → Popup → Individual Rental
1. Open http://localhost:5000 in your browser
2. Click on ZIP code **11201** (Brooklyn Heights) on the map
3. Popup appears showing:
   - ZIP 11201
   - Overall Score: XX/100
   - Housing/Social/Transit scores
   - **Sample Rentals (10 total)** section
4. Click "View Details →" on any rental (e.g., "343 Gold St")
5. Should open http://localhost:3000/rental?zip=11201&index=0
6. **NEW:** Individual rental detail page shows:
   - Full address and price
   - Overall affordability score (large)
   - 4 detailed score breakdowns with descriptions
   - Map with rental location marker
   - Budget impact summary

#### Test Path 2: Heatmap → All Rentals → Individual Rental
1. Open http://localhost:5000
2. Click on ZIP code **10001** (Chelsea) on the map
3. Click "📊 View Affordability Calculator →" button in popup
4. Opens http://localhost:3000?zip=10001
5. Shows all 10 rentals in Chelsea filtered by ZIP
6. **NEW:** Hover over any rental card (should lift up)
7. Click any rental card
8. Opens individual rental detail page

#### Test Path 3: Direct Calculator → Individual Rental
1. Open http://localhost:3000
2. Filter by ZIP 11203 (East Flatbush)
3. Click "Update Results"
4. Shows 8 rentals
5. Click any rental card
6. Opens individual rental detail page

### Step 4: Verify Individual Rental Page Features

On the rental detail page, verify:
- ✅ Address and price displayed correctly
- ✅ Overall affordability score shows with correct color (green/yellow/red)
- ✅ 4 score breakdowns all show:
  - Score badge with correct color
  - Progress bar animating to correct percentage
  - Description text explaining the score
- ✅ Map loads and shows marker at rental location
- ✅ "What This Means for Your Budget" section shows relevant summary
- ✅ Weight priorities list shows current percentages
- ✅ "← Back to All Rentals" link works

## Testing All ZIP Codes

### ZIP Codes with Full Data:
- **11201** (Brooklyn Heights) - 10 rentals - ✅ Has grocery scores
- **10001** (Chelsea/Garment) - 10 rentals - ⚠️ No grocery scores yet
- **11203** (East Flatbush) - 8 rentals - ⚠️ No grocery scores yet

### Expected Behavior:
- All rentals should load and display
- Grocery scores will show 0 for ZIP codes without data (with note in description)
- Transit scores currently 0 for all (pending update per PROJECT_CONTEXT.md)

## Files Modified/Created

### Modified:
1. **templates/index_nyc.html** - Added "View Details →" button to popup rentals
2. **nyc-affordability-calculator/server.js** - Added:
   - `/rental` route for detail page
   - `/api/rental` endpoint for single rental data
3. **nyc-affordability-calculator/public/index.html** - Made rental cards clickable

### Created:
4. **nyc-affordability-calculator/public/rental.html** - NEW individual rental detail page

## Known Issues & Next Steps

### Current Status:
- ✅ Integration complete
- ✅ All 3 navigation levels working
- ✅ Individual rental detail page fully functional
- ⚠️ Transit scores are 0 for all rentals (need to run updateTransitScores.js)
- ⚠️ Grocery scores only populated for ZIP 11201

### Recommended Next Steps (from PROJECT_CONTEXT.md TODO):
1. **Update Transit Scores** (Priority: High)
   ```bash
   cd nyc-affordability-calculator
   node updateTransitScores.js
   ```
   - Will populate transit scores for all 28 rentals
   - Takes ~20 minutes with API rate limits

2. **Update Grocery Scores** (Priority: Medium)
   ```bash
   cd nyc-affordability-calculator
   node updateGroceryScores.js
   ```
   - Currently only ZIP 11201 has grocery data
   - Need to run for ZIP 10001 and 11203

## Integration Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Flask Heatmap App                        │
│                   (Port 5000 - Landing)                     │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  NYC Map with colored ZIP codes                      │  │
│  │  - Click ZIP → Popup with scores + sample rentals   │  │
│  │  - "View Details →" links to Node.js detail page    │  │
│  │  - "View Calculator →" links to Node.js ZIP filter   │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│              Node.js Affordability Calculator               │
│                      (Port 3000)                            │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  Level 1: All Rentals (ZIP filtered)                │  │
│  │  URL: http://localhost:3000?zip=XXXXX               │  │
│  │  - Grid of clickable rental cards                   │  │
│  │  - Hover effect + click to view details             │  │
│  └─────────────────────────────────────────────────────┘  │
│                           ↓                                 │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  Level 2: Individual Rental Details (NEW!)          │  │
│  │  URL: http://localhost:3000/rental?zip=X&index=Y    │  │
│  │  - Full rental info with all scores                 │  │
│  │  - Score breakdowns with descriptions               │  │
│  │  - Location map                                     │  │
│  │  - Budget impact summary                            │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## API Endpoints

### Flask (Port 5000):
- `GET /` - Heatmap landing page
- `GET /api/rentals/<zip_code>` - Get sample rentals for popup

### Node.js (Port 3000):
- `GET /` - Main calculator page with all rentals
- `GET /rental` - Individual rental detail page (NEW)
- `GET /api/rentals` - Get all rentals with scores
- `GET /api/rentals/zip/:zipCode` - Get rentals by ZIP
- `GET /api/rental?zip=X&index=Y` - Get single rental (NEW)

## Success Criteria

✅ **Integration Complete** if:
1. Can click ZIP on heatmap → see popup with rentals
2. Can click "View Details" on popup rental → opens detail page
3. Can click "View Calculator" → opens filtered rental list
4. Can click rental card from list → opens detail page
5. Detail page shows all scores, map, and descriptions
6. "Back" button returns to previous page

## Troubleshooting

### Issue: "Cannot GET /rental"
- **Cause:** Node.js server not running
- **Fix:** Run `npm start` in nyc-affordability-calculator folder

### Issue: "No rental data available"
- **Cause:** Rental CSV files not loaded
- **Fix:** Check that CSV files exist in nyc-affordability-calculator/

### Issue: Rental detail page shows "Error Loading Rental"
- **Cause:** Invalid ZIP or index parameter
- **Fix:** Ensure you're clicking from heatmap popup or calculator cards

### Issue: Grocery Score shows 0
- **Expected:** Only ZIP 11201 has grocery data currently
- **Fix:** Run `node updateGroceryScores.js` for other ZIPs

### Issue: Transit Score shows 0
- **Expected:** Transit scores not yet populated
- **Fix:** Run `node updateTransitScores.js` (takes 20 min)
