import uuid
import json
import tempfile
import urllib.parse
import logging
import os
import firebase_admin
from firebase_admin import credentials, storage as fb_storage
from app.config import settings

logger = logging.getLogger(__name__)


def _resolve_credentials() -> credentials.Certificate:
    raw = settings.GOOGLE_APPLICATION_CREDENTIALS
    if raw and raw.strip().startswith('{'):
        try:
            data = json.loads(raw.strip())
            with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
                json.dump(data, f)
                return credentials.Certificate(f.name)
        except Exception as e:
            logger.warning(f"Could not parse GOOGLE_APPLICATION_CREDENTIALS as JSON: {e}")

    creds_file = settings.FIRESTORE_CREDENTIALS_FILE
    if os.path.exists(creds_file):
        return credentials.Certificate(creds_file)

    raise RuntimeError("No valid Firebase credentials found for Storage.")


def _init():
    if firebase_admin._apps:
        return
    cred = _resolve_credentials()
    firebase_admin.initialize_app(cred, {
        'storageBucket': settings.FIREBASE_STORAGE_BUCKET
    })


def upload_bytes(data: bytes, destination: str, content_type: str = "image/jpeg") -> str | None:
    try:
        _init()
        bucket = fb_storage.bucket()
        blob = bucket.blob(destination)
        token = str(uuid.uuid4())
        blob.metadata = {'firebaseStorageDownloadTokens': token}
        blob.upload_from_string(data, content_type=content_type)
        blob.patch()
        encoded = urllib.parse.quote(destination, safe='')
        url = (
            f"https://firebasestorage.googleapis.com/v0/b/"
            f"{settings.FIREBASE_STORAGE_BUCKET}/o/{encoded}?alt=media&token={token}"
        )
        logger.info(f"Uploaded to Firebase Storage: {url}")
        return url
    except Exception as e:
        logger.error(f"Firebase Storage upload failed: {e}")
        return None
