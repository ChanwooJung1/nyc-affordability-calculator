# Rental Location Markers - Implementation Guide

## What Was Added

I've added **rental location markers** to the heatmap that show the exact locations of all rental listings using their latitude/longitude coordinates from the CSV files.

---

## How It Works

### **On Hover Over ZIP Code:**

1. **Tooltip appears** with ZIP info and rental list (same as before)
2. **Purple markers appear** on the map showing exact rental locations
3. Each marker represents one rental property
4. Markers use lat/lng from your CSV files

### **On Hover Over Marker:**

1. **Tooltip appears** showing:
   - **Price** (e.g., "$3,560/mo")
   - **Address** (e.g., "343 Gold St, Brooklyn, NY")
   - **Specs** (e.g., "1 bed • 1 bath")
   - **"View Details →" button**

### **On Click Marker:**

- Navigates directly to that rental's detail page
- URL: `/rental?zip=11201&index=0`

### **On Mouse Leave ZIP:**

- Markers disappear automatically
- Keeps map clean

---

## Visual Design

### Marker Style:
```
Small purple circle (12px)
White border (2px)
Drop shadow for visibility
Color: #667eea (matches your app theme)
```

### Marker Appearance:
```
    ●  ← Purple dot with white ring
```

Multiple markers in same area:
```
  ●  ●
 ●  ●  ●
    ●
```

---

## User Flow Examples

### Example 1: Browse Brooklyn Heights
```
1. Hover over ZIP 11201 (Brooklyn Heights)
2. See 10 purple markers appear across the neighborhood
3. Hover over any marker
4. Tooltip shows: "$3,560/mo - 343 Gold St - 1 bed • 1 bath"
5. Click marker
6. Opens detailed rental page
```

### Example 2: Compare Neighborhoods
```
1. Hover over ZIP 10001 (Chelsea)
2. See 10 markers in Manhattan
3. Move mouse away
4. Markers disappear
5. Hover over ZIP 11203 (East Flatbush)
6. See 8 markers in Brooklyn
7. Compare density and locations
```

---

## Technical Details

### Data Source:
- Uses `Latitude` and `Longitude` columns from CSV files
- Files: `10001 Rental Listings.csv`, `11201 Rental Listings.csv`, `11203 Rental Listings.csv`

### Coordinates Validation:
- Skips rentals with missing or invalid lat/lng
- Checks for NaN, null, or undefined values
- Only displays valid coordinates

### Performance:
- Markers are created once per ZIP (cached)
- Layer groups for efficient add/remove
- No performance impact with 28 rentals

---

## How to Test

### Start the server:
```bash
cd C:\Users\Joseph Chanwoo Jung\affordability-heatmap
python app_nyc.py
```

### Test Flow:

1. **Visit:** http://localhost:5000

2. **Test ZIP 11201 (Brooklyn Heights):**
   - Hover over Brooklyn Heights area
   - ✅ Should see ~10 purple markers appear
   - ✅ Markers should be clustered in Brooklyn Heights
   - Hover over any marker
   - ✅ Tooltip shows rental info
   - Click marker
   - ✅ Opens rental detail page

3. **Test ZIP 10001 (Chelsea):**
   - Hover over Manhattan Chelsea area
   - ✅ Should see ~10 markers in Manhattan
   - ✅ Different locations than Brooklyn

4. **Test ZIP 11203 (East Flatbush):**
   - Hover over East Flatbush area
   - ✅ Should see ~8 markers
   - ✅ Spread across East Flatbush

5. **Test Marker Removal:**
   - Hover over ZIP 11201
   - Markers appear
   - Move mouse away from ZIP
   - ✅ Markers disappear
   - Hover over ZIP 10001
   - ✅ New markers appear for different ZIP

---

## Features

### ✅ Implemented:

1. **Exact Locations** - Shows precise rental locations using lat/lng
2. **Hover to Show** - Markers appear when hovering over ZIP
3. **Auto-Hide** - Markers disappear when leaving ZIP
4. **Clickable Markers** - Click to view rental details
5. **Marker Tooltips** - Shows price, address, specs
6. **Themed Design** - Purple markers match app colors
7. **Performance** - Efficient layer management
8. **Validation** - Skips invalid coordinates

---

## Visual Example

### Before (No Markers):
```
┌────────────────────────────────┐
│                                │
│   [Brooklyn ZIP 11201]         │
│   (green/yellow colored)       │
│                                │
│                                │
└────────────────────────────────┘
```

### After (With Markers on Hover):
```
┌────────────────────────────────┐
│         ●                      │
│   [Brooklyn ZIP 11201]         │
│   ●    ●  ●                    │
│      ●   ●                     │
│   ●      ●   ●                 │
└────────────────────────────────┘
    ↑ Purple rental markers
```

### Marker Tooltip Example:
```
┌──────────────────────────┐
│  $3,560/mo               │
│  343 Gold St, Brooklyn   │
│  1 bed • 1 bath          │
│  ┌──────────────────┐    │
│  │ View Details →   │    │
│  └──────────────────┘    │
└──────────────────────────┘
```

---

## Code Structure

### Key Functions:

1. **`showRentalMarkers(rentals, zipCode)`**
   - Creates markers for all rentals in a ZIP
   - Adds them to a layer group
   - Displays on map

2. **`hideRentalMarkers()`**
   - Removes all markers from map
   - Clears layer group
   - Called on mouseout

3. **Marker Creation:**
   ```javascript
   L.marker([lat, lng], { icon: rentalIcon })
     .bindTooltip(rentalInfo)
     .on('click', navigateToDetail)
   ```

---

## Data Requirements

### CSV Must Have:
- `Latitude` column (decimal degrees)
- `Longitude` column (decimal degrees)
- `Address` column
- `Rental Price` column
- `Bedrooms` column
- `Bathrooms` column

### Example CSV Row:
```csv
Address,Zip Code,Rental Price,Latitude,Longitude,Bedrooms,Bathrooms
"343 Gold St, Brooklyn, NY",11201,3560,40.693994,-73.982802,1,1
```

---

## Troubleshooting

### Issue: No markers appear
**Causes:**
1. Missing lat/lng in CSV
2. Invalid coordinates (NaN, null)
3. Coordinates outside NYC area

**Fix:**
- Check CSV has `Latitude` and `Longitude` columns
- Verify coordinates are valid numbers
- Check browser console for errors

### Issue: Markers in wrong location
**Cause:** Swapped lat/lng in CSV

**Fix:** Ensure lat comes before lng (lat is ~40.x, lng is ~-73.x for NYC)

### Issue: Markers don't disappear
**Cause:** Browser cache

**Fix:** Hard refresh (Ctrl+Shift+R)

### Issue: Tooltip doesn't show
**Cause:** Leaflet tooltip not binding

**Fix:** Restart server, clear cache

---

## Expected Marker Counts

- **ZIP 10001 (Chelsea):** 10 markers
- **ZIP 11201 (Brooklyn Heights):** 10 markers
- **ZIP 11203 (East Flatbush):** 8 markers

**Total:** 28 rental locations mapped

---

## Future Enhancements (Optional)

### 1. Clustered Markers
Group nearby markers when zoomed out:
```javascript
L.markerClusterGroup()
```

### 2. Color by Price
Show cheaper rentals in green, expensive in red:
```javascript
const color = price < 3000 ? 'green' : price < 4000 ? 'blue' : 'red';
```

### 3. Custom Marker Icons
Add house emoji or custom SVG:
```javascript
html: '🏠'
```

### 4. Marker Bounce Animation
Make marker bounce when clicked:
```javascript
marker.on('click', function() {
  this.setIcon(bouncingIcon);
});
```

### 5. Search by Location
Click map to show nearest rentals

---

## Summary

✅ **Exact locations** - Shows where each rental is using lat/lng
✅ **Hover to reveal** - Markers appear when hovering ZIP
✅ **Auto-hide** - Clean map when not hovering
✅ **Interactive** - Click markers to view details
✅ **Themed design** - Purple matches app colors
✅ **Performant** - Efficient with 28 rentals

Now you can **see exactly where rentals are located** when browsing the heatmap! 🗺️
