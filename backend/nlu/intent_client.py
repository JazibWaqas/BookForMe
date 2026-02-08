import logging
import requests
from typing import Dict, Any
from app.config import settings

logger = logging.getLogger(__name__)

RENDER_TO_5_INTENT = {
    "greeting": "greeting",
    "inquiry": "inquiry",
    "info": "info_request",
    "transaction_confirm": "transaction",
    "unknown": "unknown",
}


def get_intent_from_api(text: str) -> Dict[str, Any]:
    url = settings.INTENT_API_URL
    if not url:
        raise ValueError(
            "INTENT_API_URL is not set. Add INTENT_API_URL=https://your-app.onrender.com to backend/.env"
        )
    base = url.rstrip("/")
    predict_url = f"{base}/predict"
    payload = {"text": text}
    resp = requests.post(predict_url, json=payload, timeout=30)
    resp.raise_for_status()
    data = resp.json()
    intent = data.get("intent", "unknown")
    intent_5 = RENDER_TO_5_INTENT.get(intent, intent if intent in ("inquiry", "info_request", "transaction", "greeting") else "unknown")
    return {
        "intent": intent_5,
        "entities": {},
        "confidence": float(data.get("confidence", 0.0)),
    }
