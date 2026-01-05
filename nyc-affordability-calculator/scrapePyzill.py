"""
Zillow Rental Scraper using pyzill library
Scrapes rental listings for NYC zip codes

Usage: python scrapePyzill.py [zipCode]
Example: python scrapePyzill.py 10022

Note: Without proxies, Zillow may block requests after a few attempts.
For production use, configure proxies in the script.
"""

import pyzill
import json
import csv
import sys

# NYC Zip code coordinates (approximate centers and boundaries)
NYC_ZIP_COORDS = {
    '10001': {'center': (40.7506, -73.9971), 'ne': (40.7556, -73.9921), 'sw': (40.7456, -74.0021)},
    '10002': {'center': (40.7157, -73.9860), 'ne': (40.7207, -73.9810), 'sw': (40.7107, -73.9910)},
    '10003': {'center': (40.7310, -73.9896), 'ne': (40.7360, -73.9846), 'sw': (40.7260, -73.9946)},
    '10005': {'center': (40.7062, -74.0087), 'ne': (40.7112, -74.0037), 'sw': (40.7012, -74.0137)},
    '10006': {'center': (40.7095, -74.0131), 'ne': (40.7145, -74.0081), 'sw': (40.7045, -74.0181)},
    '10007': {'center': (40.7137, -74.0078), 'ne': (40.7187, -74.0028), 'sw': (40.7087, -74.0128)},
    '10009': {'center': (40.7265, -73.9786), 'ne': (40.7315, -73.9736), 'sw': (40.7215, -73.9836)},
    '10010': {'center': (40.7393, -73.9812), 'ne': (40.7443, -73.9762), 'sw': (40.7343, -73.9862)},
    '10011': {'center': (40.7406, -74.0006), 'ne': (40.7456, -73.9956), 'sw': (40.7356, -74.0056)},
    '10012': {'center': (40.7255, -73.9983), 'ne': (40.7305, -73.9933), 'sw': (40.7205, -74.0033)},
    '10022': {'center': (40.7583, -73.9676), 'ne': (40.7633, -73.9626), 'sw': (40.7533, -73.9726)},
    '11201': {'center': (40.6944, -73.9896), 'ne': (40.6994, -73.9846), 'sw': (40.6894, -73.9946)},
    '11203': {'center': (40.6500, -73.9343), 'ne': (40.6550, -73.9293), 'sw': (40.6450, -73.9393)},
}

def scrape_rentals(zip_code, use_proxy=False):
    """
    Scrape rental listings for a zip code using pyzill

    Args:
        zip_code: ZIP code to scrape
        use_proxy: Whether to use proxy (configure credentials below)

    Returns:
        List of rental listings
    """

    if zip_code not in NYC_ZIP_COORDS:
        print(f"❌ ZIP code {zip_code} not in database")
        print(f"Available ZIP codes: {', '.join(NYC_ZIP_COORDS.keys())}")
        return []

    coords = NYC_ZIP_COORDS[zip_code]
    ne_lat, ne_long = coords['ne']
    sw_lat, sw_long = coords['sw']

    print(f"\nScraping rentals for ZIP {zip_code}")
    print(f"Coordinates: NE({ne_lat}, {ne_long}) SW({sw_lat}, {sw_long})")

    # Configure proxy if needed
    proxy_url = None
    if use_proxy:
        # TODO: Configure your proxy credentials here
        proxy_url = pyzill.parse_proxy(
            "[proxy_ip]",
            "[proxy_port]",
            "[proxy_username]",
            "[proxy_password]"
        )
        print("Using proxy")
    else:
        print("WARNING: No proxy - Zillow may block after a few requests")

    try:
        print("\nFetching rental listings...")

        # Scrape rental listings
        results = pyzill.for_rent(
            pagination=1,
            search_value="",
            is_entire_place=False,
            is_room=False,
            min_beds=None,
            max_beds=None,
            min_bathrooms=None,
            max_bathrooms=None,
            min_price=None,
            max_price=None,
            ne_lat=ne_lat,
            ne_long=ne_long,
            sw_lat=sw_lat,
            sw_long=sw_long,
            zoom_value=15,
            proxy_url=proxy_url
        )

        print(f"Success: Received response from Zillow")
        return results

    except Exception as e:
        print(f"ERROR: {e}")
        return []

def convert_to_csv(results, zip_code):
    """
    Convert pyzill results to CSV format matching our schema

    Args:
        results: Pyzill results
        zip_code: ZIP code being scraped

    Returns:
        List of rental dictionaries
    """
    rentals = []

    # Extract properties from results
    # Note: Adjust based on actual pyzill response structure
    if isinstance(results, dict) and 'cat1' in results:
        properties = results.get('cat1', {}).get('searchResults', {}).get('listResults', [])
    elif isinstance(results, list):
        properties = results
    else:
        properties = []

    print(f"\nProcessing {len(properties)} properties...")

    for prop in properties:
        try:
            # Extract data (adjust keys based on actual response)
            rental = {
                'address': prop.get('address', ''),
                'zip': zip_code,
                'price': prop.get('price', 0),
                'bedrooms': prop.get('beds', ''),
                'bathrooms': prop.get('baths', ''),
                'sqft': prop.get('area', ''),
                'url': f"https://www.zillow.com{prop.get('detailUrl', '')}",
                'lat': prop.get('latLong', {}).get('latitude', ''),
                'lng': prop.get('latLong', {}).get('longitude', ''),
                'Transit Score': 0,
                'Social Score': 0,
                'Grocery Score': 0
            }

            if rental['address']:
                rentals.append(rental)
                print(f"  OK: {rental['address']} - ${rental['price']}/mo")
        except Exception as e:
            print(f"  WARNING: Error processing property: {e}")

    return rentals

def save_to_csv(rentals, zip_code):
    """Save rentals to CSV file"""
    if not rentals:
        print("\nERROR: No rentals to save")
        return

    filename = f"./{zip_code} Rental Listings.csv"

    with open(filename, 'w', newline='', encoding='utf-8') as f:
        fieldnames = ['address', 'zip', 'price', 'bedrooms', 'bathrooms', 'sqft',
                     'url', 'lat', 'lng', 'Transit Score', 'Social Score', 'Grocery Score']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rentals)

    print(f"\nSaved {len(rentals)} rentals to: {filename}")

def main():
    print("\n=== Pyzill Rental Scraper ===")

    # Get zip code from command line
    if len(sys.argv) < 2:
        print("Usage: python scrapePyzill.py [zipCode]")
        print(f"Available ZIP codes: {', '.join(NYC_ZIP_COORDS.keys())}")
        return

    zip_code = sys.argv[1]

    # Scrape rentals
    results = scrape_rentals(zip_code, use_proxy=False)

    if not results:
        print("\nERROR: No results received. Zillow may have blocked the request.")
        print("TIP: Try using proxies for reliable scraping")
        return

    # Save raw JSON for debugging
    with open(f'./{zip_code}_raw.json', 'w') as f:
        json.dump(results, f, indent=2)
    print(f"\nSaved raw response to: {zip_code}_raw.json")

    # Convert to CSV
    rentals = convert_to_csv(results, zip_code)

    # Save to CSV
    save_to_csv(rentals, zip_code)

    print("\nNext steps:")
    print("1. Run: node updateTransitScores.js")
    print("2. Run: node updateDailyLivingScores.js")
    print("3. Run: node updateGroceryScores.js\n")

if __name__ == '__main__':
    main()
