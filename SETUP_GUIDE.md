# NYC Affordability Heatmap - Setup Guide

## Overview

This guide walks you through calculating social and transit scores for all NYC ZIP codes and updating the heatmap to use the new scoring system.

## New Scoring System

### Overall Score Formula (Updated)
**Overall Score** = (Housing × 40%) + (Social × 30%) + (Transit × 30%)

### Score Breakdown:
1. **Housing Score (40%)**: Median home values (proxy for rent affordability)
2. **Social Score (30%)**: Coffee shops & restaurants within 0.5 miles
3. **Transit Score (30%)**: Average transit time to key NYC destinations

**Old scores** (tax, healthcare) are preserved in CSV but not used in overall calculation.

---

## Prerequisites

1. **Python 3.x** with pandas and requests
   ```bash
   pip install pandas requests python-dotenv
   ```

2. **Google API Keys** (already in `brooklyn-rentals/.env`):
   - Google Places API Key
   - Google Distance Matrix API Key

3. **Time**: ~15-20 minutes total for all 246 NYC ZIP codes

---

## Step-by-Step Instructions

### Step 1: Calculate Social Scores
**Estimated time**: 2-3 minutes

```bash
cd scripts
python calculate_social_scores.py
```

**What it does**:
- Queries Google Places API for each ZIP code center
- Counts coffee shops and restaurants within 0.5 miles
- Normalizes scores to 0-100 scale
- Updates `nyc_affordability_scores.csv` with `social_score` column

**API calls**: ~246 calls (one per ZIP code)

---

### Step 2: Calculate Transit Scores
**Estimated time**: 10-15 minutes

```bash
python calculate_transit_scores.py
```

**What it does**:
- Queries Google Distance Matrix API for transit times
- Tests routes to 3 key destinations:
  - Manhattan Financial District
  - Midtown Manhattan
  - Downtown Brooklyn
- Calculates average transit time and converts to 0-100 score
- Updates `nyc_affordability_scores.csv` with `transit_score` column

**API calls**: ~738 calls (246 ZIP codes × 3 destinations)

---

### Step 3: Recalculate Overall Scores
**Estimated time**: Instant

```bash
python update_overall_score.py
```

**What it does**:
- Recalculates `overall_score` using new formula
- Shows summary statistics by borough
- Displays top 5 best ZIP codes

---

### Step 4: Test the Updated Heatmap

```bash
cd ..
python app_nyc.py
```

Then open: **http://localhost:5000**

**What to check**:
- Click on any ZIP code
- Popup should show:
  - 🏠 Housing score
  - ☕ Social score
  - 🚇 Transit score
  - Overall score
- Verify scores look reasonable

---

## Expected Results

### Social Scores
- **High scores** (80-100): Manhattan (Midtown, East Village, SoHo)
- **Medium scores** (40-80): Brooklyn (Williamsburg, Park Slope)
- **Lower scores** (0-40): Outer boroughs, residential areas

### Transit Scores
- **High scores** (80-100): Manhattan (near subway hubs)
- **Medium scores** (40-80): Brooklyn, Queens (good subway access)
- **Lower scores** (0-40): Staten Island, outer Queens/Bronx

### Overall Scores
Manhattan neighborhoods should generally score highest due to:
- High social scores (many venues)
- High transit scores (subway access)
- But lower housing scores (expensive)

Brooklyn/Queens may score well overall due to:
- Better housing affordability
- Moderate social/transit scores

---

## Troubleshooting

### "API key not found"
- Check that `brooklyn-rentals/.env` exists and contains API keys
- Scripts load keys from `../brooklyn-rentals/.env`

### "Rate limit exceeded"
- Scripts include delays (0.5 seconds between calls)
- If you hit rate limit, wait a few minutes and re-run
- Progress is saved every 25-50 rows

### "No data available"
- Check your Google Cloud Console
- Ensure APIs are enabled:
  - Places API (New)
  - Distance Matrix API
- Check API key restrictions

### Scores are all 0
- Social/transit scores won't exist until you run the calculation scripts
- Run scripts in order (social → transit → update overall)

---

## Data Structure

### CSV Columns After Setup:

```
zip_code          # 5-digit ZIP code
lat, lng          # Coordinates
borough           # Manhattan, Brooklyn, etc.

# NEW SCORES (used in overall_score)
housing_score     # 0-100
social_score      # 0-100  ← NEW
transit_score     # 0-100  ← NEW

# OLD SCORES (preserved but not used)
tax_score         # 0-100
healthcare_score  # 0-100

overall_score     # 0-100 (UPDATED formula)
```

---

## Cost Estimate

### Google API Pricing (as of 2025):
- **Places API (New)**: $17 per 1,000 requests
- **Distance Matrix API**: $5-10 per 1,000 requests

### This Project:
- Social scores: 246 calls = ~$4.18
- Transit scores: 738 calls = ~$3.69-$7.38
- **Total**: ~$8-12 for one-time setup

**Note**: Google gives $200/month free credit, so this should be free unless you've used your credit.

---

## Next Steps

After running all scripts:

1. **Test the heatmap** - Make sure scores look reasonable
2. **Update documentation** - README.md reflects new scoring
3. **Consider additions**:
   - Add rent data if free source found
   - Filter by score ranges
   - Compare ZIP codes side-by-side

---

## Files Modified

- `nyc_affordability_scores.csv` - Main data file (adds social_score, transit_score)
- `app_nyc.py` - Flask app (updated to pass new scores to template)
- `templates/index_nyc.html` - UI (shows new scores in popup)

## Files Created

- `scripts/calculate_social_scores.py`
- `scripts/calculate_transit_scores.py`
- `scripts/update_overall_score.py`
- `SETUP_GUIDE.md` (this file)

---

## Questions?

Check the project context: `.claude/project_context.md`
