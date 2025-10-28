# Heatmap Hover Preview Guide

## What Was Added

I've added **hover tooltips** to the NYC heatmap that show:
1. ZIP code and borough name
2. Overall affordability score
3. **ALL rental listings** for that ZIP code (not just 3)

---

## How It Works

### On Hover:
When you hover your mouse over any ZIP code on the heatmap:

1. **ZIP code polygon highlights** (fills darker, border gets thicker)
2. **Tooltip appears** showing:
   - "ZIP XXXXX - Borough Name"
   - "Overall Score: XX/100"
   - "Hover to load rentals..." (initially)

3. **Rentals load automatically** after a moment:
   - Shows "X Rentals Available"
   - Lists ALL rentals in that ZIP:
     - Price (e.g., "$3,500/mo")
     - Address
     - Bed/bath count
   - Scrollable if more than ~5 rentals

### On Click:
When you click the ZIP code:
- **Popup opens** (same as before) with:
  - Detailed scores
  - Sample rentals with "View Details →" buttons
  - Links to calculator and Zillow

---

## Testing Instructions

### Start Flask Server:
```bash
cd C:\Users\Joseph Chanwoo Jung\affordability-heatmap
python app_nyc.py
```

### Test Hover Tooltips:

1. **Open heatmap**: http://localhost:5000

2. **Test ZIP 11201 (Brooklyn Heights)**:
   - Hover over Brooklyn area (ZIP 11201)
   - Should show: "ZIP 11201 - Brooklyn"
   - Should load: "10 Rentals Available"
   - Should list all 10 rentals:
     - $3,560/mo - 343 Gold St
     - $4,149/mo - 180 Montague St
     - ... (all 10)
   - Scroll down to see all rentals

3. **Test ZIP 10001 (Chelsea)**:
   - Hover over Manhattan Chelsea area
   - Should show: "ZIP 10001 - Manhattan"
   - Should load: "10 Rentals Available"
   - Should list all 10 Chelsea rentals

4. **Test ZIP 11203 (East Flatbush)**:
   - Hover over East Flatbush area
   - Should show: "ZIP 11203 - Brooklyn"
   - Should load: "8 Rentals Available"
   - Should list all 8 rentals

5. **Test ZIP with no data** (e.g., 10002):
   - Hover over a ZIP without rental data
   - Should show: "No rental data available"

---

## Visual Example

```
┌─────────────────────────────────────┐
│ ZIP 11201 - Brooklyn                │
│ Overall Score: 75.3/100             │
│                                     │
│ 10 Rentals Available:               │
│ ┌─────────────────────────────────┐ │
│ │ $3,560/mo                       │ │
│ │ 343 Gold St, Brooklyn, NY       │ │
│ │ 1 bed • 1 bath                  │ │
│ ├─────────────────────────────────┤ │
│ │ $4,149/mo                       │ │
│ │ 180 Montague St, Brooklyn, NY   │ │
│ │ 1 bed • 1 bath                  │ │
│ ├─────────────────────────────────┤ │
│ │ ... (scroll for more)           │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

## Features

### 1. **Smart Loading**
- Rentals load only once per ZIP (cached)
- Prevents multiple API calls when hovering repeatedly
- Fast subsequent hovers

### 2. **Scrollable List**
- If more than ~5 rentals, list becomes scrollable
- Max height: 300px
- Custom styled scrollbar (thin, gray)

### 3. **Clean Styling**
- White background with subtle shadow
- Rounded corners (8px)
- Clear typography hierarchy
- Price is bold and prominent
- Address in medium gray
- Bed/bath in light gray

### 4. **Responsive Tooltip**
- "Sticky" tooltip follows cursor
- Positions itself to stay on screen
- Appears above ZIP code polygon

---

## Differences from Popup

### Tooltip (On Hover):
- ✅ Appears instantly on hover
- ✅ Shows ALL rentals for quick preview
- ✅ Compact format (just price/address/beds)
- ✅ Scrollable for long lists
- ✅ No buttons (view-only)

### Popup (On Click):
- ✅ Opens when you click
- ✅ Shows top 3 rentals with "View Details" buttons
- ✅ Includes score breakdowns
- ✅ Has action buttons (Calculator, Zillow)
- ✅ More detailed information

---

## Troubleshooting

### Issue: Tooltip doesn't appear
**Solution**: Make sure you're hovering over a colored ZIP code polygon (not white areas)

### Issue: Shows "Hover to load rentals..." forever
**Solution**:
1. Check Flask server is running
2. Check browser console for errors
3. Verify API endpoint: http://localhost:5000/api/rentals/11201

### Issue: Tooltip appears but says "No rental data"
**Expected** for most ZIPs - you only have data for 10001, 11201, 11203

### Issue: Rental list is cut off
**Solution**: Scroll down - list has a scrollbar if more than 5 rentals

### Issue: Tooltip is hard to read
**Solution**: CSS has been styled with white background and shadow. Check browser zoom level.

---

## Technical Details

### How Hover Detection Works:
```javascript
layer.on('mouseover', function(e) {
  // 1. Highlight the ZIP polygon
  layer.setStyle({ fillOpacity: 0.9, weight: 3 });

  // 2. Fetch rental data (only once)
  if (!rentalsLoaded) {
    fetch(`/api/rentals/${zip}`)
      .then(data => {
        // 3. Update tooltip content with rentals
        // 4. Display all rentals in scrollable div
      });
  }
});
```

### Tooltip Configuration:
```javascript
layer.bindTooltip(content, {
  sticky: true,        // Follows cursor
  direction: 'top',    // Appears above polygon
  className: 'custom-tooltip'  // Custom styling
});
```

---

## Next Steps (Optional Enhancements)

### 1. **Add Rental Images to Tooltip**
Show tiny thumbnail images next to each rental

### 2. **Add Affordability Scores**
Include individual scores (housing, transit, etc.) in tooltip

### 3. **Add Click-to-View-Details**
Make each rental in tooltip clickable to open detail page

### 4. **Add Price Sorting**
Sort rentals by price (low to high) in tooltip

### 5. **Add Filtering**
Filter rentals by price range or bedrooms

---

## Summary

✅ **Hover over ZIP** → Shows ZIP code and borough
✅ **Rentals load automatically** → Shows ALL rentals (not just 3)
✅ **Scrollable list** → Up to 300px height with custom scrollbar
✅ **Clean styling** → White background, subtle shadow, clear hierarchy
✅ **Fast performance** → Rentals cached after first load
✅ **Works with existing click popup** → Both features coexist

Your heatmap now provides **instant rental previews on hover** for quick browsing, and **detailed popups on click** for taking action!
