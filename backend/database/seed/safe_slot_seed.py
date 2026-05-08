"""
LEGACY DESTRUCTIVE SLOT SEEDING SCRIPT.

Despite the old name, this script deletes the entire slots collection before
repopulating it. The current canonical path is smart_reseed.py, which is
additive and never resets live slot state.
"""

import os
import sys
import logging
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from datetime import datetime, timedelta, timezone
from google.cloud import firestore
from app.config import settings
import pytz

# ---------------------------------------------------------------------
# LOGGING
# ---------------------------------------------------------------------
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------
# FIRESTORE CLIENT
# ---------------------------------------------------------------------
def get_firestore_client():
    import json
    import tempfile

    if settings.GOOGLE_APPLICATION_CREDENTIALS:
        creds = json.loads(settings.GOOGLE_APPLICATION_CREDENTIALS)
        with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
            json.dump(creds, f)
            os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = f.name
    else:
        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = settings.FIRESTORE_CREDENTIALS_FILE

    return firestore.Client(project=settings.FIRESTORE_PROJECT_ID)

# ---------------------------------------------------------------------
# DELETE SLOTS ONLY
# ---------------------------------------------------------------------
def delete_slots_collection(db):
    logger.warning("🗑️ Deleting slots collection ONLY")

    while True:
        docs = list(db.collection("slots").limit(500).stream())
        if not docs:
            break

        batch = db.batch()
        for doc in docs:
            batch.delete(doc.reference)
        batch.commit()

        logger.info(f"Deleted {len(docs)} slots")

    logger.info("✅ Slots collection cleared")

# ---------------------------------------------------------------------
# GENERATE SLOTS
# ---------------------------------------------------------------------
def generate_slots():
    from database.seed.vendors_data import VENDORS_DATA, RESOURCES_DATA, SERVICES_DATA
    from database.schema import SlotStatus

    PKT = pytz.timezone("Asia/Karachi")
    UTC = timezone.utc

    vendors = {v["id"]: v for v in VENDORS_DATA}
    services = {s["vendor_id"]: s for s in SERVICES_DATA}
    resources_by_vendor = {}

    for r in RESOURCES_DATA:
        resources_by_vendor.setdefault(r["vendor_id"], []).append(r)

    slots = []
    start_date = datetime.now(PKT).replace(hour=0, minute=0, second=0, microsecond=0)

    for day_offset in range(14):  # 🔑 NEXT 14 DAYS
        current_date = start_date + timedelta(days=day_offset)
        date_str = current_date.strftime("%Y-%m-%d")

        for vendor_id in vendors.keys():
            vendor_service = services.get(vendor_id)
            vendor_resources = resources_by_vendor.get(vendor_id, [])

            if not vendor_service or not vendor_resources:
                continue

            for resource in vendor_resources:
                for hour in range(8, 23):  # 8 AM – 10 PM PKT
                    start_pkt = PKT.localize(
                        datetime(
                            current_date.year,
                            current_date.month,
                            current_date.day,
                            hour,
                            0,
                        )
                    )

                    start_utc = start_pkt.astimezone(UTC)
                    end_utc = start_utc + timedelta(hours=1)

                    slot_id = f"{date_str.replace('-', '')}_{hour:02d}_{vendor_id}_{resource['id']}"

                    slots.append({
                        "_doc_id": slot_id,
                        "vendor_id": vendor_id,
                        "service_id": vendor_service["id"],
                        "resource_id": resource["id"],
                        "date": date_str,
                        "start_time": start_utc,
                        "end_time": end_utc,
                        "price": vendor_service.get("pricing", {}).get("base", 2000),
                        "status": SlotStatus.AVAILABLE.value,
                        "user_id": None,
                        "payment_id": None,
                        "hold_expires_at": None,
                        "created_at": firestore.SERVER_TIMESTAMP,
                        "updated_at": firestore.SERVER_TIMESTAMP,
                    })

    logger.info(f"Generated {len(slots)} slots total")
    return slots

# ---------------------------------------------------------------------
# SEED
# ---------------------------------------------------------------------
def seed_slots(db):
    slots = generate_slots()
    batch = db.batch()
    count = 0

    for slot in slots:
        doc_id = slot.pop("_doc_id")
        batch.set(db.collection("slots").document(doc_id), slot)
        count += 1

        if count % 500 == 0:
            batch.commit()
            batch = db.batch()
            logger.info(f"Committed {count} slots")

    if count % 500 != 0:
        batch.commit()

    logger.info(f"✅ Seeded {count} slots")

# ---------------------------------------------------------------------
# VERIFY
# ---------------------------------------------------------------------
def verify(db):
    sample = list(db.collection("slots").limit(5).stream())
    for doc in sample:
        s = doc.to_dict()
        assert s["start_time"] is not None
        assert s["end_time"] is not None
        assert s["vendor_id"]
        assert s["service_id"]
        assert s["resource_id"]
    logger.info("✅ Verification passed")

# ---------------------------------------------------------------------
# MAIN
# ---------------------------------------------------------------------
def main(confirm_reset_slots: bool = False):
    if not confirm_reset_slots:
        logger.error(
            "Refusing to reset slots without --confirm-reset-slots. "
            "Use smart_reseed.py for safe additive slot creation."
        )
        sys.exit(2)

    logger.info("🚀 LEGACY SLOT RESET STARTED")
    db = get_firestore_client()
    delete_slots_collection(db)
    seed_slots(db)
    verify(db)
    logger.info("🎉 SLOT SEEDING COMPLETE")

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Legacy destructive slot reset")
    parser.add_argument(
        "--confirm-reset-slots",
        action="store_true",
        help="Required. Confirms you intend to delete and recreate all slots.",
    )
    args = parser.parse_args()

    main(confirm_reset_slots=args.confirm_reset_slots)
