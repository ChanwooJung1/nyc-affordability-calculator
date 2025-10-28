# Score Calculation Analysis & Optimization

## Current Score Calculation

### 1. **Housing Affordability Score** (0-100)
```python
housing_score = max(0, min(100, 100 - ((price - median_price) / median_price * 100)))
```

**How it works:**
- Compares rental price to median price within the same ZIP
- Lower than median = higher score
- Higher than median = lower score

**Example:**
- Median price: $4,000/mo
- Rental A: $3,000/mo → Score: 125 (capped at 100)
- Rental B: $4,000/mo → Score: 100
- Rental C: $5,000/mo → Score: 75

**Issues:**
- ❌ Score can go above 100 (needs capping)
- ❌ Very sensitive to median - small price differences create large score swings
- ❌ Doesn't account for absolute affordability (is $3,000 actually affordable?)
- ❌ Comparing within ZIP only - doesn't show if entire ZIP is expensive

---

### 2. **Transit Score** (0-100)
```python
transit = rental.get('Transit Score', 0)  # Used directly
```

**How it works:**
- Currently all 0 (not yet calculated)
- Should be: Average commute time to key destinations
- Lower time = higher score

**Target calculation (not implemented yet):**
```
15 min commute = 100
30 min commute = 75
60 min commute = 25
90+ min commute = 0
```

**Issues:**
- ⚠️ Not yet populated with real data
- ⚠️ Need to run `updateTransitScores.js`

---

### 3. **Social Score (Daily Living)** (0-100)
```python
social_normalized = min(100, (social / 20) * 100) if social > 0 else 0
```

**How it works:**
- Raw count of cafes/restaurants within 0.5 miles
- Divides by 20 (assumed max) and scales to 100
- 20+ venues = 100 score

**Example:**
- 0 venues → 0
- 10 venues → 50
- 20+ venues → 100

**Issues:**
- ❌ Hardcoded assumption that 20 is "good"
- ❌ Currently shows all locations with exactly 20 (hitting API limit)
- ❌ Doesn't account for quality of venues
- ❌ Linear scaling may not reflect real value (10→20 venues isn't 2x better)

---

### 4. **Grocery Score** (0-100)
```python
grocery_normalized = min(100, max(0, grocery)) if grocery > 0 else 0
```

**How it works:**
- Based on types of grocery stores nearby
- Budget stores (Trader Joe's, Aldi) = higher score
- Premium stores (Whole Foods) = lower score
- Raw score is 50-150 range

**Example:**
- Score 85 → Mostly budget stores
- Score 100 → Mix of options
- Score 115 → Many budget options

**Issues:**
- ❌ Assumes raw score is already 0-100 (but it's actually 50-150)
- ❌ Score > 100 gets capped, losing information
- ❌ No clear weighting formula visible

---

### 5. **Overall Affordability Index** (0-100)
```python
affordability_index = (
    housing_score * 0.6 +      # 60%
    transit * 0.2 +             # 20%
    social_normalized * 0.1 +   # 10%
    grocery_normalized * 0.1    # 10%
)
```

**Weights (default):**
- Housing: 60%
- Transit: 20%
- Daily Living: 10%
- Grocery: 10%

**Issues:**
- ❌ Heavy weight on housing (60%) may overshadow other factors
- ❌ Transit has no data yet, so effectively only 80% of score matters
- ❌ Arbitrary weights - not based on actual cost impact

---

## Problems & Issues

### Critical Issues:

1. **Transit Data Missing**
   - All transit scores are 0
   - 20% of affordability score is meaningless
   - Need to run `updateTransitScores.js`

2. **Housing Score Can Exceed 100**
   - Formula: `100 - ((price - median) / median * 100)`
   - If price is 50% below median: 100 - (-50) = 150
   - Gets capped but still incorrect

3. **Social Score Hits API Limit**
   - Google Places API returns max 20 results
   - All neighborhoods show exactly 20 venues
   - No differentiation between good/great neighborhoods

4. **Grocery Score Range Mismatch**
   - Expects 0-100 but receives 50-150
   - Values above 100 get capped at 100
   - Loses granularity

5. **No Absolute Affordability Context**
   - Housing score is relative to ZIP median
   - Doesn't show if $4,000 is actually affordable for target users
   - A $3,000 rental in expensive ZIP gets low score vs median
   - Same $3,000 rental in cheap ZIP gets high score

---

## Optimal Calculation Methods

### 1. **Improved Housing Score**

**Option A: Percentile-Based (Recommended)**
```python
def calculate_housing_score_percentile(price, all_prices):
    """Better: Use percentile rank"""
    percentile = stats.percentileofscore(all_prices, price, kind='rank')
    # Lower percentile = cheaper = better score
    return 100 - percentile
```

**Benefits:**
- ✅ Always 0-100 range
- ✅ Shows where rental ranks among ALL options
- ✅ Less sensitive to outliers
- ✅ Intuitive: 90 score = cheaper than 90% of rentals

**Option B: Income-Based Affordability**
```python
def calculate_housing_score_income(price, target_income=50000):
    """Use 30% rule: housing shouldn't exceed 30% of gross income"""
    max_affordable = (target_income / 12) * 0.3

    if price <= max_affordable:
        return 100  # Affordable
    elif price <= max_affordable * 1.5:
        # Moderately expensive
        return 100 - ((price - max_affordable) / max_affordable * 100)
    else:
        # Very expensive
        return max(0, 100 - ((price - max_affordable) / max_affordable * 150))
```

**Benefits:**
- ✅ Based on real affordability metric (30% rule)
- ✅ Absolute measure, not relative
- ✅ Customizable to user income
- ✅ Accounts for target demographic

---

### 2. **Improved Transit Score**

**Current (Planned):**
```python
# Average commute time → score
transit_score = max(0, min(100, 100 - (avg_commute_time - 15) * 2))
```

**Better Approach:**
```python
def calculate_transit_score_improved(commute_times):
    """
    Use weighted commute times with diminishing returns
    commute_times: dict like {'work': 30, 'social': 20, 'grocery': 10}
    """
    weighted_time = (
        commute_times.get('work', 60) * 0.5 +      # Work most important
        commute_times.get('social', 60) * 0.3 +    # Social/dining
        commute_times.get('grocery', 60) * 0.2     # Groceries/errands
    )

    # Non-linear decay: first 30 min matter more than 30-60 min
    if weighted_time <= 20:
        return 100
    elif weighted_time <= 40:
        return 100 - (weighted_time - 20) * 2
    else:
        return max(0, 60 - (weighted_time - 40))
```

**Benefits:**
- ✅ Weights different trip types
- ✅ Non-linear (reflects real inconvenience)
- ✅ Work commute weighted highest

---

### 3. **Improved Social Score**

**Current Issue:** All show 20 venues (API limit)

**Solution A: Use Density Score**
```python
def calculate_social_score_density(venue_count, population_density):
    """Normalize by population density"""
    venues_per_1000 = (venue_count / population_density) * 1000
    return min(100, venues_per_1000 * 10)
```

**Solution B: Weighted by Type**
```python
def calculate_social_score_weighted(venues):
    """Weight different venue types"""
    score = 0
    score += len(venues.get('coffee_shops', [])) * 3   # Coffee shops important
    score += len(venues.get('restaurants', [])) * 2    # Restaurants
    score += len(venues.get('bars', [])) * 1          # Bars less weight
    score += len(venues.get('parks', [])) * 2         # Parks/recreation

    return min(100, score)
```

**Solution C: Use Yelp Ratings** (Best)
```python
def calculate_social_score_quality(venues):
    """Include quality, not just quantity"""
    total_score = 0
    for venue in venues:
        rating = venue.get('rating', 3.0)  # Yelp/Google rating
        review_count = min(venue.get('reviews', 0), 100)

        # Weight by both rating and popularity
        venue_score = (rating / 5) * (1 + review_count / 200)
        total_score += venue_score

    return min(100, (total_score / len(venues)) * 20)
```

**Benefits:**
- ✅ Accounts for quality, not just quantity
- ✅ Popular highly-rated venues score higher
- ✅ More realistic than raw count

---

### 4. **Improved Grocery Score**

**Current:** Raw score 50-150, capped at 100

**Better Approach:**
```python
def calculate_grocery_score_improved(stores):
    """Score based on store types and proximity"""
    score = 0

    # Budget stores (save $100-200/month)
    budget_stores = ['Trader Joe\'s', 'Aldi', 'Costco', 'BJ\'s']
    score += len([s for s in stores if s['name'] in budget_stores]) * 30

    # Mid-range stores
    mid_stores = ['Stop & Shop', 'Key Food', 'Associated']
    score += len([s for s in stores if s['name'] in mid_stores]) * 20

    # Premium stores (informational, slight penalty)
    premium_stores = ['Whole Foods', 'Gourmet Garage']
    score += len([s for s in stores if s['name'] in premium_stores]) * 10

    # Bonus for variety
    if len(stores) >= 3:
        score += 10

    # Distance penalty
    avg_distance = sum(s['distance'] for s in stores) / len(stores)
    if avg_distance > 0.5:  # miles
        score *= 0.8

    return min(100, score)
```

**Benefits:**
- ✅ Clear scoring by store type
- ✅ Accounts for distance
- ✅ Rewards variety
- ✅ Based on actual cost savings

---

### 5. **Improved Overall Index**

**Current:** Simple weighted average

**Better Approach A: Dynamic Weights by User Type**
```python
def calculate_overall_score_persona(scores, persona='student'):
    """Adjust weights based on user persona"""

    weights = {
        'student': {
            'housing': 0.50,   # Lower income, more price-sensitive
            'transit': 0.30,   # Need good transit (no car)
            'social': 0.15,    # Social life important
            'grocery': 0.05
        },
        'young_professional': {
            'housing': 0.45,
            'transit': 0.25,
            'social': 0.20,
            'grocery': 0.10
        },
        'family': {
            'housing': 0.40,
            'transit': 0.15,
            'social': 0.10,
            'grocery': 0.35    # Groceries more important for families
        }
    }

    w = weights.get(persona, weights['young_professional'])
    return sum(scores[k] * w[k] for k in scores)
```

**Better Approach B: Cost-Impact Based Weights**
```python
def calculate_overall_score_cost_impact(scores):
    """Weight by actual monthly cost impact"""

    # Monthly cost impact of each factor (NYC averages)
    cost_impacts = {
        'housing': 1.0,        # $3000-5000/mo baseline
        'transit': 0.25,       # $750/mo if need car vs $127 MTA pass
        'social': 0.067,       # $200/mo in delivery fees if not walkable
        'grocery': 0.05        # $150/mo if only premium stores
    }

    # Normalize weights to sum to 1
    total = sum(cost_impacts.values())
    weights = {k: v/total for k, v in cost_impacts.items()}

    # Housing: 74%, Transit: 18%, Social: 5%, Grocery: 3%
    return sum(scores[k] * weights[k] for k in scores)
```

**Benefits:**
- ✅ Based on actual cost data
- ✅ Housing naturally weighted highest (biggest expense)
- ✅ Reflects real budget impact

---

## Recommended Changes

### Priority 1: Fix Critical Issues

1. **Run Transit Score Updates**
   ```bash
   cd nyc-affordability-calculator
   node updateTransitScores.js
   ```

2. **Fix Housing Score Formula**
   ```python
   # Replace with percentile-based
   housing_score = 100 - stats.percentileofscore(all_prices, price)
   ```

3. **Fix Grocery Score Normalization**
   ```python
   # Map 50-150 range to 0-100
   grocery_normalized = ((grocery - 50) / 100) * 100
   grocery_normalized = max(0, min(100, grocery_normalized))
   ```

---

### Priority 2: Enhanced Scoring

1. **Add Income-Based Affordability Option**
   - Let users input income
   - Calculate if rental is within 30% rule
   - Show absolute affordability, not just relative

2. **Improve Social Score with Quality**
   - Use Google Places ratings
   - Weight popular venues higher
   - Consider venue types (coffee > bars for students)

3. **Add Distance Penalties**
   - Penalize grocery stores > 0.5 miles
   - Penalize transit stations > 0.25 miles
   - Account for walkability

---

### Priority 3: User Customization

1. **Persona-Based Weights**
   - Student vs Young Professional vs Family
   - Different priorities for each group

2. **Cost-Impact Weights**
   - Base weights on actual monthly cost data
   - More realistic than arbitrary percentages

3. **Custom Sliders (Already Implemented!)**
   - Let users adjust priorities
   - Show how scores change in real-time

---

## Implementation Recommendation

### Immediate (Next Session):
1. Fix housing score overflow (percentile method)
2. Fix grocery score normalization (50-150 → 0-100)
3. Run transit score updates

### Short-term (This Week):
1. Add income-based affordability toggle
2. Improve social score with ratings
3. Add distance penalties

### Long-term (Future):
1. Implement persona-based presets
2. Add machine learning to optimize weights
3. Include real cost savings estimates

---

## Summary

### Current System:
- ⚠️ Housing: Relative to median (can overflow)
- ❌ Transit: All zeros (not calculated)
- ⚠️ Social: All maxed at API limit (no differentiation)
- ⚠️ Grocery: Range mismatch (50-150 treated as 0-100)
- ⚠️ Overall: Arbitrary weights (60/20/10/10)

### Optimal System Would Have:
- ✅ Housing: Percentile-based OR income-based
- ✅ Transit: Weighted by trip type, non-linear decay
- ✅ Social: Quality + quantity, not just count
- ✅ Grocery: Type-based scoring with distance penalty
- ✅ Overall: Cost-impact based weights OR persona-based

### Impact of Changes:
- More accurate representation of true affordability
- Better differentiation between similar rentals
- Customizable to user's actual situation
- Based on real-world costs, not arbitrary weights

Would you like me to implement any of these improvements?
