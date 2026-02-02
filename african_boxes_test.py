#!/usr/bin/env python3
"""
Specific test for African food boxes requirements
"""
import requests
import json
from datetime import datetime

class AfricanBoxesTest:
    def __init__(self, base_url="https://diet-africanbox.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_passed = 0
        self.tests_total = 0
        self.results = []

    def log_result(self, test_name, passed, details=""):
        self.tests_total += 1
        if passed:
            self.tests_passed += 1
            print(f"✅ {test_name}")
        else:
            print(f"❌ {test_name}: {details}")
        
        self.results.append({
            "test": test_name,
            "passed": passed,
            "details": details
        })

    def test_11_boxes_loaded(self):
        """Test that 11 boxes are loaded correctly"""
        try:
            response = requests.get(f"{self.base_url}/boxes", timeout=30)
            if response.status_code == 200:
                boxes = response.json()
                expected_count = 11
                actual_count = len(boxes)
                
                if actual_count == expected_count:
                    self.log_result(f"11 boxes loaded correctly", True, f"Found {actual_count} boxes")
                    return boxes
                else:
                    self.log_result(f"11 boxes loaded correctly", False, f"Expected {expected_count}, found {actual_count}")
                    return boxes
            else:
                self.log_result("11 boxes loaded correctly", False, f"API returned {response.status_code}")
                return []
        except Exception as e:
            self.log_result("11 boxes loaded correctly", False, f"Exception: {e}")
            return []

    def test_country_filtering(self):
        """Test country filtering functionality"""
        countries = ["gabon", "cameroun", "cote-ivoire", "congo", "senegal"]
        
        for country in countries:
            try:
                response = requests.get(f"{self.base_url}/boxes?country={country}", timeout=30)
                if response.status_code == 200:
                    boxes = response.json()
                    # Check that all returned boxes are from the requested country
                    all_correct_country = all(box.get('country') == country for box in boxes)
                    if all_correct_country and len(boxes) > 0:
                        self.log_result(f"Country filter '{country}' works", True, f"Found {len(boxes)} boxes")
                    elif len(boxes) == 0:
                        self.log_result(f"Country filter '{country}' works", True, f"No boxes for {country} (acceptable)")
                    else:
                        self.log_result(f"Country filter '{country}' works", False, "Some boxes from wrong country")
                else:
                    self.log_result(f"Country filter '{country}' works", False, f"API returned {response.status_code}")
            except Exception as e:
                self.log_result(f"Country filter '{country}' works", False, f"Exception: {e}")

    def test_countries_endpoint(self):
        """Test countries endpoint returns correct flags"""
        try:
            response = requests.get(f"{self.base_url}/countries", timeout=30)
            if response.status_code == 200:
                countries = response.json()
                expected_countries = {
                    "gabon": "🇬🇦",
                    "cameroun": "🇨🇲", 
                    "cote-ivoire": "🇨🇮",
                    "congo": "🇨🇩",
                    "senegal": "🇸🇳",
                    "multi": "🌍"
                }
                
                all_flags_correct = True
                for country in countries:
                    country_id = country.get('id')
                    flag = country.get('flag')
                    if country_id in expected_countries:
                        if flag != expected_countries[country_id]:
                            all_flags_correct = False
                            break
                
                self.log_result("Country flags correct", all_flags_correct, f"Found {len(countries)} countries")
            else:
                self.log_result("Country flags correct", False, f"API returned {response.status_code}")
        except Exception as e:
            self.log_result("Country flags correct", False, f"Exception: {e}")

    def test_box_details_and_dishes(self, boxes):
        """Test that box details show 4 dishes and correct pricing"""
        if not boxes:
            self.log_result("Box details with 4 dishes", False, "No boxes to test")
            return
        
        # Test a few sample boxes
        test_boxes = boxes[:3]  # Test first 3 boxes
        
        for box in test_boxes:
            box_id = box.get('id')
            box_name = box.get('name', 'Unknown')
            
            try:
                response = requests.get(f"{self.base_url}/boxes/{box_id}", timeout=30)
                if response.status_code == 200:
                    box_detail = response.json()
                    
                    # Check dishes
                    dishes = box_detail.get('dishes', [])
                    dishes_count = len(dishes)
                    
                    # Check price range (54€-75€)
                    price = box_detail.get('price', 0)
                    price_in_range = 54 <= price <= 75
                    
                    # Check highlights exist
                    highlights = box_detail.get('highlights', [])
                    has_highlights = len(highlights) > 0
                    
                    # Check nutritional info
                    nutritional_info = box_detail.get('nutritional_info', {})
                    has_nutrition = all(key in nutritional_info for key in ['proteins', 'carbs', 'fats', 'fiber'])
                    
                    self.log_result(f"Box '{box_name}' has 4 dishes", dishes_count == 4, f"Found {dishes_count} dishes")
                    self.log_result(f"Box '{box_name}' price in range", price_in_range, f"Price: {price}€")
                    self.log_result(f"Box '{box_name}' has highlights", has_highlights, f"Found {len(highlights)} highlights")
                    self.log_result(f"Box '{box_name}' has nutrition info", has_nutrition, f"Nutrition keys: {list(nutritional_info.keys())}")
                    
                else:
                    self.log_result(f"Box '{box_name}' detail accessible", False, f"API returned {response.status_code}")
            except Exception as e:
                self.log_result(f"Box '{box_name}' detail accessible", False, f"Exception: {e}")

    def test_specific_african_boxes(self):
        """Test for specific African boxes mentioned in requirements"""
        expected_boxes = [
            "nyembwe", "nkumu", "ndole", "poulet-dg", "koki", 
            "garba", "sauce-claire", "pondu", "mikate", "thieboudienne", "tour-afrique-centrale"
        ]
        
        try:
            response = requests.get(f"{self.base_url}/boxes", timeout=30)
            if response.status_code == 200:
                boxes = response.json()
                found_boxes = [box.get('id', '').lower() for box in boxes]
                
                for expected_box in expected_boxes:
                    found = any(expected_box in box_id for box_id in found_boxes)
                    self.log_result(f"Box containing '{expected_box}' exists", found, f"Searched in {len(found_boxes)} boxes")
            else:
                self.log_result("Specific African boxes exist", False, f"API returned {response.status_code}")
        except Exception as e:
            self.log_result("Specific African boxes exist", False, f"Exception: {e}")

    def run_all_tests(self):
        """Run all African boxes tests"""
        print("🍽️ Testing African Food Boxes Requirements...")
        print(f"Testing against: {self.base_url}")
        
        # First seed the data
        try:
            seed_response = requests.post(f"{self.base_url}/seed", timeout=30)
            if seed_response.status_code == 200:
                print("✅ Data seeded successfully")
            else:
                print(f"⚠️ Seed returned {seed_response.status_code}")
        except Exception as e:
            print(f"⚠️ Seed failed: {e}")
        
        # Run tests
        boxes = self.test_11_boxes_loaded()
        self.test_country_filtering()
        self.test_countries_endpoint()
        self.test_box_details_and_dishes(boxes)
        self.test_specific_african_boxes()
        
        # Summary
        print(f"\n📊 African Boxes Test Summary:")
        print(f"Tests passed: {self.tests_passed}/{self.tests_total}")
        print(f"Success rate: {(self.tests_passed/self.tests_total*100):.1f}%")
        
        return self.tests_passed, self.tests_total, self.results

def main():
    tester = AfricanBoxesTest()
    passed, total, results = tester.run_all_tests()
    
    # Save results
    with open('/app/african_boxes_test_results.json', 'w') as f:
        json.dump({
            'timestamp': datetime.now().isoformat(),
            'tests_passed': passed,
            'tests_total': total,
            'success_rate': (passed/total*100) if total > 0 else 0,
            'results': results
        }, f, indent=2)
    
    return 0 if passed == total else 1

if __name__ == "__main__":
    exit(main())