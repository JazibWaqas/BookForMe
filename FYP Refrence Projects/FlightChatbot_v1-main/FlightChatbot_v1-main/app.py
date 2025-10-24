import os
import re
import json
import requests
from flask import Flask, request, jsonify
from twilio.twiml.messaging_response import MessagingResponse
from twilio.rest import Client
from datetime import datetime, timedelta
import logging
from geopy.distance import geodesic
from geopy.geocoders import Nominatim
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Twilio Configuration
TWILIO_ACCOUNT_SID = os.getenv('TWILIO_ACCOUNT_SID')
TWILIO_AUTH_TOKEN = os.getenv('TWILIO_AUTH_TOKEN')
TWILIO_PHONE_NUMBER = os.getenv('TWILIO_PHONE_NUMBER')

# Aviation Stack API Configuration
AVIATION_STACK_API_KEY = os.getenv('AVIATION_STACK_API_KEY')
AVIATION_STACK_BASE_URL = 'http://api.aviationstack.com/v1'

# Hugging Face API Configuration
HUGGINGFACE_API_KEY = os.getenv('HUGGINGFACE_API_KEY')  # Optional, can work without token with rate limits
HUGGINGFACE_API_URL = "https://api-inference.huggingface.co/models/microsoft/DialoGPT-large"

# Initialize Twilio client (will be done after validation)
twilio_client = None

# Initialize geocoder
geolocator = Nominatim(user_agent="flight_booking_bot")

# In-memory storage for user sessions (use database in production)
user_sessions = {}

# Airport codes mapping (simplified - in production, use comprehensive database)
AIRPORT_CODES = {
    # North America
    'new york': 'JFK',
    'nyc': 'JFK',
    'los angeles': 'LAX',
    'la': 'LAX',
    'chicago': 'ORD',
    'miami': 'MIA',
    'houston': 'IAH',
    'dallas': 'DFW',
    'phoenix': 'PHX',
    'philadelphia': 'PHL',
    'atlanta': 'ATL',
    'boston': 'BOS',
    'san francisco': 'SFO',
    'denver': 'DEN',
    'seattle': 'SEA',
    'las vegas': 'LAS',
    'orlando': 'MCO',
    'washington dc': 'IAD',
    'toronto': 'YYZ',
    'montreal': 'YUL',
    'vancouver': 'YVR',
    'calgary': 'YYC',
    'edmonton': 'YEG',
    'ottawa': 'YOW',
    'winnipeg': 'YWG',
    'halifax': 'YHZ',
    'quebec': 'YQB',
    'mexico city': 'MEX',
    'cancun': 'CUN',
    'guadalajara': 'GDL',
    'monterrey': 'MTY',
    
    # Europe
    'london': 'LHR',
    'paris': 'CDG',
    'frankfurt': 'FRA',
    'amsterdam': 'AMS',
    'madrid': 'MAD',
    'barcelona': 'BCN',
    'rome': 'FCO',
    'milan': 'MXP',
    'venice': 'VCE',
    'berlin': 'BER',
    'munich': 'MUC',
    'hamburg': 'HAM',
    'zurich': 'ZRH',
    'geneva': 'GVA',
    'vienna': 'VIE',
    'brussels': 'BRU',
    'oslo': 'OSL',
    'stockholm': 'ARN',
    'copenhagen': 'CPH',
    'helsinki': 'HEL',
    'dublin': 'DUB',
    'lisbon': 'LIS',
    'porto': 'OPO',
    'athens': 'ATH',
    'prague': 'PRG',
    'budapest': 'BUD',
    'warsaw': 'WAW',
    'bucharest': 'OTP',
    'sofia': 'SOF',
    'zagreb': 'ZAG',
    
    # Asia
    'tokyo': 'HND',
    'osaka': 'KIX',
    'nagoya': 'NGO',
    'fukuoka': 'FUK',
    'sapporo': 'CTS',
    'seoul': 'ICN',
    'busan': 'PUS',
    'beijing': 'PEK',
    'shanghai': 'PVG',
    'guangzhou': 'CAN',
    'shenzhen': 'SZX',
    'hong kong': 'HKG',
    'macau': 'MFM',
    'taipei': 'TPE',
    'singapore': 'SIN',
    'kuala lumpur': 'KUL',
    'jakarta': 'CGK',
    'bangkok': 'BKK',
    'phuket': 'HKT',
    'chiang mai': 'CNX',
    'manila': 'MNL',
    'cebu': 'CEB',
    'ho chi minh': 'SGN',
    'hanoi': 'HAN',
    'da nang': 'DAD',
    'phnom penh': 'PNH',
    'vientiane': 'VTE',
    'yangon': 'RGN',
    'dhaka': 'DAC',
    'kathmandu': 'KTM',
    'colombo': 'CMB',
    'mumbai': 'BOM',
    'delhi': 'DEL',
    'bangalore': 'BLR',
    'chennai': 'MAA',
    'hyderabad': 'HYD',
    'kolkata': 'CCU',
    
        # Pakistan
    'islamabad': 'ISB',
    'karachi': 'KHI',
    'lahore': 'LHE',
    'peshawar': 'PEW',
    'multan': 'MUX',
    'sialkot': 'SKT',
    'quetta': 'UET',
    'faisalabad': 'LYP',
    'skardu': 'KDU',
    'turbat': 'TUK',
    'gwadar': 'GWD',
    'rahim yar khan': 'RYK',
    'sukkur': 'SKZ',
    'dera ghazi khan': 'DEA',
    'gilgit': 'GIL',
    'chitral': 'CJL',
    'bahawalpur': 'BHV',
    'hyderabad': 'HDD',
    'zhob': 'PZH',
    'abbottabad': 'AAW',
    'bannu': 'BNP',
    'dalbandin': 'DBA',
    'dera ismail khan': 'DSK',
    'jacobabad': 'JAG',
    'khuzdar': 'KDD',
    'mohenjodaro': 'MJD',
    'panjgur': 'PJG',
    'rawalakot': 'RAZ',
    'sawan': 'RZS',
    'gujrat': 'GRT',

    # Middle East
    'dubai': 'DXB',
    'abu dhabi': 'AUH',
    'doha': 'DOH',
    'riyadh': 'RUH',
    'jeddah': 'JED',
    'kuwait': 'KWI',
    'muscat': 'MCT',
    'manama': 'BAH',
    'tel aviv': 'TLV',
    'amman': 'AMM',
    'beirut': 'BEY',
    'baghdad': 'BGW',
    'tehran': 'IKA',
    
    # Africa
    'cairo': 'CAI',
    'casablanca': 'CMN',
    'marrakech': 'RAK',
    'tunis': 'TUN',
    'algiers': 'ALG',
    'lagos': 'LOS',
    'abuja': 'ABV',
    'accra': 'ACC',
    'nairobi': 'NBO',
    'addis ababa': 'ADD',
    'dar es salaam': 'DAR',
    'johannesburg': 'JNB',
    'cape town': 'CPT',
    'durban': 'DUR',
    
    # Oceania
    'sydney': 'SYD',
    'melbourne': 'MEL',
    'brisbane': 'BNE',
    'perth': 'PER',
    'adelaide': 'ADL',
    'auckland': 'AKL',
    'wellington': 'WLG',
    'christchurch': 'CHC',
    'fiji': 'NAN',
    'papeete': 'PPT',
    
    # South America
    'sao paulo': 'GRU',
    'rio de janeiro': 'GIG',
    'brasilia': 'BSB',
    'buenos aires': 'EZE',
    'cordoba': 'COR',
    'santiago': 'SCL',
    'lima': 'LIM',
    'bogota': 'BOG',
    'medellin': 'MDE',
    'quito': 'UIO',
    'guayaquil': 'GYE',
    'caracas': 'CCS',
    
    # Central America/Caribbean
    'panama city': 'PTY',
    'san jose': 'SJO',
    'havana': 'HAV',
    'san juan': 'SJU',
    'puntacana': 'PUJ',
    'kingston': 'KIN',
    'nassau': 'NAS',
    
    # Additional major airports
    'istanbul': 'IST',
    'moscow': 'SVO',
    'st petersburg': 'LED',
    'kyiv': 'KBP',
    'tbilisi': 'TBS',
    'yerevan': 'EVN',
    'baku': 'GYD',
    'ashgabat': 'ASB',
    'tashkent': 'TAS',
    'almaty': 'ALA',
    'ulaanbaatar': 'ULN'
}
class FlightBookingBot:
    def __init__(self):
        self.conversation_state = {
            'GREETING': 'greeting',
            'DEPARTURE_CITY': 'departure_city',
            'DESTINATION_CITY': 'destination_city',
            'PASSENGER_COUNT': 'passenger_count',
            'SEARCH_FLIGHTS': 'search_flights'
        }
    
    def get_ai_response(self, user_message, context=""):
        """Get AI response using Hugging Face API for better natural language understanding"""
        try:
            headers = {}
            if HUGGINGFACE_API_KEY:
                headers["Authorization"] = f"Bearer {HUGGINGFACE_API_KEY}"
            
            # Create a context-aware prompt for flight booking
            prompt = f"""You are a flight booking assistant. Help extract flight information from this message.
            Context: {context}
            User message: {user_message}
            
            Extract and respond with flight details if mentioned, or ask clarifying questions about:
            - Departure city
            - Destination city  
            - Number of passengers
            - Travel dates
            
            Keep responses concise and helpful."""
            
            payload = {
                "inputs": prompt,
                "parameters": {
                    "max_length": 150,
                    "temperature": 0.7,
                    "return_full_text": False
                }
            }
            
            response = requests.post(HUGGINGFACE_API_URL, headers=headers, json=payload, timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                if isinstance(result, list) and len(result) > 0:
                    return result[0].get('generated_text', '').strip()
                elif isinstance(result, dict):
                    return result.get('generated_text', '').strip()
            
            return None
            
        except Exception as e:
            logger.error(f"AI API error: {e}")
            return None
    
    def get_airport_code(self, city_name):
        """Get IATA airport code for a city with fuzzy matching"""
        if not city_name:
            return None
            
        city_lower = city_name.lower().strip()
        
        # Direct match
        if city_lower in AIRPORT_CODES:
            return AIRPORT_CODES[city_lower]
        
        # Fuzzy matching - check if any city contains the input or vice versa
        for city, code in AIRPORT_CODES.items():
            if city_lower in city or city in city_lower:
                return code
        
        # Check if input contains any known city
        for city, code in AIRPORT_CODES.items():
            if city in city_lower and len(city) > 2:  # Avoid matching single letters
                return code
        
        return None
    
    def extract_cities_with_ai(self, message):
        """Use AI to extract city names from natural language"""
        try:
            # First try with AI
            ai_response = self.get_ai_response(message, "Extract departure and destination cities")
            
            if ai_response:
                # Look for city patterns in AI response
                cities = []
                for city in AIRPORT_CODES.keys():
                    if city.lower() in ai_response.lower() and len(city) > 2:
                        cities.append(city)
                
                if len(cities) >= 2:
                    return {'departure': cities[0], 'destination': cities[1]}
                elif len(cities) == 1:
                    return {'departure': cities[0]} if 'from' in message.lower() else {'destination': cities[0]}
        
        except Exception as e:
            logger.error(f"AI extraction error: {e}")
        
        return None
    
    def extract_flight_info(self, message):
        """Extract flight information from user message using improved regex and AI"""
        message_lower = message.lower()
        
        # Try AI extraction first
        ai_result = self.extract_cities_with_ai(message)
        if ai_result:
            result = ai_result.copy()
            
            # Extract passenger count
            adults_match = re.search(r'(\d+)\s+adult[s]?', message_lower)
            children_match = re.search(r'(\d+)\s+(?:child|children|kid[s]?)', message_lower)
            
            if adults_match:
                result['adults'] = int(adults_match.group(1))
            else:
                result['adults'] = 1
                
            if children_match:
                result['children'] = int(children_match.group(1))
            else:
                result['children'] = 0
            
            return result
        
        # Fallback to improved regex patterns
        patterns = [
            # Pattern 1: "fly from X to Y"
            r'(?:fly|flight|travel|go)\s+from\s+([a-zA-Z\s]{2,25}?)\s+to\s+([a-zA-Z\s]{2,25})(?:\s+for\s+(\d+)\s+adult[s]?)?(?:\s+and\s+(\d+)\s+(?:child|children|kid[s]?))?',
            # Pattern 2: "from X to Y"
            r'from\s+([a-zA-Z\s]{2,25}?)\s+to\s+([a-zA-Z\s]{2,25})',
            # Pattern 3: "X to Y flight"
            r'([a-zA-Z\s]{2,25}?)\s+to\s+([a-zA-Z\s]{2,25})\s+flight',
            # Pattern 4: "book X to Y"
            r'book\s+([a-zA-Z\s]{2,25}?)\s+to\s+([a-zA-Z\s]{2,25})'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, message_lower)
            if match:
                departure = match.group(1).strip()
                destination = match.group(2).strip()
                
                # Validate that we got reasonable city names
                if len(departure) >= 2 and len(destination) >= 2:
                    adults = int(match.group(3)) if len(match.groups()) > 2 and match.group(3) else 1
                    children = int(match.group(4)) if len(match.groups()) > 3 and match.group(4) else 0
                    
                    return {
                        'departure': departure,
                        'destination': destination,
                        'adults': adults,
                        'children': children
                    }
        
        # Pattern for passenger count only
        adults_match = re.search(r'(\d+)\s+adult[s]?', message_lower)
        children_match = re.search(r'(\d+)\s+(?:child|children|kid[s]?)', message_lower)
        
        result = {}
        if adults_match:
            result['adults'] = int(adults_match.group(1))
        if children_match:
            result['children'] = int(children_match.group(1))
            
        return result if result else None
    
    def find_best_city_match(self, user_input):
        """Find the best matching city from user input"""
        user_input = user_input.lower().strip()
        
        # Direct match
        if user_input in AIRPORT_CODES:
            return user_input
        
        # Find cities that contain the input
        matches = []
        for city in AIRPORT_CODES.keys():
            if user_input in city:
                matches.append(city)
        
        # Find cities that the input contains
        if not matches:
            for city in AIRPORT_CODES.keys():
                if city in user_input and len(city) > 2:
                    matches.append(city)
        
        # Return the shortest match (most specific)
        if matches:
            return min(matches, key=len)
        
        return None
    
    def fetch_flight_data(self, departure_code, destination_code, adults=1, children=0):
        """Fetch flight data from Aviation Stack API or return mock data"""
        try:
            # Calculate departure date (tomorrow)
            departure_date = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
            
            url = f"{AVIATION_STACK_BASE_URL}/flights"
            params = {
                'access_key': AVIATION_STACK_API_KEY,
                'dep_iata': departure_code,
                'arr_iata': destination_code,
                'flight_date': departure_date,
                'limit': 10
            }
            
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            
            if 'data' in data and data['data']:
                flights = []
                booking_urls = self.get_booking_url(departure_code, destination_code, adults, children)
                
                for i, flight in enumerate(data['data'][:5]):  # Get top 5 flights
                    flight_info = {
                        'airline': flight.get('airline', {}).get('name', 'Unknown'),
                        'flight_number': flight.get('flight', {}).get('number', 'N/A'),
                        'departure_time': flight.get('departure', {}).get('scheduled', 'N/A'),
                        'arrival_time': flight.get('arrival', {}).get('scheduled', 'N/A'),
                        'price': f"${200 + len(flights) * 50}",  # Mock pricing
                        'booking_url': booking_urls[i % len(booking_urls)]
                    }
                    flights.append(flight_info)
                
                return flights
            else:
                # Return mock data if no real flights found
                return self.get_mock_flight_data(departure_code, destination_code, adults, children)
                
        except requests.exceptions.RequestException as e:
            logger.error(f"API request failed: {e}")
            # Return mock data on API failure
            return self.get_mock_flight_data(departure_code, destination_code, adults, children)
        except Exception as e:
            logger.error(f"Error fetching flight data: {e}")
            return self.get_mock_flight_data(departure_code, destination_code, adults, children)
    
    def get_booking_url(self, departure_code, destination_code, adults=1, children=0):
        """Generate real booking URLs for flight search"""
        departure_date = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
        
        # Multiple booking site options
        booking_sites = [
            f"https://www.skyscanner.com/transport/flights/{departure_code.lower()}/{destination_code.lower()}/{departure_date}/?adults={adults}&children={children}",
            f"https://www.kayak.com/flights/{departure_code}-{destination_code}/{departure_date}?sort=bestflight_a&passengers={adults}&cabin=e",
            f"https://www.expedia.com/Flights-Search?trip=oneway&leg1=from%3A{departure_code}%2Cto%3A{destination_code}%2Cdeparture%3A{departure_date}&passengers=adults%3A{adults}%2Cchildren%3A{children}",
            f"https://www.momondo.com/flight-search/{departure_code}-{destination_code}/{departure_date}?sort=bestflight_a&passengers={adults}&cabin=e",
            f"https://www.google.com/travel/flights?q=Flights%20from%20{departure_code}%20to%20{destination_code}%20on%20{departure_date}%20for%20{adults}%20adults"
        ]
        
        return booking_sites
    
    def get_mock_flight_data(self, departure_code, destination_code, adults=1, children=0):
        """Generate mock flight data when API is unavailable"""
        tomorrow = datetime.now() + timedelta(days=1)
        
        airlines = ['Emirates', 'British Airways', 'Lufthansa', 'Air France', 'Qatar Airways']
        booking_urls = self.get_booking_url(departure_code, destination_code, adults, children)
        
        flights = []
        for i in range(5):
            departure_time = tomorrow.replace(hour=6 + i*3, minute=0)
            arrival_time = departure_time + timedelta(hours=2 + i*0.5)
            
            flight_info = {
                'airline': airlines[i % len(airlines)],
                'flight_number': f"{airlines[i % len(airlines)][:2].upper()}{1000 + i}",
                'departure_time': departure_time.strftime('%Y-%m-%d %H:%M'),
                'arrival_time': arrival_time.strftime('%Y-%m-%d %H:%M'),
                'price': f"${250 + i * 75}",
                'booking_url': booking_urls[i % len(booking_urls)]
            }
            flights.append(flight_info)
        
        logger.info(f"Returning mock flight data for {departure_code} to {destination_code}")
        return flights
    
    def format_flight_results(self, flights, departure_city, destination_city):
        """Format flight results for WhatsApp message"""
        if not flights:
            return f"Sorry, I couldn't find any flights from {departure_city} to {destination_city}. Please try different cities or check back later."
        
        message = f"✈️ *Flight Options from {departure_city.title()} to {destination_city.title()}*\n\n"
        
        booking_sites = ['Skyscanner', 'Kayak', 'Expedia', 'Momondo', 'Google Flights']
        
        for i, flight in enumerate(flights, 1):
            site_name = booking_sites[(i-1) % len(booking_sites)]
            message += f"*Option {i}:*\n"
            message += f"🛫 Airline: {flight['airline']}\n"
            message += f"🔢 Flight: {flight['flight_number']}\n"
            message += f"⏰ Departure: {flight['departure_time']}\n"
            message += f"🛬 Arrival: {flight['arrival_time']}\n"
            message += f"💰 Price: {flight['price']}\n"
            message += f"🔗 Book on {site_name}: {flight['booking_url']}\n\n"
        
        message += "📌 *Booking Tips:*\n"
        message += "• Compare prices across different sites\n"
        message += "• Check baggage policies before booking\n"
        message += "• Book early for better deals\n\n"
        message += "Type 'new flight' to search again!"
        return message
    
    def process_message(self, phone_number, message):
        """Process incoming WhatsApp message"""
        message = message.strip()
        
        # Initialize user session if not exists
        if phone_number not in user_sessions:
            user_sessions[phone_number] = {
                'state': self.conversation_state['GREETING'],
                'data': {}
            }
        
        session = user_sessions[phone_number]
        
        # Handle greeting or restart - should work from any state
        if message.lower() in ['hi', 'hello', 'hey', 'start', 'new flight', 'restart']:
            session['state'] = self.conversation_state['GREETING']
            session['data'] = {}
            return ("Hello! 👋 I'm your flight booking assistant.\n\n"
                   "I can help you find the cheapest flights. You can:\n"
                   "• Send a complete request: 'I want to fly from New York to London for 2 adults and 1 child'\n"
                   "• Or I'll guide you step by step\n\n"
                   "Where would you like to fly from?")
        
        # Handle general questions
        if message.lower() in ['why', 'what', 'how', 'help']:
            return ("I'm here to help you find flights! 🛫\n\n"
                   "You can:\n"
                   "• Say: 'find flights from London to Paris'\n"
                   "• Say: 'fly from NYC to LA for 2 adults'\n"
                   "• Or type 'start' for step-by-step help\n\n"
                   "What can I help you with?")
        
        # Try to extract complete flight info first (regardless of state)
        flight_info = self.extract_flight_info(message)
        if flight_info and 'departure' in flight_info and 'destination' in flight_info:
            departure_city = self.find_best_city_match(flight_info['departure'])
            destination_city = self.find_best_city_match(flight_info['destination'])
            
            if not departure_city:
                return f"I couldn't find the airport for '{flight_info['departure']}'. Please try a major city like New York, London, Paris, Dubai, etc."
            
            if not destination_city:
                return f"I couldn't find the airport for '{flight_info['destination']}'. Please try a major city like New York, London, Paris, Dubai, etc."
            
            departure_code = self.get_airport_code(departure_city)
            destination_code = self.get_airport_code(destination_city)
            
            # Search flights
            adults = flight_info.get('adults', 1)
            children = flight_info.get('children', 0)
            
            flights = self.fetch_flight_data(departure_code, destination_code, adults, children)
            
            # flights will never be None now due to mock data fallback
            return self.format_flight_results(flights, departure_city, destination_city)
        
        # Step-by-step conversation flow
        if session['state'] == self.conversation_state['GREETING']:
            # Extract departure city with improved matching
            matched_city = self.find_best_city_match(message)
            if matched_city:
                departure_code = self.get_airport_code(matched_city)
                if departure_code:
                    session['data']['departure'] = matched_city
                    session['data']['departure_code'] = departure_code
                    session['state'] = self.conversation_state['DESTINATION_CITY']
                    return f"Great! Flying from {matched_city.title()}. Where would you like to go?"
            
            # Try AI assistance if direct matching fails
            ai_response = self.get_ai_response(message, "User is trying to specify departure city")
            if ai_response and any(city in ai_response.lower() for city in AIRPORT_CODES.keys()):
                return f"I think you mentioned a city, but I couldn't find it in my database. Could you please specify a major city like New York, London, Paris, Dubai, Mumbai, etc.?"
            
            return f"I couldn't find '{message}' in my database. Please try a major city like New York, London, Paris, Dubai, Mumbai, etc."
        
        elif session['state'] == self.conversation_state['DESTINATION_CITY']:
            matched_city = self.find_best_city_match(message)
            if matched_city:
                destination_code = self.get_airport_code(matched_city)
                if destination_code:
                    session['data']['destination'] = matched_city
                    session['data']['destination_code'] = destination_code
                    session['state'] = self.conversation_state['PASSENGER_COUNT']
                    return "Perfect! How many passengers? (e.g., '2 adults' or '1 adult and 2 children')"
            
            return f"I couldn't find '{message}' in my database. Please try a major city like New York, London, Paris, Dubai, Mumbai, etc."
        
        elif session['state'] == self.conversation_state['PASSENGER_COUNT']:
            passenger_info = self.extract_flight_info(f"for {message}")
            if passenger_info:
                adults = passenger_info.get('adults', 1)
                children = passenger_info.get('children', 0)
            else:
                # Default parsing
                adults_match = re.search(r'(\d+)', message)
                adults = int(adults_match.group(1)) if adults_match else 1
                children = 0
            
            session['data']['adults'] = adults
            session['data']['children'] = children
            
            # Search flights
            flights = self.fetch_flight_data(
                session['data']['departure_code'],
                session['data']['destination_code'],
                adults,
                children
            )
            
            # Reset session for next search
            session['state'] = self.conversation_state['GREETING']
            
            return self.format_flight_results(
                flights,
                session['data']['departure'],
                session['data']['destination']
            )
        
        # Use AI for general conversation
        ai_response = self.get_ai_response(message, "Flight booking conversation")
        if ai_response:
            return ai_response + "\n\nTo start a flight search, type 'start' or tell me: 'I want to fly from [city] to [city]'"
        
        # Default response
        return ("I didn't understand that. Please try:\n"
               "• 'I want to fly from [city] to [city]'\n"
               "• Or type 'start' to begin a new search")

# Initialize bot
bot = FlightBookingBot()

@app.route('/webhook', methods=['POST'])
def webhook():
    """Handle incoming WhatsApp messages"""
    try:
        # Get message data
        incoming_msg = request.values.get('Body', '').strip()
        phone_number = request.values.get('From', '')
        
        logger.info(f"Received message from {phone_number}: {incoming_msg}")
        
        # Process message
        response_text = bot.process_message(phone_number, incoming_msg)
        
        # Create Twilio response
        response = MessagingResponse()
        response.message(response_text)
        
        logger.info(f"Sending response: {response_text[:100]}...")
        
        return str(response)
    
    except Exception as e:
        logger.error(f"Error processing webhook: {e}")
        response = MessagingResponse()
        response.message("Sorry, I encountered an error. Please try again.")
        return str(response)

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'service': 'flight-booking-bot'})

@app.route('/', methods=['GET'])
def home():
    """Home page"""
    return jsonify({
        'service': 'Flight Booking WhatsApp Bot',
        'status': 'running',
        'endpoints': {
            'webhook': '/webhook',
            'health': '/health'
        }
    })

if __name__ == '__main__':
    # Validate environment variables
    required_env_vars = [
        'TWILIO_ACCOUNT_SID',
        'TWILIO_AUTH_TOKEN',
        'TWILIO_PHONE_NUMBER',
        'AVIATION_STACK_API_KEY'
    ]
    
    optional_env_vars = [
        'HUGGINGFACE_API_KEY'  # Optional for better AI responses
    ]
    
    print("🔍 Checking environment variables...")
    missing_vars = []
    for var in required_env_vars:
        value = os.getenv(var)
        if not value:
            missing_vars.append(var)
            print(f"❌ {var}: Not set")
        else:
            # Show partial value for security
            if 'TOKEN' in var or 'KEY' in var:
                display_value = value[:8] + "..." if len(value) > 8 else "***"
            else:
                display_value = value
            print(f"✅ {var}: {display_value}")
    
    for var in optional_env_vars:
        value = os.getenv(var)
        if value:
            display_value = value[:8] + "..." if len(value) > 8 else "***"
            print(f"✅ {var}: {display_value} (Optional)")
        else:
            print(f"⚠️  {var}: Not set (Optional - AI responses will be limited)")
    
    if missing_vars:
        print(f"\n❌ Missing required environment variables: {missing_vars}")
        print("\n📝 Please create a .env file in your project directory with:")
        print("TWILIO_ACCOUNT_SID=your_account_sid_here")
        print("TWILIO_AUTH_TOKEN=your_auth_token_here")
        print("TWILIO_PHONE_NUMBER=whatsapp:+14155238886")
        print("AVIATION_STACK_API_KEY=your_api_key_here")
        print("HUGGINGFACE_API_KEY=your_hf_token_here  # Optional")
        print("\n🔗 Get credentials from:")
        print("- Twilio: https://console.twilio.com/")
        print("- Aviation Stack: https://aviationstack.com/")
        print("- Hugging Face: https://huggingface.co/settings/tokens (Optional)")
        exit(1)
    
    # Initialize Twilio client after validation
    try:
        twilio_client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        print("✅ Twilio client initialized successfully")
    except Exception as e:
        print(f"❌ Failed to initialize Twilio client: {e}")
        exit(1)
    
    print("\n🚀 Flight Booking WhatsApp Bot starting...")
    print(f"📱 Twilio Phone Number: {TWILIO_PHONE_NUMBER}")
    print("💡 Bot Features:")
    print("  - AI-powered natural language understanding")
    print("  - Complete flight requests: 'fly from NYC to London for 2 adults'")
    print("  - Step-by-step guidance")
    print("  - Improved city name matching")
    print("  - Cheapest flight search")
    print("  - Direct booking links")
    print(f"\n🌐 Server starting on http://localhost:5000")
    print("🔗 Webhook endpoint: http://localhost:5000/webhook")
    
    app.run(debug=True, host='0.0.0.0', port=5000)