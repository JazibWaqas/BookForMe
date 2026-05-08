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
    "This is a Pakistani payment screenshot (JazzCash / EasyPaisa / bank transfer). "
    "Find the total amount transferred in PKR and return ONLY that number. "
    "No text, no units, no currency symbol. If you cannot find a clear amount, return 0."
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
