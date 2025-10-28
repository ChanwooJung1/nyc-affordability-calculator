# Single Server Integration - Complete Guide

## What Changed

I've integrated the Node.js calculator directly into your Flask app. **You now only need to run ONE server!**

---

## Quick Start

### Start the Flask server (THAT'S IT!):
```bash
cd C:\Users\Joseph Chanwoo Jung\affordability-heatmap
python app_nyc.py
```

Visit: **http://localhost:5000**

---

## New App Structure

### Routes Available:

1. **`/`** - Heatmap (Landing Page)
   - Shows NYC ZIP codes colored by affordability
   - Hover tooltips show all rentals
   - Click for detailed popup

2. **`/calculator`** - Affordability Calculator
   - Shows all rentals with scores
   - Filter by ZIP code
   - Adjust priority weights
   - Opens in new tab from heatmap

3. **`/rental`** - Individual Rental Details
   - Detailed breakdown of single rental
   - All scores with descriptions
   - Map view
   - Opens from calculator cards

### API Endpoints:

1. **`GET /api/rentals`** - Get all rentals with scores
   - Query params: `affordabilityWeight`, `transitWeight`, `socialWeight`, `groceryWeight`, `sortBy`

2. **`GET /api/rentals/zip/<zip_code>`** - Get rentals for specific ZIP
   - Same query params as above

3. **`GET /api/rental?zip=X&index=Y`** - Get single rental
   - Query params: `zip`, `index`, weight params

---

## User Flow

### Flow 1: Heatmap → Calculator → Rental Details
```
1. Visit http://localhost:5000 (heatmap)
2. Click ZIP 11201 polygon
3. Popup appears
4. Click "📊 View Affordability Calculator →"
5. Opens /calculator?zip=11201 in new tab
6. Shows 10 Brooklyn Heights rentals
7. Click any rental card
8. Opens /rental?zip=11201&index=0
9. Shows detailed breakdown
10. Click "🗺️ Back to Heatmap" to return
```

### Flow 2: Hover Preview → Rental Details
```
1. Visit http://localhost:5000
2. Hover over ZIP 11201
3. Tooltip shows all 10 rentals
4. Click "View Details →" on any rental
5. Opens /rental?zip=11201&index=X in new tab
6. Shows detailed breakdown
```

---

## What Was Integrated

### From Node.js → Flask:

1. **Score Calculation Logic**
   - `calculate_affordability_scores()` function in Python
   - Same algorithm as Node.js version
   - Housing, transit, social, grocery scores
   - Overall affordability index

2. **Calculator Page**
   - Moved from `public/index.html` to `templates/calculator.html`
   - Same minimalist design
   - All features preserved

3. **Rental Detail Page**
   - Moved from `public/rental.html` to `templates/rental_detail.html`
   - Full score breakdown
   - Map integration

4. **API Endpoints**
   - All 3 endpoints now in Flask
   - Same response format
   - Compatible with existing frontend

5. **Data Loading**
   - Loads all 3 ZIP CSV files on startup
   - 28 rentals total (10+10+8)
   - Normalizes column names
   - Fills missing scores with 0

---

## Benefits of Single Server

### Before (Two Servers):
```
Terminal 1: python app_nyc.py     (Port 5000)
Terminal 2: npm start              (Port 3000)

Links: http://localhost:3000?zip=...
```

### After (One Server):
```
Terminal 1: python app_nyc.py     (Port 5000)

Links: /calculator?zip=...
```

**Advantages:**
- ✅ Simpler deployment
- ✅ No CORS issues
- ✅ Single port to manage
- ✅ Easier to share/demo
- ✅ Consistent base URL
- ✅ No localhost:3000 hardcoding

---

## Testing Checklist

### 1. Test Heatmap
- [ ] Visit http://localhost:5000
- [ ] Heatmap loads with colored ZIP codes
- [ ] Hover over ZIP 11201 shows tooltip with 10 rentals
- [ ] Click ZIP 11201 opens popup

### 2. Test Calculator Link
- [ ] Click "📊 View Affordability Calculator →" in popup
- [ ] Opens /calculator?zip=11201 in new tab
- [ ] Shows 10 rentals for Brooklyn Heights
- [ ] All scores display correctly
- [ ] "← Back to Heatmap" link works

### 3. Test Rental Cards
- [ ] Hover over rental card (should lift up)
- [ ] Click rental card
- [ ] Opens /rental?zip=11201&index=0
- [ ] Shows detailed breakdown
- [ ] All 4 scores display
- [ ] Map loads with marker
- [ ] "← Back to All Rentals" works
- [ ] "🗺️ Back to Heatmap" works

### 4. Test Filters
- [ ] In calculator, filter by ZIP 10001
- [ ] Shows 10 Chelsea rentals
- [ ] Adjust sliders (weights update)
- [ ] Click "Update Results"
- [ ] Scores recalculate

### 5. Test All ZIPs
- [ ] ZIP 11201 (10 rentals) ✅
- [ ] ZIP 10001 (10 rentals) ✅
- [ ] ZIP 11203 (8 rentals) ✅

---

## File Changes Summary

### Modified Files:

1. **`app_nyc.py`**
   - Added score calculation function
   - Added 3 new routes (`/calculator`, `/rental`, `/api/rental`)
   - Enhanced existing `/api/rentals` endpoints
   - Improved data loading with normalization

2. **`templates/index_nyc.html`** (heatmap)
   - Changed links from `http://localhost:3000` to `/calculator` and `/rental`
   - Now opens in same Flask app

3. **`templates/calculator.html`** (NEW)
   - Copied from Node.js `public/index.html`
   - Added "← Back to Heatmap" link
   - Identical minimalist design

4. **`templates/rental_detail.html`** (NEW)
   - Copied from Node.js `public/rental.html`
   - Added "🗺️ Back to Heatmap" link
   - Same detailed breakdown view

### Unchanged:
- Node.js files (still exist but not needed)
- CSV files (same location, same format)
- Heatmap functionality

---

## Troubleshooting

### Issue: "Template Not Found"
**Cause:** Calculator/rental templates not in `templates/` folder
**Fix:** Verify files exist:
```bash
ls templates/
# Should show: calculator.html, rental_detail.html, index_nyc.html
```

### Issue: "No rentals found"
**Cause:** CSV files not loaded
**Fix:** Check console output when starting server:
```
Loaded 10 rentals for ZIP 10001
Loaded 10 rentals for ZIP 11201
Loaded 8 rentals for ZIP 11203
Total rentals loaded: 28
```

### Issue: Links still point to localhost:3000
**Cause:** Browser cache
**Fix:** Hard refresh (Ctrl+Shift+R) or clear cache

### Issue: Scores are all 0
**Expected:** Transit scores are 0 (need to run updateTransitScores.js)
**Expected:** Grocery scores are 0 for ZIPs 10001, 11203

### Issue: "Back to Heatmap" doesn't work
**Cause:** Link uses relative URL `/`
**Fix:** Ensure Flask root route serves heatmap (it should)

---

## API Response Format

### `/api/rentals/zip/11201`

```json
{
  "success": true,
  "zip_code": "11201",
  "count": 10,
  "rentals": [
    {
      "Address": "343 Gold St, Brooklyn, NY",
      "Zip Code": "11201",
      "Rental Price": 3560,
      "Transit Score": 0,
      "Social Score": 20,
      "Grocery Score": 105,
      "Bedrooms": 1,
      "Bathrooms": 1,
      "Square Feet": 667,
      "Latitude": 40.693994,
      "Longitude": -73.982802,
      "Affordability Score": 92.3,
      "Social Score (Normalized)": 100.0,
      "Grocery Score (Normalized)": 100.0,
      "Affordability Index": 85.4
    },
    ...
  ]
}
```

---

## Deployment Notes

### For Production:

1. **Change Flask debug mode**:
   ```python
   if __name__ == '__main__':
       app.run(debug=False, host='0.0.0.0', port=5000)
   ```

2. **Use production WSGI server**:
   ```bash
   pip install gunicorn
   gunicorn -w 4 -b 0.0.0.0:5000 app_nyc:app
   ```

3. **Update all hardcoded URLs**:
   - Change `/calculator` to full domain if needed
   - Update Zillow links if necessary

---

## Next Steps (Optional)

### 1. Remove Node.js Files (Cleanup)
Since everything is now in Flask, you can delete:
```bash
rm -rf nyc-affordability-calculator/node_modules
rm nyc-affordability-calculator/package*.json
rm nyc-affordability-calculator/server.js
```
Keep the update scripts (updateTransitScores.js, etc.)

### 2. Add Navigation Bar
Create a consistent nav bar across all pages:
```
[ 🗺️ Heatmap ] [ 🏠 All Rentals ] [ ⚙️ Settings ]
```

### 3. Add Session Storage
Remember user's weight preferences across pages

### 4. Add Export Feature
Export filtered rentals to CSV/PDF

---

## Summary

✅ **Single server** - Only Flask needed (Port 5000)
✅ **All routes integrated** - Heatmap, Calculator, Rental Details
✅ **Internal links** - No more localhost:3000 references
✅ **Back navigation** - Easy return to heatmap from anywhere
✅ **Same functionality** - Everything works as before
✅ **Simpler deployment** - One command to start

You now have a **fully integrated single-server application**!

Just run `python app_nyc.py` and visit http://localhost:5000 🎉
