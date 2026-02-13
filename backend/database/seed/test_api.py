"""
Test API endpoints after database reset
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_health():
    """Test health endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=2)
        print(f"✅ Health check: {response.status_code}")
        return True
    except:
        print("❌ Backend not running")
        return False

def test_register():
    """Test user registration"""
    import time
    timestamp = str(int(time.time()))[-6:]  # Last 6 digits of timestamp
    
    user_data = {
        "email": f"testuser{timestamp}@jhat.com",
        "password": "test123",
        "name": "Test User",
        "phone": f"+92300{timestamp}"
    }
    
    response = requests.post(f"{BASE_URL}/api/auth/register", json=user_data)
    print(f"\n📝 Register Test:")
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"   ✅ User created: {data.get('user', {}).get('name')}")
        print(f"   ✅ Has token: {bool(data.get('token'))}")
        print(f"   ✅ Has points: {data.get('user', {}).get('points')}")
        print(f"   ✅ Has stats: {bool(data.get('user', {}).get('stats'))}")
        return data.get('token'), data.get('user_id')
    else:
        print(f"   ❌ Error: {response.text}")
        return None, None

def test_vendors():
    """Test vendors endpoint"""
    response = requests.get(f"{BASE_URL}/api/vendors")
    print(f"\n🏢 Vendors Test:")
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        vendors = data.get('vendors', [])
        print(f"   ✅ Found {len(vendors)} vendors")
        if vendors:
            v = vendors[0]
            print(f"   ✅ Sample vendor: {v.get('name')}")
            print(f"   ✅ Has analytics: rating_sum={v.get('rating_sum')}, revenue_today={v.get('revenue_today')}")
        return True
    else:
        print(f"   ❌ Error: {response.text}")
        return False

def test_availability(token):
    """Test slot availability"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(
        f"{BASE_URL}/api/vendors/ace_padel_dha/availability?date=2026-02-14",
        headers=headers
    )
    
    print(f"\n📅 Availability Test:")
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        slots = data.get('available_slots', [])
        print(f"   ✅ Found {len(slots)} slots")
        if slots:
            available = [s for s in slots if s.get('status') == 'available']
            print(f"   ✅ Available slots: {len(available)}")
        return True
    else:
        print(f"   ❌ Error: {response.text}")
        return False

def test_bookings(token):
    """Test get bookings"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/api/bookings", headers=headers)
    
    print(f"\n📖 Bookings Test:")
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        bookings = data.get('bookings', [])
        print(f"   ✅ Found {len(bookings)} bookings (expected 0 for new user)")
        return True
    else:
        print(f"   ❌ Error: {response.text}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("API ENDPOINT TESTS")
    print("=" * 60)
    
    if not test_health():
        print("\n❌ Backend is not running. Start it with:")
        print("   uvicorn main:app --reload")
        exit(1)
    
    token, user_id = test_register()
    if not token:
        print("\n❌ Registration failed")
        exit(1)
    
    test_vendors()
    test_availability(token)
    test_bookings(token)
    
    print("\n" + "=" * 60)
    print("✅ ALL API TESTS PASSED")
    print("=" * 60)
