import requests
import sys
import json
from datetime import datetime, timedelta

class AfroBoxAPITester:
    def __init__(self, base_url="https://diet-africanbox.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=30)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            
            if not success:
                try:
                    error_data = response.json()
                    details += f", Response: {error_data}"
                except:
                    details += f", Response: {response.text[:200]}"
            
            self.log_test(name, success, details)
            
            if success:
                try:
                    return response.json()
                except:
                    return {}
            return None

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return None

    def test_seed_data(self):
        """Test data seeding"""
        print("\n🌱 Testing Data Seeding...")
        result = self.run_test("Seed Data", "POST", "seed", 200)
        return result is not None

    def test_authentication(self):
        """Test user registration and login"""
        print("\n🔐 Testing Authentication...")
        
        # Generate unique test user
        timestamp = datetime.now().strftime("%H%M%S")
        test_email = f"test_user_{timestamp}@afrobox.com"
        test_password = "TestPass123!"
        test_name = f"Test User {timestamp}"

        # Test registration
        register_data = {
            "email": test_email,
            "password": test_password,
            "name": test_name
        }
        
        result = self.run_test("User Registration", "POST", "auth/register", 200, register_data)
        if result and 'access_token' in result:
            self.token = result['access_token']
            self.user_id = result['user']['id']
            
            # Test login with same credentials
            login_data = {"email": test_email, "password": test_password}
            login_result = self.run_test("User Login", "POST", "auth/login", 200, login_data)
            
            # Test get current user
            me_result = self.run_test("Get Current User", "GET", "auth/me", 200)
            
            return all([result, login_result, me_result])
        
        return False

    def test_boxes_endpoints(self):
        """Test box-related endpoints"""
        print("\n📦 Testing Boxes Endpoints...")
        
        # Test get all boxes
        boxes_result = self.run_test("Get All Boxes", "GET", "boxes", 200)
        
        # Test get featured boxes
        featured_result = self.run_test("Get Featured Boxes", "GET", "boxes/featured/list", 200)
        
        # Test category filter
        category_result = self.run_test("Get Boxes by Category", "GET", "boxes?category=decouverte", 200)
        
        # Test region filter
        region_result = self.run_test("Get Boxes by Region", "GET", "boxes?region=ouest", 200)
        
        # Test get specific box (if we have boxes)
        box_detail_result = None
        if boxes_result and len(boxes_result) > 0:
            box_id = boxes_result[0]['id']
            box_detail_result = self.run_test("Get Box Detail", "GET", f"boxes/{box_id}", 200)
        
        return all([boxes_result, featured_result, category_result, region_result])

    def test_recipes_endpoints(self):
        """Test recipe-related endpoints"""
        print("\n👨‍🍳 Testing Recipes Endpoints...")
        
        # Test get all recipes
        recipes_result = self.run_test("Get All Recipes", "GET", "recipes", 200)
        
        # Test region filter
        region_result = self.run_test("Get Recipes by Region", "GET", "recipes?region=ouest", 200)
        
        # Test get specific recipe (if we have recipes)
        recipe_detail_result = None
        if recipes_result and len(recipes_result) > 0:
            recipe_id = recipes_result[0]['id']
            recipe_detail_result = self.run_test("Get Recipe Detail", "GET", f"recipes/{recipe_id}", 200)
        
        return all([recipes_result, region_result])

    def test_cart_functionality(self):
        """Test cart operations"""
        print("\n🛒 Testing Cart Functionality...")
        
        if not self.token:
            print("❌ Cannot test cart - no authentication token")
            return False
        
        # Get empty cart first
        empty_cart = self.run_test("Get Empty Cart", "GET", "cart", 200)
        
        # Get boxes to add to cart
        boxes_result = self.run_test("Get Boxes for Cart Test", "GET", "boxes", 200)
        if not boxes_result or len(boxes_result) == 0:
            print("❌ No boxes available for cart testing")
            return False
        
        box_id = boxes_result[0]['id']
        
        # Add item to cart
        add_data = {"box_id": box_id, "quantity": 2}
        add_result = self.run_test("Add to Cart", "POST", "cart/add", 200, add_data)
        
        # Get cart with items
        cart_with_items = self.run_test("Get Cart with Items", "GET", "cart", 200)
        
        # Update quantity
        update_result = self.run_test("Update Cart Quantity", "PUT", f"cart/{box_id}?quantity=3", 200)
        
        # Remove item
        remove_result = self.run_test("Remove from Cart", "DELETE", f"cart/{box_id}", 200)
        
        return all([empty_cart, add_result, cart_with_items, update_result, remove_result])

    def test_orders_functionality(self):
        """Test order operations"""
        print("\n📋 Testing Orders Functionality...")
        
        if not self.token:
            print("❌ Cannot test orders - no authentication token")
            return False
        
        # First add something to cart
        boxes_result = self.run_test("Get Boxes for Order Test", "GET", "boxes", 200)
        if not boxes_result or len(boxes_result) == 0:
            print("❌ No boxes available for order testing")
            return False
        
        box_id = boxes_result[0]['id']
        add_data = {"box_id": box_id, "quantity": 1}
        add_result = self.run_test("Add to Cart for Order", "POST", "cart/add", 200, add_data)
        
        if not add_result:
            print("❌ Failed to add item to cart for order test")
            return False
        
        # Create order
        delivery_date = (datetime.now() + timedelta(days=3)).strftime("%Y-%m-%d")
        order_data = {
            "delivery_address": "123 Test Street, Test City",
            "delivery_date": delivery_date,
            "phone": "+33123456789"
        }
        
        create_order = self.run_test("Create Order", "POST", "orders", 200, order_data)
        
        # Get orders
        get_orders = self.run_test("Get User Orders", "GET", "orders", 200)
        
        return all([create_order, get_orders])

    def test_chat_functionality(self):
        """Test AI chat functionality"""
        print("\n💬 Testing AI Chat Functionality...")
        
        if not self.token:
            print("❌ Cannot test chat - no authentication token")
            return False
        
        # Test chat message
        chat_data = {
            "message": "Bonjour, pouvez-vous me recommander une box pour une personne végétarienne?",
            "session_id": None
        }
        
        chat_result = self.run_test("Send Chat Message", "POST", "chat", 200, chat_data)
        
        # Test chat history (if we got a session_id)
        history_result = None
        if chat_result and 'session_id' in chat_result:
            session_id = chat_result['session_id']
            history_result = self.run_test("Get Chat History", "GET", f"chat/history/{session_id}", 200)
        
        return chat_result is not None

    def test_subscription_functionality(self):
        """Test subscription system"""
        print("\n💳 Testing Subscription Functionality...")
        
        # Test get subscription plans (no auth required)
        plans_result = self.run_test("Get Subscription Plans", "GET", "subscriptions/plans", 200)
        
        if not plans_result:
            return False
        
        # Validate plans structure
        expected_plans = ["decouverte", "gourmet", "famille"]
        expected_prices = {"decouverte": 29.00, "gourmet": 49.00, "famille": 89.00}
        
        plan_validation = True
        if len(plans_result) != 3:
            self.log_test("Plans Count Validation", False, f"Expected 3 plans, got {len(plans_result)}")
            plan_validation = False
        
        for plan in plans_result:
            if plan['id'] not in expected_plans:
                self.log_test(f"Plan ID Validation ({plan['id']})", False, f"Unexpected plan ID: {plan['id']}")
                plan_validation = False
            elif plan['price_monthly'] != expected_prices[plan['id']]:
                self.log_test(f"Plan Price Validation ({plan['id']})", False, f"Expected {expected_prices[plan['id']]}€, got {plan['price_monthly']}€")
                plan_validation = False
            else:
                self.log_test(f"Plan Validation ({plan['id']})", True, f"Price: {plan['price_monthly']}€")
        
        # Test quarterly and yearly pricing calculations
        for plan in plans_result:
            monthly = plan['price_monthly']
            quarterly = plan['price_quarterly']
            yearly = plan['price_yearly']
            
            # Quarterly should be -10% (monthly * 3 * 0.9)
            expected_quarterly = round(monthly * 3 * 0.9, 2)
            # Yearly should be -20% (monthly * 12 * 0.8)
            expected_yearly = round(monthly * 12 * 0.8, 2)
            
            if abs(quarterly - expected_quarterly) > 0.01:
                self.log_test(f"Quarterly Price Calculation ({plan['id']})", False, f"Expected {expected_quarterly}€, got {quarterly}€")
                plan_validation = False
            else:
                self.log_test(f"Quarterly Price Calculation ({plan['id']})", True, f"Correct: {quarterly}€")
            
            if abs(yearly - expected_yearly) > 0.01:
                self.log_test(f"Yearly Price Calculation ({plan['id']})", False, f"Expected {expected_yearly}€, got {yearly}€")
                plan_validation = False
            else:
                self.log_test(f"Yearly Price Calculation ({plan['id']})", True, f"Correct: {yearly}€")
        
        if not self.token:
            print("❌ Cannot test subscription creation - no authentication token")
            return plan_validation
        
        # Test get my subscription (should be empty initially)
        my_sub_empty = self.run_test("Get My Subscription (Empty)", "GET", "subscriptions/my", 200)
        
        # Test create subscription
        subscription_data = {
            "plan_id": "decouverte",
            "billing_cycle": "monthly",
            "delivery_address": "123 Test Street, Paris 75001",
            "phone": "+33123456789",
            "preferred_countries": ["gabon", "cameroun"]
        }
        
        create_sub = self.run_test("Create Subscription", "POST", "subscriptions", 200, subscription_data)
        
        if not create_sub:
            return plan_validation
        
        # Test get my subscription (should now exist)
        my_sub_active = self.run_test("Get My Subscription (Active)", "GET", "subscriptions/my", 200)
        
        # Test pause subscription
        pause_sub = self.run_test("Pause Subscription", "PUT", "subscriptions/pause", 200, {})
        
        # Test resume subscription
        resume_sub = self.run_test("Resume Subscription", "PUT", "subscriptions/resume", 200, {})
        
        # Test cancel subscription
        cancel_sub = self.run_test("Cancel Subscription", "DELETE", "subscriptions/cancel", 200)
        
        return all([plan_validation, create_sub, my_sub_active, pause_sub, resume_sub, cancel_sub])

    def test_box_catalog_validation(self):
        """Test specific box catalog requirements"""
        print("\n📋 Testing Box Catalog Validation...")
        
        # Get all boxes
        boxes_result = self.run_test("Get All Boxes for Validation", "GET", "boxes", 200)
        
        if not boxes_result:
            return False
        
        # Check total count (should be 12)
        total_count = len(boxes_result)
        count_validation = self.run_test("Total Box Count", total_count == 12, f"Expected 12 boxes, found {total_count}")
        
        # Check for specific "Box Découverte 5 Pays" at 29€
        decouverte_box = None
        for box in boxes_result:
            if "BOX DÉCOUVERTE — 5 Pays en 1" in box['name'] or "box-decouverte-5-pays" == box['id']:
                decouverte_box = box
                break
        
        decouverte_validation = True
        if decouverte_box:
            if decouverte_box['price'] == 29.00:
                self.log_test("Box Découverte 5 Pays Price", True, f"Correct price: {decouverte_box['price']}€")
            else:
                self.log_test("Box Découverte 5 Pays Price", False, f"Expected 29€, got {decouverte_box['price']}€")
                decouverte_validation = False
            
            if decouverte_box['category'] == "decouverte":
                self.log_test("Box Découverte Category", True, "Correct category: decouverte")
            else:
                self.log_test("Box Découverte Category", False, f"Expected 'decouverte', got '{decouverte_box['category']}'")
                decouverte_validation = False
        else:
            self.log_test("Box Découverte 5 Pays Exists", False, "Box Découverte 5 Pays not found in catalog")
            decouverte_validation = False
        
        return all([count_validation, decouverte_validation])

    def run_all_tests(self):
        """Run all tests in sequence"""
        print("🚀 Starting AfroBox API Tests...")
        print(f"Testing against: {self.base_url}")
        
        # Test basic connectivity
        try:
            response = requests.get(f"{self.base_url}/", timeout=10)
            if response.status_code == 200:
                print("✅ API is accessible")
            else:
                print(f"❌ API returned status {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Cannot connect to API: {e}")
            return False
        
        # Run test suites
        test_suites = [
            ("Data Seeding", self.test_seed_data),
            ("Authentication", self.test_authentication),
            ("Boxes Endpoints", self.test_boxes_endpoints),
            ("Recipes Endpoints", self.test_recipes_endpoints),
            ("Cart Functionality", self.test_cart_functionality),
            ("Orders Functionality", self.test_orders_functionality),
            ("Chat Functionality", self.test_chat_functionality)
        ]
        
        suite_results = []
        for suite_name, test_func in test_suites:
            try:
                result = test_func()
                suite_results.append(result)
            except Exception as e:
                print(f"❌ {suite_name} failed with exception: {e}")
                suite_results.append(False)
        
        # Print summary
        print(f"\n📊 Test Summary:")
        print(f"Tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Success rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        # Return overall success
        return self.tests_passed == self.tests_run

def main():
    tester = AfroBoxAPITester()
    success = tester.run_all_tests()
    
    # Save detailed results
    with open('/app/backend_test_results.json', 'w') as f:
        json.dump({
            'timestamp': datetime.now().isoformat(),
            'total_tests': tester.tests_run,
            'passed_tests': tester.tests_passed,
            'success_rate': (tester.tests_passed/tester.tests_run*100) if tester.tests_run > 0 else 0,
            'results': tester.test_results
        }, f, indent=2)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())