# BookForMe Firestore Data Population

This directory contains scripts to populate your Firestore database with realistic sample data for testing and development.

## Overview

The population script generates comprehensive vendor data for all supported categories:

- **Futsal Courts** (12 vendors) - Sports venues with hourly pricing
- **Padel Courts** (12 vendors) - Premium sports venues with hourly pricing  
- **Beach Huts** (14 vendors) - Beachside venues with daily pricing
- **Farmhouses** (15 vendors) - Event venues with day/night pricing
- **Salons** (17 vendors) - Beauty services with service-based pricing
- **Gaming Zones** (15 vendors) - Entertainment venues with console-based pricing

## Generated Data Structure

### Vendor Documents
Each vendor document includes:
- Basic info (name, category, location, contact)
- Service-specific details (pricing, amenities, capacity)
- Operating hours
- Ratings and reviews
- Images (placeholder URLs)

### Availability Data
Two collections are populated:
1. **`vendors/{id}/availability/{date}`** - Subcollection for each vendor
2. **`availability_slots`** - Flat collection for easy querying

### Sample Data Features
- **Realistic Karachi locations** (DHA, Clifton, Gulshan, etc.)
- **Pakistani phone numbers** with proper formatting
- **Varied pricing** based on location and service type
- **Random availability** (30-50% booked slots)
- **7 days of availability** from current date
- **Service-specific time slots** and pricing

## Usage

### Prerequisites
1. Firestore project configured
2. Service account credentials in place
3. Environment variables set in `.env`:
   ```
   FIRESTORE_PROJECT_ID=your-project-id
   GOOGLE_APPLICATION_CREDENTIALS=your-credentials-json
   ```

### Running the Script

#### Option 1: Direct execution
```bash
cd backend/scripts
python populate_firestore_data.py
```

#### Option 2: Using the runner
```bash
cd backend/scripts
python run_population.py
```

#### Option 3: From project root
```bash
python backend/scripts/populate_firestore_data.py
```

### Expected Output
```
🎯 BookForMe Firestore Data Population
==================================================
🔌 Testing Firestore connection...
✅ Firestore connection successful!
📊 Generating vendor data...
✅ Generated 85 vendors
💾 Adding vendors to Firestore...
  ✓ Added Kickoff Futsal Arena (Futsal Court)
  ✓ Added Total Football Ground (Futsal Court)
  ...
  ✓ Added Gaming Paradise (Gaming Zone)

🎉 Successfully populated Firestore!
📈 Statistics:
   • Total vendors: 85
   • Futsal Courts: 12
   • Padel Courts: 12
   • Beach Huts: 14
   • Farmhouses: 15
   • Salons: 17
   • Gaming Zones: 15
   • Availability data: 7 days for each vendor
```

## Data Categories

### Futsal Courts
- **Pricing**: PKR 3,000-6,000/hour
- **Time slots**: 9 AM - 9 PM
- **Amenities**: Floodlights, parking, washrooms, etc.
- **Capacity**: 10-20 people

### Padel Courts  
- **Pricing**: PKR 4,000-8,000/hour
- **Time slots**: 7 AM - 8 PM
- **Amenities**: Air conditioning, professional equipment, coaching
- **Capacity**: 4-8 people

### Beach Huts
- **Pricing**: PKR 15,000-50,000/day
- **Time slots**: 6 AM - 4 PM (daily booking)
- **Amenities**: Swimming pool, generator, kitchen, bedrooms
- **Capacity**: 25-100 people

### Farmhouses
- **Pricing**: PKR 20,000-70,000/day (day/night/full options)
- **Time slots**: 6 AM - 8 PM (day), 6 PM - 8 PM (night)
- **Amenities**: Swimming pool, cricket ground, BBQ area, AC rooms
- **Capacity**: 50-300 people

### Salons
- **Pricing**: Service-based (PKR 500-35,000)
- **Time slots**: 9 AM - 8 PM
- **Services**: Haircut, coloring, facial, manicure, bridal packages
- **Types**: Unisex, Men's, Women's

### Gaming Zones
- **Pricing**: PKR 300-1,500/hour (varies by console)
- **Time slots**: 12 PM - 2 AM
- **Consoles**: PS5, Xbox Series X, PC, VR, Nintendo Switch
- **Games**: FIFA, Call of Duty, Valorant, etc.

## Testing Your Data

After population, you can test the data through:

1. **WhatsApp Bot**: Send messages like "Find futsal courts near me"
2. **Frontend**: Browse vendors by category and location
3. **API**: Query vendors and availability through REST endpoints
4. **AI Agent**: Test booking flows and recommendations

## Customization

To modify the generated data:

1. **Add more vendors**: Edit the `generate_*_courts()` methods
2. **Change pricing**: Modify the price ranges in each generator
3. **Add categories**: Create new generator methods and call them in `populate_database()`
4. **Modify availability**: Adjust the `generate_availability_slots()` method

## Troubleshooting

### Common Issues

1. **Firestore connection failed**
   - Check your credentials file path
   - Verify project ID is correct
   - Ensure Firestore API is enabled

2. **Permission denied**
   - Check service account permissions
   - Verify credentials file is valid

3. **No data appearing**
   - Check Firestore console
   - Verify collections are created
   - Check for error messages in output

### Debug Mode
Add debug logging by modifying the script:
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## Data Cleanup

To clear all test data:
```python
# WARNING: This will delete all data!
from app.firestore import firestore_db

# Delete all vendors
vendors = firestore_db.db.collection('vendors').stream()
for vendor in vendors:
    vendor.reference.delete()

# Delete all availability slots
slots = firestore_db.db.collection('availability_slots').stream()
for slot in slots:
    slot.reference.delete()
```

## Next Steps

After successful population:

1. **Test WhatsApp integration** with real vendor data
2. **Verify frontend displays** vendors correctly
3. **Test booking flows** end-to-end
4. **Configure AI agent** with real data context
5. **Add more realistic data** as needed for your use case

---

**Note**: This script generates test data. For production, replace with real vendor data and proper data validation.
