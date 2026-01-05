"""
Zillow Rental Scraper using ScraperAPI
Scrapes rental listings for NYC zip codes using ScraperAPI service

Usage: python scrapeWithAPI.py [zipCode]
Example: python scrapeWithAPI.py 10022

Setup:
1. Sign up at https://scraperapi.com (free 1,000 requests)
2. Get your API key
3. Set SCRAPERAPI_KEY environment variable or edit this file
"""

import requests
import json
import csv
import sys
import os
from bs4 import BeautifulSoup

# ScraperAPI configuration
SCRAPERAPI_KEY = os.getenv('SCRAPERAPI_KEY', '2a0099e7c522ae59bf0c9770487a7e55')
SCRAPERAPI_ENDPOINT = 'http://api.scraperapi.com'

def scrape_zillow_search(zip_code):
    """
    Scrape Zillow search results for a zip code using ScraperAPI

    Args:
        zip_code: ZIP code to search

    Returns:
        HTML content of search results page
    """

    if SCRAPERAPI_KEY == 'YOUR_API_KEY_HERE':
        print("\nERROR: ScraperAPI key not configured!")
        print("Please set your API key:")
        print("1. Edit this file and replace YOUR_API_KEY_HERE")
        print("2. Or set environment variable: set SCRAPERAPI_KEY=your_key")
        return None

    # Zillow rental search URL
    zillow_url = f'https://www.zillow.com/homes/for_rent/{zip_code}_rb/'

    print(f"\nScraping Zillow for ZIP {zip_code}")
    print(f"Target URL: {zillow_url}")
    print("Using ScraperAPI to bypass anti-bot protection...")

    # ScraperAPI parameters
    params = {
        'api_key': SCRAPERAPI_KEY,
        'url': zillow_url,
        'render': 'true'  # Enable JavaScript rendering
    }

    try:
        print("Sending request...")
        response = requests.get(SCRAPERAPI_ENDPOINT, params=params, timeout=60)

        if response.status_code == 200:
            print("Success! Received page content")
            return response.text
        elif response.status_code == 401:
            print("ERROR: Invalid API key")
            return None
        elif response.status_code == 429:
            print("ERROR: API rate limit exceeded")
            return None
        else:
            print(f"ERROR: HTTP {response.status_code}")
            return None

    except Exception as e:
        print(f"ERROR: {e}")
        return None

def extract_listings_from_html(html, zip_code):
    """
    Extract rental listings from Zillow HTML

    Args:
        html: HTML content
        zip_code: ZIP code being scraped

    Returns:
        List of rental dictionaries
    """

    rentals = []

    try:
        # Look for JSON data in script tag
        if '__NEXT_DATA__' in html:
            print("\nFound embedded JSON data, extracting...")

            # Extract JSON from script tag
            start = html.find('<script id="__NEXT_DATA__" type="application/json">') + len('<script id="__NEXT_DATA__" type="application/json">')
            end = html.find('</script>', start)
            json_str = html[start:end]

            data = json.loads(json_str)

            # Navigate to search results
            search_results = data.get('props', {}).get('pageProps', {}).get('searchPageState', {}).get('cat1', {}).get('searchResults', {}).get('listResults', [])

            print(f"Found {len(search_results)} listings in JSON")

            for item in search_results:
                try:
                    hdp_data = item.get('hdpData', {}).get('homeInfo', {})

                    rental = {
                        'address': hdp_data.get('streetAddress', ''),
                        'zip': zip_code,
                        'price': hdp_data.get('price', 0),
                        'bedrooms': hdp_data.get('bedrooms', ''),
                        'bathrooms': hdp_data.get('bathrooms', ''),
                        'sqft': hdp_data.get('livingArea', ''),
                        'url': f"https://www.zillow.com{hdp_data.get('hdpUrl', '')}",
                        'lat': hdp_data.get('latitude', ''),
                        'lng': hdp_data.get('longitude', ''),
                        'Transit Score': 0,
                        'Social Score': 0,
                        'Grocery Score': 0
                    }

                    if rental['address']:
                        rentals.append(rental)
                        print(f"  OK: {rental['address']} - ${rental['price']}/mo - {rental['bedrooms']}bd/{rental['bathrooms']}ba")

                except Exception as e:
                    print(f"  WARNING: Error parsing listing: {e}")

        else:
            print("WARNING: No JSON data found in page")

    except Exception as e:
        print(f"ERROR extracting listings: {e}")

    return rentals

def save_to_csv(rentals, zip_code):
    """Save rentals to CSV file"""

    if not rentals:
        print("\nNo rentals to save")
        return

    filename = f"./{zip_code} Rental Listings.csv"

    with open(filename, 'w', newline='', encoding='utf-8') as f:
        fieldnames = ['address', 'zip', 'price', 'bedrooms', 'bathrooms', 'sqft',
                     'url', 'lat', 'lng', 'Transit Score', 'Social Score', 'Grocery Score']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rentals)

    print(f"\nSaved {len(rentals)} rentals to: {filename}")

    # Show stats
    with_coords = len([r for r in rentals if r['lat'] and r['lng']])
    print(f"Listings with coordinates: {with_coords}/{len(rentals)}")

    avg_price = sum(r['price'] for r in rentals if r['price']) / len(rentals) if rentals else 0
    print(f"Average price: ${avg_price:.0f}/mo")

def main():
    print("\n=== ScraperAPI Zillow Scraper ===")

    # Get zip code from command line
    if len(sys.argv) < 2:
        print("Usage: python scrapeWithAPI.py [zipCode]")
        print("Example: python scrapeWithAPI.py 10022")
        return

    zip_code = sys.argv[1]

    # Scrape Zillow
    html = scrape_zillow_search(zip_code)

    if not html:
        print("\nFailed to scrape Zillow")
        return

    # Save raw HTML for debugging
    with open(f'./{zip_code}_page.html', 'w', encoding='utf-8') as f:
        f.write(html)
    print(f"\nSaved raw HTML to: {zip_code}_page.html")

    # Extract listings
    rentals = extract_listings_from_html(html, zip_code)

    # Save to CSV
    save_to_csv(rentals, zip_code)

    if rentals:
        print("\nNext steps:")
        print("1. Run: node updateTransitScores.js")
        print("2. Run: node updateDailyLivingScores.js")
        print("3. Run: node updateGroceryScores.js")
        print("\nScraperAPI requests used: 1")
        print("Requests remaining: Check your dashboard at https://scraperapi.com/dashboard")

    print()

if __name__ == '__main__':
    main()
