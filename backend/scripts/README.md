# Backend Scripts - Utility Tools

**Last Updated**: January 15, 2025  
**Purpose**: Testing, database setup, and development utilities

---

## 🎯 Overview

This folder contains utility scripts for:
- Database initialization and seeding
- Testing components and workflows
- Local agent testing
- Debugging and verification

---

## 📁 Scripts

### Database Setup

#### `init_firestore.py`
**Purpose**: Initialize Firestore database with collections and sample data  
**Usage**:
```bash
python backend/scripts/init_firestore.py
```
**What it does**:
- Creates Firestore collections if they don't exist
- Seeds initial vendor data
- Creates sample slots for testing

#### `seed_all.py`
**Purpose**: Populate database with comprehensive sample data  
**Usage**:
```bash
python backend/scripts/seed_all.py
```
**What it does**:
- Seeds vendors, resources, services
- Generates slots for 14 days
- Creates test users and bookings
- Seeds social features data

**Data Generated**:
- 85+ vendors across 6 categories
- 3,000+ availability slots
- Test bookings in various states
- Sample social posts and matches

### Testing Scripts

#### `chat_terminal.py`
**Purpose**: Test LangGraph agent locally via terminal  
**Usage**:
```bash
python backend/scripts/chat_terminal.py
```
**What it does**:
- Starts interactive chat session
- Tests full LangGraph workflow
- Uses actual Firestore database
- Shows intent classification and responses

**Example**:
```
> kal slot hai?
Intent: availability_inquiry
Entities: {date: 'tomorrow', service_type: 'padel'}
Response: Available slots for tomorrow...
```

#### `chat.py`
**Purpose**: Test NLU agent only (simpler than chat_terminal)  
**Usage**:
```bash
python backend/scripts/chat.py
```
**What it does**:
- Tests Gemini NLU integration
- Shows intent and entity extraction
- Generates AI responses
- No LangGraph workflow

#### `test_workflow.py`
**Purpose**: Test complete booking workflow end-to-end  
**Usage**:
```bash
python backend/scripts/test_workflow.py
```
**What it does**:
- Tests slot locking
- Tests payment upload
- Tests booking confirmation
- Verifies double-booking prevention

#### `test_booking_db.py`
**Purpose**: Test database booking operations  
**Usage**:
```bash
python backend/scripts/test_booking_db.py
```
**What it does**:
- Tests slot locking with transactions
- Tests concurrent booking attempts
- Verifies OCC prevents double-booking

#### `test_nlu.py`
**Purpose**: Test NLU intent classification and entity extraction  
**Usage**:
```bash
python backend/scripts/test_nlu.py
```
**What it does**:
- Tests various user messages
- Shows intent classification results
- Shows extracted entities
- Tests Roman Urdu/English handling

#### `test_api.py`
**Purpose**: Test REST API endpoints  
**Usage**:
```bash
python backend/scripts/test_api.py
```
**What it does**:
- Tests vendor endpoints
- Tests slot availability endpoints
- Tests booking endpoints
- Verifies authentication

### Verification Scripts

#### `check_db.py`
**Purpose**: Check database status and data  
**Usage**:
```bash
python backend/scripts/check_db.py
```
**What it does**:
- Lists all collections
- Counts documents per collection
- Checks data integrity
- Verifies indexes

#### `verify_booking.py`
**Purpose**: Verify booking was created correctly  
**Usage**:
```bash
python backend/scripts/verify_booking.py {booking_id}
```

#### `verify_latest_booking.py`
**Purpose**: Check the most recent booking  
**Usage**:
```bash
python backend/scripts/verify_latest_booking.py
```

### Debug Scripts

#### `debug_slot_match.py`
**Purpose**: Debug slot matching logic  
**Usage**:
```bash
python backend/scripts/debug_slot_match.py
```

#### `check_slot_status.py`
**Purpose**: Check status of specific slot  
**Usage**:
```bash
python backend/scripts/check_slot_status.py {vendor_id} {date} {time}
```

---

## 📚 Documentation Files

### `README_POPULATION.md`
**Purpose**: Guide for populating database with sample data  
**Content**: Instructions for running seed scripts, data structure, customization

### `SAMPLE_DATA_SUMMARY.md`
**Purpose**: Overview of sample data generated  
**Content**: Vendor categories, slot counts, test scenarios

### `CHAT_TERMINAL_GUIDE.md`
**Purpose**: Guide for using chat_terminal.py  
**Content**: How to test agent locally, common commands, troubleshooting

---

## 🚀 Common Workflows

### Initial Setup
```bash
# 1. Initialize database
python backend/scripts/init_firestore.py

# 2. Seed sample data
python backend/scripts/seed_all.py

# 3. Verify setup
python backend/scripts/check_db.py
```

### Testing Agent
```bash
# Test full workflow
python backend/scripts/chat_terminal.py

# Test NLU only
python backend/scripts/chat.py

# Test booking flow
python backend/scripts/test_workflow.py
```

### Debugging Issues
```bash
# Check database status
python backend/scripts/check_db.py

# Verify specific booking
python backend/scripts/verify_latest_booking.py

# Test API endpoints
python backend/scripts/test_api.py
```

---

## ⚠️ Important Notes

1. **Environment Variables**: Most scripts require `.env` file with API keys
2. **Firestore Connection**: Scripts use same Firestore connection as backend
3. **Test Data**: Seed scripts create test data - don't run in production
4. **Dependencies**: All scripts require `requirements.txt` dependencies installed

---

## 🔧 Troubleshooting

### Script Fails to Connect to Firestore
- Check `FIRESTORE_PROJECT_ID` in `.env`
- Verify credentials file path
- Ensure Firestore API is enabled

### Seed Script Fails
- Check Firestore quota limits
- Verify collection names match schema
- Check for existing data conflicts

### Chat Terminal Not Responding
- Verify Gemini API key is set
- Check internet connection
- Review server logs for errors

---

**Last Updated**: January 15, 2025  
**Maintained By**: Backend Team

