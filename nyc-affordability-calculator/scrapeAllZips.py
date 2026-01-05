"""
Scrape all NYC zip codes in chronological order
Uses ScraperAPI to scrape rental listings for all configured zip codes
"""

import time
import subprocess
import sys

# Load all NYC zip codes from file
def load_zip_codes():
    """Load zip codes from all_nyc_zipcodes.txt"""
    zip_codes = []
    try:
        with open('all_nyc_zipcodes.txt', 'r') as f:
            for line in f:
                line = line.strip()
                # Skip comments and empty lines
                if line and not line.startswith('#'):
                    # Split by comma and add to list
                    codes = [z.strip() for z in line.split(',') if z.strip()]
                    zip_codes.extend(codes)
        return zip_codes
    except FileNotFoundError:
        print("ERROR: all_nyc_zipcodes.txt not found")
        return []

ZIP_CODES = load_zip_codes()

DELAY_SECONDS = 3  # Delay between requests to be respectful

def main():
    print("\n=== Scraping All NYC Zip Codes ===")
    print(f"Total zip codes: {len(ZIP_CODES)}")
    print(f"Delay between requests: {DELAY_SECONDS}s\n")

    total_rentals = 0
    successful = 0
    failed = []

    for i, zip_code in enumerate(ZIP_CODES, 1):
        print(f"\n[{i}/{len(ZIP_CODES)}] Scraping ZIP {zip_code}...")
        print("=" * 50)

        try:
            # Run the scraper for this zip code
            result = subprocess.run(
                ['python', 'scrapeWithAPI.py', zip_code],
                capture_output=True,
                text=True,
                timeout=120
            )

            # Check if successful
            if result.returncode == 0:
                # Count rentals from output
                if "Saved" in result.stdout and "rentals to:" in result.stdout:
                    # Extract number of rentals
                    for line in result.stdout.split('\n'):
                        if "Saved" in line and "rentals to:" in line:
                            num = int(line.split("Saved ")[1].split(" rentals")[0])
                            total_rentals += num
                            successful += 1
                            print(f"SUCCESS: Got {num} listings for {zip_code}")
                            break
                else:
                    print(f"WARNING: Scraper ran but output unclear for {zip_code}")
            else:
                failed.append(zip_code)
                print(f"ERROR: Failed to scrape {zip_code}")
                print(result.stderr)

        except subprocess.TimeoutExpired:
            failed.append(zip_code)
            print(f"ERROR: Timeout scraping {zip_code}")
        except Exception as e:
            failed.append(zip_code)
            print(f"ERROR: {e}")

        # Delay before next request (except for last one)
        if i < len(ZIP_CODES):
            print(f"\nWaiting {DELAY_SECONDS}s before next zip code...")
            time.sleep(DELAY_SECONDS)

    # Summary
    print("\n" + "=" * 50)
    print("=== SUMMARY ===")
    print(f"Total zip codes processed: {len(ZIP_CODES)}")
    print(f"Successful: {successful}")
    print(f"Failed: {len(failed)}")
    print(f"Total rentals scraped: {total_rentals}")

    if failed:
        print(f"\nFailed zip codes: {', '.join(failed)}")

    print("\n=== Next Steps ===")
    print("1. Run: node updateTransitScores.js")
    print("2. Run: node updateDailyLivingScores.js")
    print("3. Run: node updateGroceryScores.js")
    print("4. Restart server: npm start")
    print(f"\nScraperAPI requests used: {successful}")
    print(f"Requests remaining: ~{1000 - successful}")
    print()

if __name__ == '__main__':
    main()
