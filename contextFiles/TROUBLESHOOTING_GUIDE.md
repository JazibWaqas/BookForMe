# 🔧 JHAT Troubleshooting Guide

**Purpose**: Common setup issues and solutions for developers  
**Last Updated**: February 20, 2026  
**Scope**: Backend setup, API keys, database issues, AI agent problems

---

## 🚨 QUICK FIXES (Most Common Issues)

### 1. Invalid Groq API Key Error
**Problem**: Getting `401 Unauthorized - Invalid API Key` errors when testing WhatsApp agent.

**Root Cause**: Missing or invalid `GROQ_API_KEY` in `.env` file.

**Solution**:
1. Get your Groq API key from https://console.groq.com/
2. Add to `backend/.env`:
   ```bash
   GROQ_API_KEY=gsk_your_actual_key_here
   GROQ_MODEL=qwen-3-32b
   ```
3. Restart the backend server

**Verification**:
```bash
python backend/scripts/test_groq_migration.py
```

### 2. Database Connection Failed
**Problem**: Firestore connection errors, "permission denied" messages.

**Root Cause**: Incorrect `FIRESTORE_PROJECT_ID` or missing credentials.

**Solution**:
1. Check `backend/.env`:
   ```bash
   FIRESTORE_PROJECT_ID=your_actual_project_id
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."
   ```
2. Verify project exists in Google Cloud Console
3. Ensure Firestore API is enabled

**Verification**:
```bash
python backend/scripts/check_db.py
```

### 3. WhatsApp Webhook Not Working
**Problem**: WhatsApp messages not reaching the backend.

**Root Cause**: Webhook URL not accessible or verification token mismatch.

**Solution**:
1. Use ngrok for local testing:
   ```bash
   ngrok http 8000
   ```
2. Update webhook URL in Meta for Developers dashboard
3. Check `WHATSAPP_WEBHOOK_VERIFY_TOKEN` in `.env`

**Verification**:
```bash
curl -X POST http://localhost:8000/webhook/whatsapp \
  -H "Content-Type: application/json" \
  -d '{"entry": [{"changes": [{"value": {"messages": [{"text": {"body": "test"}}]}}]}]}'
```

---

## 🗄️ DATABASE ISSUES

### 4. Database Empty or Corrupted
**Problem**: No data showing up, queries returning empty results.

**Root Cause**: Database not seeded or data wiped accidentally.

**Solution**:
```bash
# Reset and reseed (CAREFUL - This deletes all data)
python backend/scripts/init_firestore.py
python backend/scripts/seed_all.py --days 14

# Verify data
python backend/scripts/check_db.py
```

### 5. Slot Generation Issues
**Problem**: No slots available for booking.

**Root Cause**: Slot generator not run or timezone issues.

**Solution**:
```bash
# Generate slots for specific date range
python backend/scripts/seed_all.py --days 14

# Check slot status
python backend/scripts/check_slot_status.py capital-padel 2026-02-13 19:00
```

### 6. Double-Booking Issues
**Problem**: Multiple users booking same slot simultaneously.

**Root Cause**: Missing Firestore transactions or race conditions.

**Solution**:
1. Ensure all slot writes use `@firestore.transactional`
2. Check `slot_service.py` for transaction usage
3. Test with concurrent booking attempts

**Verification**:
```bash
python backend/scripts/test_booking_db.py
```

---

## 🤖 AI AGENT ISSUES

### 7. AI Agent Not Responding
**Problem**: WhatsApp agent sends no response or errors out.

**Root Cause**: Missing API keys, network issues, or NLU failures.

**Solution**:
1. Check all API keys in `.env`:
   ```bash
   GROQ_API_KEY=your_key
   GEMINI_API_KEY=your_key
   ```
2. Test agent locally:
   ```bash
   python backend/scripts/chat_terminal.py
   ```
3. Check internet connection and API service status

### 8. Intent Classification Errors
**Problem**: Agent misunderstanding user messages.

**Root Cause**: Poor prompts or model issues.

**Solution**:
1. Check prompts in `backend/nlu/agent.py`
2. Test with various messages:
   ```bash
   python backend/scripts/test_nlu.py
   ```
3. Review conversation examples in `CONVERSATION_SYSTEM_COMPLETE.md`

### 9. Entity Extraction Issues
**Problem**: Agent not extracting dates, times, or services correctly.

**Root Cause**: Entity extraction prompts need improvement.

**Solution**:
1. Review entity extraction prompts in `nlu/agent.py`
2. Test with Roman Urdu phrases
3. Update prompt patterns for common phrases

---

## 📱 MOBILE APP ISSUES

### 10. Network Request Failed
**Problem**: Mobile app showing "Network request failed" errors.

**Root Cause**: Backend not running or incorrect API URL.

**Solution**:
1. Ensure backend is running: `http://localhost:8000`
2. Check `App/config.js` API_BASE_URL
3. Verify same network (for physical device testing)

### 11. Authentication Issues
**Problem**: Users can't log in or tokens expiring.

**Root Cause**: Firebase Auth configuration issues.

**Solution**:
1. Check Firebase config in `App/config.js`
2. Verify Firebase project settings
3. Check authentication flow in `App/services/auth.ts`

### 12. Performance Issues
**Problem**: App loading slowly, screens taking too long.

**Root Cause**: Inefficient queries or missing caching.

**Solution**:
1. Check React Query caching in `App/hooks/useQueries.ts`
2. Optimize Firestore queries with indexes
3. Add loading states and skeletons

---

## 🔧 DEVELOPMENT ENVIRONMENT ISSUES

### 13. Python Dependencies
**Problem**: Import errors, missing packages.

**Root Cause**: Virtual environment not set up or dependencies outdated.

**Solution**:
```bash
# Create fresh environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r backend/requirements.txt

# Verify installation
python -c "import fastapi, firestore, groq"
```

### 14. Node.js Dependencies
**Problem**: npm install failing, module not found errors.

**Root Cause**: Node version mismatch or corrupted node_modules.

**Solution**:
```bash
cd App
rm -rf node_modules package-lock.json
npm install

# Check Node version (should be 16+)
node --version
npm --version
```

### 15. Expo Development Issues
**Problem**: Expo Go not connecting, build failures.

**Root Cause**: Network issues or Expo configuration problems.

**Solution**:
```bash
cd App
# Clear cache
expo start -c

# Check Expo CLI version
expo --version

# Update if needed
npm install -g @expo/cli
```

---

## 🌐 DEPLOYMENT ISSUES

### 16. Render Deployment Failed
**Problem**: Application not deploying or crashing on startup.

**Root Cause**: Environment variables missing or startup issues.

**Solution**:
1. Check Render environment variables
2. Verify `requirements.txt` includes all dependencies
3. Check Render logs for specific error messages
4. Ensure `Procfile` is correct

### 17. Firestore Rules Issues
**Problem**: Permission denied errors in production.

**Root Cause**: Firestore security rules too restrictive.

**Solution**:
1. Review Firestore rules in Google Cloud Console
2. Test rules with Firestore emulator
3. Update rules to allow necessary operations

---

## 🧪 TESTING ISSUES

### 18. Tests Failing
**Problem**: Unit tests or integration tests failing.

**Root Cause**: Test data issues or outdated test expectations.

**Solution**:
1. Check test data setup in `backend/scripts/test_*.py`
2. Update test expectations to match current schema
3. Run tests individually to identify specific issues

### 19. End-to-End Testing Issues
**Problem**: Complete booking flow not working.

**Root Cause**: Integration issues between components.

**Solution**:
1. Test each component individually:
   ```bash
   # Test API
   python backend/scripts/test_api.py
   
   # Test AI agent
   python backend/scripts/chat_terminal.py
   
   # Test database
   python backend/scripts/check_db.py
   ```
2. Check logs for integration errors
3. Verify data flow between components

---

## 📊 PERFORMANCE ISSUES

### 20. Slow API Responses
**Problem**: API endpoints taking too long to respond.

**Root Cause**: Inefficient queries or missing indexes.

**Solution**:
1. Check Firestore composite indexes
2. Optimize queries with proper filters
3. Add caching for frequently accessed data
4. Monitor response times

### 21. High Memory Usage
**Problem**: Application using too much memory.

**Root Cause**: Memory leaks or inefficient data loading.

**Solution**:
1. Profile memory usage
2. Check for circular references
3. Optimize data loading patterns
4. Add connection pooling

---

## 🚨 EMERGENCY PROCEDURES

### Complete System Reset
**When to use**: System completely corrupted or major schema changes.

**Steps**:
```bash
# 1. Backup current data (if possible)
python backend/scripts/backup_firestore.py

# 2. Wipe everything
python backend/scripts/wipe_firestore.py

# 3. Reset from scratch
python backend/scripts/init_firestore.py
python backend/scripts/seed_all.py --days 14

# 4. Verify everything
python backend/scripts/master_forensic_verification
```

### Emergency Rollback
**When to use**: Recent deployment broke critical functionality.

**Steps**:
1. Identify last working commit
2. Rollback deployment
3. Verify functionality
4. Investigate what went wrong

---

## 📞 GETTING HELP

### When to Ask for Help
- You've tried all solutions above
- Error messages are unclear
- System behavior is unexpected
- You need clarification on architecture

### How to Get Help
1. **Check Documentation First**:
   - `ARCHITECTURE_MASTER_SPEC.md` - Technical questions
   - `CONVERSATION_SYSTEM_COMPLETE.md` - AI agent issues
   - `DEVELOPER_ONBOARDING.md` - Setup questions

2. **Create GitHub Issue**:
   - Include error messages
   - Describe what you tried
   - Provide environment details
   - Add relevant logs

3. **Team Communication**:
   - Use team chat for quick questions
   - Tag relevant team members
   - Provide context and urgency

### Debugging Tips
1. **Check Logs First**: Always check console/logs for error details
2. **Isolate the Problem**: Test components individually
3. **Reproduce Consistently**: Document steps to reproduce
4. **Document Everything**: Keep track of what you tried

---

## 🔍 PREVENTIVE MEASURES

### Regular Maintenance
- **Weekly**: Check for dependency updates
- **Monthly**: Review and rotate API keys
- **Quarterly**: Full system health check

### Monitoring Setup
- **Backend**: Add logging and error tracking
- **Database**: Monitor query performance
- **API**: Set up health check endpoints
- **Mobile**: Add crash reporting

### Backup Strategy
- **Database**: Daily automated backups
- **Configuration**: Version control all config files
- **Documentation**: Keep docs updated with changes

---

**This guide covers the most common issues developers encounter. If your issue isn't covered here, check the main documentation or ask the team for help.**

---

*Last Updated: February 20, 2026*  
*Contributions welcome: Add new issues and solutions as you discover them*
# Historical Archive Notice

This troubleshooting guide is historical. Check current docs first, especially
`backend/README.md`, `backend/app/README.md`, and
`backend/database/seed/README.md`.

---
