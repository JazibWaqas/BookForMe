import logging
import re
import base64
import asyncio
from typing import Dict, Any, Optional
from openai import OpenAI
from app.config import settings

logger = logging.getLogger(__name__)

VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"
AMOUNT_TOLERANCE = 10

PROMPT = (
    "You are reading ONE image. It must be a clear Pakistani mobile money or bank PAYMENT CONFIRMATION screen "
    "(JazzCash, EasyPaisa, or bank app) showing a completed transfer—NOT a selfie, shop photo, product, chat, or random scene.\n"
    "If the image is NOT clearly such a screen, or you cannot see one unambiguous transferred/total amount in PKR, respond with exactly: 0\n"
    "If it IS a valid confirmation screen, find the main amount that was transferred or debited (the transaction total in PKR), "
    "not fees, not airtime, not unrelated numbers on clothing or background.\n"
    "Reply with NOTHING else: only that one number using digits and optional decimal point (e.g. 2000 or 2000.50). "
    "No currency symbol, no words, no units, no explanation."
)


class PaymentOCR:

    def __init__(self):
        api_key = settings.GROQ_API_KEY
        self.client = OpenAI(
            base_url="https://api.groq.com/openai/v1",
            api_key=api_key,
            timeout=max(settings.AI_REQUEST_TIMEOUT_SECONDS, 10.0),
            max_retries=0,
        )
        logger.info(f"PaymentOCR initialized with model: {VISION_MODEL}")

    async def verify_payment(
        self, image_bytes: bytes, expected_amount: Optional[float]
    ) -> Dict[str, Any]:
        try:
            b64 = base64.b64encode(image_bytes).decode("utf-8")

            messages = [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{b64}"
                            },
                        },
                        {"type": "text", "text": PROMPT},
                    ],
                }
            ]

            response = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: self.client.chat.completions.create(
                    model=VISION_MODEL,
                    messages=messages,
                    temperature=0.1,
                    max_tokens=50,
                ),
            )

            raw = response.choices[0].message.content.strip()
            logger.info(f"OCR raw response: '{raw}'")

            extracted = self._parse_amount(raw)

            if extracted is None:
                logger.warning("OCR could not extract a valid amount from the screenshot")
                return {"verified": False, "extracted_amount": None, "error": "no_amount_found"}

            if expected_amount is None:
                logger.warning("No expected amount in session, accepting any extracted amount")
                return {"verified": True, "extracted_amount": extracted, "error": None}

            within_tolerance = abs(extracted - float(expected_amount)) <= AMOUNT_TOLERANCE
            logger.info(
                f"OCR verification: extracted={extracted}, expected={expected_amount}, "
                f"tolerance=±{AMOUNT_TOLERANCE}, match={within_tolerance}"
            )
            return {"verified": within_tolerance, "extracted_amount": extracted, "error": None}

        except Exception as e:
            logger.error(f"OCR verification failed: {e}")
            return {"verified": False, "extracted_amount": None, "error": str(e)}

    def _parse_amount(self, text: str) -> Optional[float]:
        cleaned = text.replace(",", "").replace(" ", "")
        match = re.search(r"\d[\d.]*", cleaned)
        if not match:
            return None
        try:
            amount = float(match.group())
            return amount if amount > 0 else None
        except ValueError:
            return None
