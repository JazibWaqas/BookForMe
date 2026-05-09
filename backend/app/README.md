# FastAPI App

`backend/app` contains the FastAPI entrypoint, app configuration, Firestore
client bootstrap, and shared storage helpers.

## Key Files

- `main.py` - FastAPI app, routers, health endpoints, startup cleanup.
- `config.py` - environment-backed settings.
- `firestore.py` - Firestore client bootstrap plus legacy-compatible helpers.
- `storage.py` - Firebase Storage upload helpers.

## Current Environment Variables

- `DEEPSEEK_API_KEY` - text/NLU/conversation model.
- `GROQ_API_KEY` - current payment screenshot OCR vision model.
- `GEMINI_API_KEY` - optional OCR provider candidate if testing Gemini for
  local payment screenshot extraction accuracy.
- `GOOGLE_APPLICATION_CREDENTIALS` - Firestore service-account JSON or path.
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_VERIFY_TOKEN`
- `CLEANUP_CRON_SECRET` - optional header secret for expired-lock cleanup.

Model names are kept in code/config defaults:

- DeepSeek text: `deepseek-v4-flash`
- Groq OCR: `meta-llama/llama-4-scout-17b-16e-instruct`

Production deployment is currently:

- Backend/API/Web Chat: `https://bookforme-ie34.onrender.com`

## Run Locally

```bash
python -m uvicorn app.main:app --reload --port 8000 --host 0.0.0.0
```

From the repo root, `app.py` also loads the backend app for deployment.
