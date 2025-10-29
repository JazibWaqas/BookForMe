"""
Populate Firestore Database with Realistic Sample Data for BookForMe
Generates comprehensive vendor data for all categories with availability slots
"""

import asyncio
import sys
import os
import random
from datetime import datetime, timedelta
from typing import Dict, List, Any

# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.firestore import firestore_db
from app.config import settings


class FirestoreDataPopulator:
    """Populates Firestore with realistic sample data for BookForMe"""
    
    def __init__(self):
        self.db = firestore_db.db
        self.vendors_data = []
        self.availability_data = {}
        
    def generate_karachi_locations(self) -> List[str]:
        """Generate realistic Karachi area names"""
        return [
            "Clifton Block 2", "Clifton Block 5", "DHA Phase 2", "DHA Phase 5", "DHA Phase 6",
            "Gulshan-e-Iqbal Block 6", "Gulshan-e-Iqbal Block 9", "PECHS Block 2", "PECHS Block 6",
            "Malir Cantt", "Gadap Town", "Korangi Industrial Area", "North Nazimabad",
            "Federal B Area", "Gulberg", "Johar Town", "Model Town", "Bahadurabad",
            "Hawke's Bay", "Sandspit", "French Beach", "Turtle Beach"
        ]
    
    def generate_phone_numbers(self) -> List[str]:
        """Generate realistic Pakistani phone numbers"""
        prefixes = ["0300", "0301", "0302", "0303", "0304", "0305", "0306", "0307", "0308", "0309",
                   "0310", "0311", "0312", "0313", "0314", "0315", "0316", "0317", "0318", "0319",
                   "0320", "0321", "0322", "0323", "0324", "0325", "0326", "0327", "0328", "0329",
                   "0330", "0331", "0332", "0333", "0334", "0335", "0336", "0337", "0338", "0339"]
        
        numbers = []
        for _ in range(50):
            prefix = random.choice(prefixes)
            number = f"+92{prefix}{random.randint(1000000, 9999999)}"
            numbers.append(number)
        return numbers
    
    def generate_futsal_courts(self) -> List[Dict[str, Any]]:
        """Generate Futsal Court vendors"""
        futsal_names = [
            "Kickoff Futsal Arena", "Total Football Ground", "The Arena Sports", 
            "Rahat Football Ground", "Sixteen Star Futsal", "Urban Soccer Club",
            "Goal Masters Futsal", "Champion Sports Complex", "Elite Football Ground",
            "Pro Sports Arena", "Victory Futsal", "Golden Boot Sports"
        ]
        
        locations = self.generate_karachi_locations()
        phones = self.generate_phone_numbers()
        
        futsal_courts = []
        for i, name in enumerate(futsal_names):
            location = random.choice(locations)
            phone = phones[i % len(phones)]
            
            vendor = {
                'name': name,
                'category': 'Futsal Court',
                'service_type': 'futsal',
                'location_area': location,
                'address': f"{location}, Karachi, Pakistan",
                'phone': phone,
                'email': f"{name.lower().replace(' ', '')}@bookforme.pk",
                'whatsapp_connected': True,
                'whatsapp_phone': phone,
                'sheets_connected': random.choice([True, False]),
                'description': f"Premium futsal court in {location} with professional-grade artificial turf, floodlights, and modern facilities. Perfect for competitive matches and recreational play.",
                'amenities': random.sample([
                    "Floodlights", "Washroom", "Parking", "Changing Room", "Water Cooler", 
                    "First Aid", "Security", "Refreshments", "Air Conditioning", "Sound System"
                ], random.randint(4, 7)),
                'court_type': 'Futsal',
                'price_per_hour': random.randint(3000, 6000),
                'capacity': random.choice([10, 12, 14, 16, 20]),
                'rating': round(random.uniform(4.0, 5.0), 1),
                'review_count': random.randint(50, 300),
                'price_range': f"PKR {random.randint(3000, 4000)}-{random.randint(5000, 6000)}/hr",
                'operating_hours': {
                    'monday': {'open': '06:00', 'close': '23:00'},
                    'tuesday': {'open': '06:00', 'close': '23:00'},
                    'wednesday': {'open': '06:00', 'close': '23:00'},
                    'thursday': {'open': '06:00', 'close': '23:00'},
                    'friday': {'open': '06:00', 'close': '23:00'},
                    'saturday': {'open': '06:00', 'close': '23:00'},
                    'sunday': {'open': '06:00', 'close': '23:00'}
                },
                'images': [
                    f"https://images.unsplash.com/photo-{random.randint(1500000000000, 1600000000000)}?w=800",
                    f"https://images.unsplash.com/photo-{random.randint(1500000000000, 1600000000000)}?w=800"
                ],
                'created_at': datetime.now()
            }
            futsal_courts.append(vendor)
        
        return futsal_courts
    
    def generate_padel_courts(self) -> List[Dict[str, Any]]:
        """Generate Padel Court vendors"""
        padel_names = [
            "Padel House PK", "Ace Padel Club", "The Padel Club KHI", 
            "Padel Yard Karachi", "Elite Padel Center", "Pro Padel Arena",
            "Champion Padel Club", "Golden Padel Court", "Premium Padel Zone",
            "Royal Padel Center", "Victory Padel Club", "Master Padel Court"
        ]
        
        locations = self.generate_karachi_locations()
        phones = self.generate_phone_numbers()
        
        padel_courts = []
        for i, name in enumerate(padel_names):
            location = random.choice(locations)
            phone = phones[(i + 12) % len(phones)]
            
            vendor = {
                'name': name,
                'category': 'Padel Court',
                'service_type': 'padel',
                'location_area': location,
                'address': f"{location}, Karachi, Pakistan",
                'phone': phone,
                'email': f"{name.lower().replace(' ', '')}@bookforme.pk",
                'whatsapp_connected': True,
                'whatsapp_phone': phone,
                'sheets_connected': random.choice([True, False]),
                'description': f"State-of-the-art padel court in {location} featuring professional-grade courts, modern facilities, and expert coaching available.",
                'amenities': random.sample([
                    "Air Conditioning", "Floodlights", "Washroom", "Parking", "Changing Room", 
                    "Water Cooler", "First Aid", "Security", "Refreshments", "Sound System",
                    "Padel Equipment Rental", "Professional Coaching"
                ], random.randint(5, 8)),
                'court_type': 'Padel',
                'price_per_hour': random.randint(4000, 8000),
                'capacity': random.choice([4, 6, 8]),
                'rating': round(random.uniform(4.2, 5.0), 1),
                'review_count': random.randint(30, 200),
                'price_range': f"PKR {random.randint(4000, 5000)}-{random.randint(7000, 8000)}/hr",
                'operating_hours': {
                    'monday': {'open': '07:00', 'close': '22:00'},
                    'tuesday': {'open': '07:00', 'close': '22:00'},
                    'wednesday': {'open': '07:00', 'close': '22:00'},
                    'thursday': {'open': '07:00', 'close': '22:00'},
                    'friday': {'open': '07:00', 'close': '22:00'},
                    'saturday': {'open': '07:00', 'close': '22:00'},
                    'sunday': {'open': '07:00', 'close': '22:00'}
                },
                'images': [
                    f"https://images.unsplash.com/photo-{random.randint(1500000000000, 1600000000000)}?w=800",
                    f"https://images.unsplash.com/photo-{random.randint(1500000000000, 1600000000000)}?w=800"
                ],
                'created_at': datetime.now()
            }
            padel_courts.append(vendor)
        
        return padel_courts
    
    def generate_beach_huts(self) -> List[Dict[str, Any]]:
        """Generate Beach Hut vendors"""
        beach_names = [
            "The Beach House", "Sadequain Hut", "Sandy Beach Huts", "Ammar's Beach Hut",
            "Al-Siraj Beach Hills", "Turtle Beach Huts", "French Beach House", 
            "Paradise Beach Hut", "Ocean View Hut", "Sunset Beach House",
            "Coral Beach Hut", "Seaside Retreat", "Beach Villa", "Coastal Haven"
        ]
        
        beach_locations = ["Hawke's Bay", "Sandspit", "Turtle Beach", "French Beach", "Paradise Point"]
        phones = self.generate_phone_numbers()
        
        beach_huts = []
        for i, name in enumerate(beach_names):
            beach = random.choice(beach_locations)
            phone = phones[(i + 24) % len(phones)]
            
            vendor = {
                'name': name,
                'category': 'Beach Hut',
                'service_type': 'beach_hut',
                'location_area': beach,
                'address': f"{beach}, Karachi, Pakistan",
                'phone': phone,
                'email': f"{name.lower().replace(' ', '').replace("'", '')}@bookforme.pk",
                'whatsapp_connected': True,
                'whatsapp_phone': phone,
                'sheets_connected': random.choice([True, False]),
                'description': f"Beautiful beach hut at {beach} with stunning ocean views, modern amenities, and perfect for family gatherings and events.",
                'beach_name': beach,
                'capacity': random.choice([25, 30, 40, 50, 60, 75, 100]),
                'price_per_day': random.randint(15000, 50000),
                'amenities': random.sample([
                    "Swimming Pool", "Generator", "Indoor Games", "Kitchen", "Bedrooms",
                    "Washroom", "Parking", "BBQ Area", "Sound System", "Air Conditioning",
                    "Beach Access", "Security", "Refreshments", "First Aid"
                ], random.randint(6, 10)),
                'rating': round(random.uniform(4.0, 5.0), 1),
                'review_count': random.randint(20, 150),
                'price_range': f"PKR {random.randint(15000, 20000)}-{random.randint(40000, 50000)}/day",
                'operating_hours': {
                    'monday': {'open': '06:00', 'close': '23:00'},
                    'tuesday': {'open': '06:00', 'close': '23:00'},
                    'wednesday': {'open': '06:00', 'close': '23:00'},
                    'thursday': {'open': '06:00', 'close': '23:00'},
                    'friday': {'open': '06:00', 'close': '23:00'},
                    'saturday': {'open': '06:00', 'close': '23:00'},
                    'sunday': {'open': '06:00', 'close': '23:00'}
                },
                'images': [
                    f"https://images.unsplash.com/photo-{random.randint(1500000000000, 1600000000000)}?w=800",
                    f"https://images.unsplash.com/photo-{random.randint(1500000000000, 1600000000000)}?w=800"
                ],
                'created_at': datetime.now()
            }
            beach_huts.append(vendor)
        
        return beach_huts
    
    def generate_farmhouses(self) -> List[Dict[str, Any]]:
        """Generate Farmhouse vendors"""
        farmhouse_names = [
            "Arabian Farmhouse", "Al-Syed Farm House", "Oasis Farmhouse Karachi", 
            "Palm Village Farm House", "Memon Farmhouse", "Green Valley Farmhouse",
            "Royal Farmhouse", "Paradise Farmhouse", "Golden Acres Farmhouse",
            "Sunset Farmhouse", "Meadow View Farmhouse", "Countryside Farmhouse",
            "Riverside Farmhouse", "Hilltop Farmhouse", "Garden Farmhouse"
        ]
        
        farmhouse_locations = ["Malir Cantt", "Gadap Town", "Super Highway", "Korangi", "Landhi"]
        phones = self.generate_phone_numbers()
        
        farmhouses = []
        for i, name in enumerate(farmhouse_names):
            location = random.choice(farmhouse_locations)
            phone = phones[(i + 36) % len(phones)]
            
            vendor = {
                'name': name,
                'category': 'Farmhouse',
                'service_type': 'farmhouse',
                'location_area': location,
                'address': f"{location}, Karachi, Pakistan",
                'phone': phone,
                'email': f"{name.lower().replace(' ', '')}@bookforme.pk",
                'whatsapp_connected': True,
                'whatsapp_phone': phone,
                'sheets_connected': random.choice([True, False]),
                'description': f"Spacious farmhouse in {location} perfect for weddings, corporate events, and family gatherings with beautiful outdoor spaces and modern facilities.",
                'capacity': random.choice([50, 75, 100, 150, 200, 250, 300]),
                'price_per_day_night': {
                    'day': random.randint(20000, 40000),
                    'night': random.randint(30000, 50000),
                    'full': random.randint(45000, 70000)
                },
                'amenities': random.sample([
                    "Swimming Pool", "Cricket Ground", "BBQ Area", "Air Conditioned Rooms", 
                    "Generator", "Washroom", "Parking", "Sound System", "Lighting",
                    "Kitchen", "Dining Hall", "Garden", "Security", "First Aid",
                    "Indoor Games", "Outdoor Games", "Photography Spots"
                ], random.randint(8, 12)),
                'rating': round(random.uniform(4.0, 5.0), 1),
                'review_count': random.randint(30, 200),
                'price_range': f"PKR {random.randint(20000, 25000)}-{random.randint(60000, 70000)}/day",
                'operating_hours': {
                    'monday': {'open': '06:00', 'close': '23:00'},
                    'tuesday': {'open': '06:00', 'close': '23:00'},
                    'wednesday': {'open': '06:00', 'close': '23:00'},
                    'thursday': {'open': '06:00', 'close': '23:00'},
                    'friday': {'open': '06:00', 'close': '23:00'},
                    'saturday': {'open': '06:00', 'close': '23:00'},
                    'sunday': {'open': '06:00', 'close': '23:00'}
                },
                'images': [
                    f"https://images.unsplash.com/photo-{random.randint(1500000000000, 1600000000000)}?w=800",
                    f"https://images.unsplash.com/photo-{random.randint(1500000000000, 1600000000000)}?w=800"
                ],
                'created_at': datetime.now()
            }
            farmhouses.append(vendor)
        
        return farmhouses
    
    def generate_salons(self) -> List[Dict[str, Any]]:
        """Generate Salon vendors"""
        salon_names = [
            "Toni&Guy Karachi", "Pengs Salon", "Sabs Beauty Studio", "NABILA Salon",
            "The Men's Salon by Eddie", "Pivot Point Salon", "Glam Studio",
            "Elite Beauty Lounge", "Royal Salon", "Chic Hair Studio",
            "Beauty Haven", "Style Studio", "Glamour Salon", "Trendy Cuts",
            "Luxury Beauty", "Fashion Forward Salon", "Bella Vista Salon"
        ]
        
        locations = self.generate_karachi_locations()
        phones = self.generate_phone_numbers()
        
        salon_types = ["Unisex", "Men", "Women"]
        services = [
            {"name": "Haircut", "price": random.randint(800, 2000), "duration_minutes": 45},
            {"name": "Hair Color", "price": random.randint(3000, 8000), "duration_minutes": 120},
            {"name": "Hair Treatment", "price": random.randint(2000, 5000), "duration_minutes": 90},
            {"name": "Facial", "price": random.randint(1500, 4000), "duration_minutes": 60},
            {"name": "Manicure", "price": random.randint(1000, 2500), "duration_minutes": 45},
            {"name": "Pedicure", "price": random.randint(1200, 3000), "duration_minutes": 60},
            {"name": "Bridal Package", "price": random.randint(15000, 35000), "duration_minutes": 300},
            {"name": "Beard Trim", "price": random.randint(500, 1500), "duration_minutes": 30},
            {"name": "Hair Wash & Blow Dry", "price": random.randint(800, 2000), "duration_minutes": 45}
        ]
        
        salons = []
        for i, name in enumerate(salon_names):
            location = random.choice(locations)
            phone = phones[(i + 48) % len(phones)]
            salon_type = random.choice(salon_types)
            
            vendor = {
                'name': name,
                'category': 'Salon',
                'service_type': 'salon',
                'location_area': location,
                'address': f"{location}, Karachi, Pakistan",
                'phone': phone,
                'email': f"{name.lower().replace(' ', '').replace('&', 'and')}@bookforme.pk",
                'whatsapp_connected': True,
                'whatsapp_phone': phone,
                'sheets_connected': random.choice([True, False]),
                'description': f"Professional {salon_type.lower()} salon in {location} offering premium beauty and grooming services with experienced stylists and modern equipment.",
                'type': salon_type,
                'services': random.sample(services, random.randint(5, 8)),
                'amenities': random.sample([
                    "Air Conditioning", "WiFi", "Parking", "Washroom", "Refreshments",
                    "Magazines", "Music", "Professional Equipment", "Sanitized Tools",
                    "Comfortable Seating", "Mirror Stations", "Hair Washing Station"
                ], random.randint(6, 9)),
                'rating': round(random.uniform(4.0, 5.0), 1),
                'review_count': random.randint(40, 300),
                'price_range': f"PKR {random.randint(500, 1000)}-{random.randint(30000, 35000)}",
                'operating_hours': {
                    'monday': {'open': '09:00', 'close': '21:00'},
                    'tuesday': {'open': '09:00', 'close': '21:00'},
                    'wednesday': {'open': '09:00', 'close': '21:00'},
                    'thursday': {'open': '09:00', 'close': '21:00'},
                    'friday': {'open': '09:00', 'close': '21:00'},
                    'saturday': {'open': '09:00', 'close': '21:00'},
                    'sunday': {'open': '10:00', 'close': '20:00'}
                },
                'images': [
                    f"https://images.unsplash.com/photo-{random.randint(1500000000000, 1600000000000)}?w=800",
                    f"https://images.unsplash.com/photo-{random.randint(1500000000000, 1600000000000)}?w=800"
                ],
                'created_at': datetime.now()
            }
            salons.append(vendor)
        
        return salons
    
    def generate_gaming_zones(self) -> List[Dict[str, Any]]:
        """Generate Gaming Zone vendors"""
        gaming_names = [
            "Arena Gaming Cafe", "Game Over Karachi", "Gamers Hideout", 
            "Millennium Gaming Hub", "VR Zone Karachi", "Cyber Gaming Center",
            "Elite Gaming Lounge", "Pro Gaming Arena", "Champion Gaming Zone",
            "Digital Gaming Hub", "Next Level Gaming", "Ultimate Gaming Center",
            "Gaming Paradise", "Pixel Gaming Lounge", "Retro Gaming Zone"
        ]
        
        locations = self.generate_karachi_locations()
        phones = self.generate_phone_numbers()
        
        consoles = ["PS5", "Xbox Series X", "PC", "VR", "Nintendo Switch", "PS4", "Xbox One"]
        games = [
            "FIFA 24", "Call of Duty", "Tekken 8", "Fortnite", "PUBG", "Valorant",
            "CS:GO", "GTA V", "Minecraft", "Among Us", "Rocket League", "Apex Legends",
            "Overwatch 2", "Dota 2", "League of Legends", "Street Fighter 6"
        ]
        
        gaming_zones = []
        for i, name in enumerate(gaming_names):
            location = random.choice(locations)
            phone = phones[(i + 60) % len(phones)]
            
            vendor = {
                'name': name,
                'category': 'Gaming Zone',
                'service_type': 'gaming_zone',
                'location_area': location,
                'address': f"{location}, Karachi, Pakistan",
                'phone': phone,
                'email': f"{name.lower().replace(' ', '')}@bookforme.pk",
                'whatsapp_connected': True,
                'whatsapp_phone': phone,
                'sheets_connected': random.choice([True, False]),
                'description': f"Ultimate gaming destination in {location} featuring latest consoles, high-end PCs, VR equipment, and a wide selection of popular games.",
                'consoles': random.sample(consoles, random.randint(4, 6)),
                'price_per_hour': {
                    'ps5': random.randint(500, 1000),
                    'xbox_series_x': random.randint(500, 1000),
                    'pc': random.randint(400, 800),
                    'vr': random.randint(800, 1500),
                    'nintendo_switch': random.randint(300, 600),
                    'ps4': random.randint(300, 600),
                    'xbox_one': random.randint(300, 600)
                },
                'games_available': random.sample(games, random.randint(8, 12)),
                'amenities': random.sample([
                    "High-Speed Internet", "Air Conditioning", "Comfortable Gaming Chairs", 
                    "Gaming Headsets", "Energy Drinks", "Snacks", "Parking", "WiFi",
                    "Tournament Area", "Streaming Setup", "Gaming Controllers", "VR Equipment"
                ], random.randint(6, 10)),
                'rating': round(random.uniform(4.0, 5.0), 1),
                'review_count': random.randint(30, 250),
                'price_range': f"PKR {random.randint(300, 500)}-{random.randint(1000, 1500)}/hr",
                'operating_hours': {
                    'monday': {'open': '12:00', 'close': '02:00'},
                    'tuesday': {'open': '12:00', 'close': '02:00'},
                    'wednesday': {'open': '12:00', 'close': '02:00'},
                    'thursday': {'open': '12:00', 'close': '02:00'},
                    'friday': {'open': '12:00', 'close': '03:00'},
                    'saturday': {'open': '10:00', 'close': '03:00'},
                    'sunday': {'open': '10:00', 'close': '02:00'}
                },
                'images': [
                    f"https://images.unsplash.com/photo-{random.randint(1500000000000, 1600000000000)}?w=800",
                    f"https://images.unsplash.com/photo-{random.randint(1500000000000, 1600000000000)}?w=800"
                ],
                'created_at': datetime.now()
            }
            gaming_zones.append(vendor)
        
        return gaming_zones
    
    def generate_availability_slots(self, vendor: Dict[str, Any], days: int = 7) -> Dict[str, Any]:
        """Generate availability slots for a vendor"""
        availability = {}
        
        # Define time slots based on service type
        if vendor['service_type'] == 'futsal':
            time_slots = [
                {'time': '09:00', 'price': vendor['price_per_hour'] * 0.8},
                {'time': '10:00', 'price': vendor['price_per_hour'] * 0.8},
                {'time': '11:00', 'price': vendor['price_per_hour'] * 0.8},
                {'time': '14:00', 'price': vendor['price_per_hour'] * 0.9},
                {'time': '15:00', 'price': vendor['price_per_hour'] * 0.9},
                {'time': '16:00', 'price': vendor['price_per_hour'] * 0.9},
                {'time': '17:00', 'price': vendor['price_per_hour']},
                {'time': '18:00', 'price': vendor['price_per_hour']},
                {'time': '19:00', 'price': vendor['price_per_hour']},
                {'time': '20:00', 'price': vendor['price_per_hour'] * 0.9},
                {'time': '21:00', 'price': vendor['price_per_hour'] * 0.8},
            ]
        elif vendor['service_type'] == 'padel':
            time_slots = [
                {'time': '07:00', 'price': vendor['price_per_hour'] * 0.8},
                {'time': '08:00', 'price': vendor['price_per_hour'] * 0.8},
                {'time': '09:00', 'price': vendor['price_per_hour'] * 0.9},
                {'time': '10:00', 'price': vendor['price_per_hour'] * 0.9},
                {'time': '11:00', 'price': vendor['price_per_hour'] * 0.9},
                {'time': '14:00', 'price': vendor['price_per_hour']},
                {'time': '15:00', 'price': vendor['price_per_hour']},
                {'time': '16:00', 'price': vendor['price_per_hour']},
                {'time': '17:00', 'price': vendor['price_per_hour']},
                {'time': '18:00', 'price': vendor['price_per_hour']},
                {'time': '19:00', 'price': vendor['price_per_hour'] * 0.9},
                {'time': '20:00', 'price': vendor['price_per_hour'] * 0.8},
            ]
        elif vendor['service_type'] == 'beach_hut':
            time_slots = [
                {'time': '06:00', 'price': vendor['price_per_day']},
                {'time': '08:00', 'price': vendor['price_per_day']},
                {'time': '10:00', 'price': vendor['price_per_day']},
                {'time': '12:00', 'price': vendor['price_per_day']},
                {'time': '14:00', 'price': vendor['price_per_day']},
                {'time': '16:00', 'price': vendor['price_per_day']},
            ]
        elif vendor['service_type'] == 'farmhouse':
            time_slots = [
                {'time': '06:00', 'price': vendor['price_per_day_night']['day']},
                {'time': '08:00', 'price': vendor['price_per_day_night']['day']},
                {'time': '10:00', 'price': vendor['price_per_day_night']['day']},
                {'time': '12:00', 'price': vendor['price_per_day_night']['day']},
                {'time': '14:00', 'price': vendor['price_per_day_night']['day']},
                {'time': '16:00', 'price': vendor['price_per_day_night']['day']},
                {'time': '18:00', 'price': vendor['price_per_day_night']['night']},
                {'time': '20:00', 'price': vendor['price_per_day_night']['night']},
            ]
        elif vendor['service_type'] == 'salon':
            time_slots = [
                {'time': '09:00', 'price': 0},  # Price varies by service
                {'time': '10:00', 'price': 0},
                {'time': '11:00', 'price': 0},
                {'time': '12:00', 'price': 0},
                {'time': '14:00', 'price': 0},
                {'time': '15:00', 'price': 0},
                {'time': '16:00', 'price': 0},
                {'time': '17:00', 'price': 0},
                {'time': '18:00', 'price': 0},
                {'time': '19:00', 'price': 0},
                {'time': '20:00', 'price': 0},
            ]
        else:  # gaming_zone
            time_slots = [
                {'time': '12:00', 'price': 0},  # Price varies by console
                {'time': '13:00', 'price': 0},
                {'time': '14:00', 'price': 0},
                {'time': '15:00', 'price': 0},
                {'time': '16:00', 'price': 0},
                {'time': '17:00', 'price': 0},
                {'time': '18:00', 'price': 0},
                {'time': '19:00', 'price': 0},
                {'time': '20:00', 'price': 0},
                {'time': '21:00', 'price': 0},
                {'time': '22:00', 'price': 0},
                {'time': '23:00', 'price': 0},
            ]
        
        # Generate availability for the next 7 days
        for day_offset in range(days):
            date = (datetime.now() + timedelta(days=day_offset)).strftime('%Y-%m-%d')
            
            if vendor['service_type'] in ['beach_hut', 'farmhouse']:
                # For beach huts and farmhouses, availability is per day
                availability[date] = {
                    'status': 'available' if random.random() > 0.3 else 'booked'
                }
            else:
                # For courts, salons, and gaming zones, availability is per time slot
                day_slots = {}
                for slot in time_slots:
                    # 30-50% chance of being booked
                    status = 'booked' if random.random() < random.uniform(0.3, 0.5) else 'available'
                    day_slots[slot['time']] = {
                        'status': status,
                        'price': slot['price']
                    }
                availability[date] = day_slots
        
        return availability
    
    async def populate_database(self):
        """Populate Firestore with all vendor data"""
        print("🚀 Starting Firestore population...")
        
        try:
            # Generate all vendor data
            print("📊 Generating vendor data...")
            all_vendors = []
            all_vendors.extend(self.generate_futsal_courts())
            all_vendors.extend(self.generate_padel_courts())
            all_vendors.extend(self.generate_beach_huts())
            all_vendors.extend(self.generate_farmhouses())
            all_vendors.extend(self.generate_salons())
            all_vendors.extend(self.generate_gaming_zones())
            
            print(f"✅ Generated {len(all_vendors)} vendors")
            
            # Add vendors to Firestore
            print("💾 Adding vendors to Firestore...")
            vendor_ids = []
            
            for i, vendor_data in enumerate(all_vendors):
                try:
                    # Add vendor document
                    doc_ref = self.db.collection('vendors').document()
                    vendor_id = doc_ref.id
                    vendor_data['id'] = vendor_id
                    doc_ref.set(vendor_data)
                    vendor_ids.append(vendor_id)
                    
                    print(f"  ✓ Added {vendor_data['name']} ({vendor_data['category']})")
                    
                    # Generate and add availability slots
                    availability = self.generate_availability_slots(vendor_data)
                    
                    # Add availability subcollection
                    for date, slots in availability.items():
                        availability_ref = self.db.collection('vendors').document(vendor_id).collection('availability').document(date)
                        availability_ref.set(slots)
                    
                    # Also add to availability_slots collection for easy querying
                    await self.create_availability_slots(vendor_id, vendor_data)
                    
                except Exception as e:
                    print(f"  ❌ Error adding {vendor_data['name']}: {e}")
                    continue
            
            print(f"\n🎉 Successfully populated Firestore!")
            print(f"📈 Statistics:")
            print(f"   • Total vendors: {len(vendor_ids)}")
            print(f"   • Futsal Courts: {len([v for v in all_vendors if v['category'] == 'Futsal Court'])}")
            print(f"   • Padel Courts: {len([v for v in all_vendors if v['category'] == 'Padel Court'])}")
            print(f"   • Beach Huts: {len([v for v in all_vendors if v['category'] == 'Beach Hut'])}")
            print(f"   • Farmhouses: {len([v for v in all_vendors if v['category'] == 'Farmhouse'])}")
            print(f"   • Salons: {len([v for v in all_vendors if v['category'] == 'Salon'])}")
            print(f"   • Gaming Zones: {len([v for v in all_vendors if v['category'] == 'Gaming Zone'])}")
            print(f"   • Availability data: 7 days for each vendor")
            
            return True
            
        except Exception as e:
            print(f"❌ Error populating database: {e}")
            return False
    
    async def create_availability_slots(self, vendor_id: str, vendor_data: Dict[str, Any]):
        """Create availability slots in the availability_slots collection"""
        try:
            # Define time slots based on service type
            if vendor_data['service_type'] == 'futsal':
                time_slots = [
                    {'time': '09:00', 'price': vendor_data['price_per_hour'] * 0.8},
                    {'time': '10:00', 'price': vendor_data['price_per_hour'] * 0.8},
                    {'time': '11:00', 'price': vendor_data['price_per_hour'] * 0.8},
                    {'time': '14:00', 'price': vendor_data['price_per_hour'] * 0.9},
                    {'time': '15:00', 'price': vendor_data['price_per_hour'] * 0.9},
                    {'time': '16:00', 'price': vendor_data['price_per_hour'] * 0.9},
                    {'time': '17:00', 'price': vendor_data['price_per_hour']},
                    {'time': '18:00', 'price': vendor_data['price_per_hour']},
                    {'time': '19:00', 'price': vendor_data['price_per_hour']},
                    {'time': '20:00', 'price': vendor_data['price_per_hour'] * 0.9},
                    {'time': '21:00', 'price': vendor_data['price_per_hour'] * 0.8},
                ]
            elif vendor_data['service_type'] == 'padel':
                time_slots = [
                    {'time': '07:00', 'price': vendor_data['price_per_hour'] * 0.8},
                    {'time': '08:00', 'price': vendor_data['price_per_hour'] * 0.8},
                    {'time': '09:00', 'price': vendor_data['price_per_hour'] * 0.9},
                    {'time': '10:00', 'price': vendor_data['price_per_hour'] * 0.9},
                    {'time': '11:00', 'price': vendor_data['price_per_hour'] * 0.9},
                    {'time': '14:00', 'price': vendor_data['price_per_hour']},
                    {'time': '15:00', 'price': vendor_data['price_per_hour']},
                    {'time': '16:00', 'price': vendor_data['price_per_hour']},
                    {'time': '17:00', 'price': vendor_data['price_per_hour']},
                    {'time': '18:00', 'price': vendor_data['price_per_hour']},
                    {'time': '19:00', 'price': vendor_data['price_per_hour'] * 0.9},
                    {'time': '20:00', 'price': vendor_data['price_per_hour'] * 0.8},
                ]
            elif vendor_data['service_type'] == 'salon':
                time_slots = [
                    {'time': '09:00', 'price': 0},
                    {'time': '10:00', 'price': 0},
                    {'time': '11:00', 'price': 0},
                    {'time': '12:00', 'price': 0},
                    {'time': '14:00', 'price': 0},
                    {'time': '15:00', 'price': 0},
                    {'time': '16:00', 'price': 0},
                    {'time': '17:00', 'price': 0},
                    {'time': '18:00', 'price': 0},
                    {'time': '19:00', 'price': 0},
                    {'time': '20:00', 'price': 0},
                ]
            elif vendor_data['service_type'] == 'gaming_zone':
                time_slots = [
                    {'time': '12:00', 'price': 0},
                    {'time': '13:00', 'price': 0},
                    {'time': '14:00', 'price': 0},
                    {'time': '15:00', 'price': 0},
                    {'time': '16:00', 'price': 0},
                    {'time': '17:00', 'price': 0},
                    {'time': '18:00', 'price': 0},
                    {'time': '19:00', 'price': 0},
                    {'time': '20:00', 'price': 0},
                    {'time': '21:00', 'price': 0},
                    {'time': '22:00', 'price': 0},
                    {'time': '23:00', 'price': 0},
                ]
            else:  # beach_hut, farmhouse
                time_slots = [
                    {'time': '06:00', 'price': vendor_data.get('price_per_day', vendor_data.get('price_per_day_night', {}).get('day', 0))},
                    {'time': '08:00', 'price': vendor_data.get('price_per_day', vendor_data.get('price_per_day_night', {}).get('day', 0))},
                    {'time': '10:00', 'price': vendor_data.get('price_per_day', vendor_data.get('price_per_day_night', {}).get('day', 0))},
                    {'time': '12:00', 'price': vendor_data.get('price_per_day', vendor_data.get('price_per_day_night', {}).get('day', 0))},
                    {'time': '14:00', 'price': vendor_data.get('price_per_day', vendor_data.get('price_per_day_night', {}).get('day', 0))},
                    {'time': '16:00', 'price': vendor_data.get('price_per_day', vendor_data.get('price_per_day_night', {}).get('day', 0))},
                ]
            
            # Create slots for the next 7 days
            for day_offset in range(7):
                date = (datetime.now() + timedelta(days=day_offset)).strftime('%Y-%m-%d')
                
                for slot_data in time_slots:
                    slot_doc = {
                        'vendor_id': vendor_id,
                        'slot_date': date,
                        'slot_time': slot_data['time'],
                        'price': slot_data['price'],
                        'status': 'available' if random.random() > 0.3 else 'booked',
                        'created_at': datetime.now()
                    }
                    
                    self.db.collection('availability_slots').add(slot_doc)
                    
        except Exception as e:
            print(f"Error creating availability slots for {vendor_id}: {e}")


async def main():
    """Main function to run the population script"""
    print("🎯 BookForMe Firestore Data Population")
    print("=" * 50)
    
    try:
        # Test Firestore connection
        print("🔌 Testing Firestore connection...")
        vendors = firestore_db.db.collection('vendors').limit(1).stream()
        vendor_list = list(vendors)
        print("✅ Firestore connection successful!")
        
        # Initialize populator
        populator = FirestoreDataPopulator()
        
        # Populate database
        success = await populator.populate_database()
        
        if success:
            print("\n🎉 Database population completed successfully!")
            print("\n📋 Next steps:")
            print("1. Test your WhatsApp bot with the new data")
            print("2. Check the frontend to see vendors")
            print("3. Try booking different types of venues")
            print("4. Test the AI agent functionality")
        else:
            print("\n❌ Database population failed!")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        print("\n🔧 Setup instructions:")
        print("1. Ensure Firestore credentials are properly configured")
        print("2. Check FIRESTORE_PROJECT_ID in your .env file")
        print("3. Verify your Google Cloud project has Firestore enabled")


if __name__ == "__main__":
    asyncio.run(main())
