#!/usr/bin/env python3
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

if 'GOOGLE_APPLICATION_CREDENTIALS' not in os.environ:
    firestore_file = os.path.join(os.path.dirname(__file__), 'backend', 'credentials', 'firestore-service-account.json')
    if os.path.exists(firestore_file):
        os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = firestore_file

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=port)
