"""
One-time utility to upsert the demo admin account.

Usage:
  python scripts/ensure_admin_user.py
"""

import json
import os
import tempfile

import bcrypt
from google.cloud import firestore

from app.config import settings


def get_firestore_client() -> firestore.Client:
    if settings.GOOGLE_APPLICATION_CREDENTIALS:
        creds_data = settings.GOOGLE_APPLICATION_CREDENTIALS
        if creds_data.strip().startswith("{"):
            parsed = json.loads(creds_data)
            with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
                json.dump(parsed, f)
                os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = f.name
        else:
            os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = creds_data
    else:
        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = settings.FIRESTORE_CREDENTIALS_FILE

    return firestore.Client(project=settings.FIRESTORE_PROJECT_ID)


def main() -> None:
    db = get_firestore_client()
    users = db.collection("users")
    email = "admin@email.com"
    password = "admin123"

    docs = list(users.where("email", "==", email).limit(1).stream())
    password_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    payload = {
        "name": "Platform Admin",
        "email": email,
        "phone": "+92 300 0000000",
        "role": "admin",
        "vendor_id": None,
        "account_status": "active",
        "password_hash": password_hash,
        "updated_at": firestore.SERVER_TIMESTAMP,
    }

    if docs:
        users.document(docs[0].id).update(payload)
        print(f"Updated existing admin user: {docs[0].id}")
    else:
        payload["created_at"] = firestore.SERVER_TIMESTAMP
        users.document("platform_admin_demo").set(payload)
        print("Created admin user: platform_admin_demo")

    print("Done. You can now login with admin@email.com / admin123")


if __name__ == "__main__":
    main()
