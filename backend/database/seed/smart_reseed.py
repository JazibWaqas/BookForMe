"""
SMART RESEED SCRIPT  (safe, additive)
======================================
Creates missing slot documents for the next DAYS_AHEAD days.
NEVER deletes or overwrites existing documents — any slot that already
exists in Firestore (regardless of status) is silently skipped.

HOW SLOT IDs ARE CONSTRUCTED (must match safe_slot_seed.py exactly):
    {YYYYMMDD}_{HH}_{vendor_id}_{resource_id}
    e.g.  20260226_07_ace_padel_dha_ace_court_1

SLOT HOURS derived from schema.py operating hours (source of truth):
    DEFAULT_OPERATING_HOURS  → weekdays 07:00–00:00 → hours 7..23
    WEEKEND_OPERATING_HOURS  → varies per vendor, but typically 08:00–00:00

    "close: 00:00" means midnight, so the last slot starts at 23:00.
    We convert open→close string pair into an integer hour list here so
    the logic is identical to what the original seeder intended.

TIMESTAMPS: stored as UTC datetime objects → Firestore Timestamp type.
    start_time for hour H (PKT) = PKT.localize(date H:00) → astimezone(UTC)
    end_time   = start_time + 1 hour

Run from the backend/ directory:
    python database/seed/smart_reseed.py
"""

import os
import sys
import logging

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from datetime import datetime, timedelta, timezone
from google.cloud import firestore
from app.config import settings
import pytz

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

DAYS_AHEAD = 30  # how many days ahead to ensure slots exist

# Day-of-week index → short name used in operating_hours maps
DOW_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]


# ---------------------------------------------------------------------------
# helpers
# ---------------------------------------------------------------------------

def operating_hours_to_hour_range(open_str: str, close_str: str) -> list[int]:
    """
    Convert an operating hours pair like ("07:00", "00:00") to a list of
    integer hours for which a slot should exist.

    Rules:
    - open_hour is the first slot.
    - close_hour 00 is treated as 24 (midnight end-of-day).
    - close_hour ≤ open_hour also means overnight, so +24.
    - The last slot starts 1 hour BEFORE close (so close=00:00 → last slot=23:00).
    """
    open_h  = int(open_str.split(":")[0])
    close_h = int(close_str.split(":")[0])

    if close_h == 0:          # midnight close
        close_h = 24
    elif close_h < open_h:   # genuinely overnight (e.g. 07:00 → 02:00 next day)
        close_h += 24

    # Slot at hour H runs H:00–H+1:00.  Last valid slot starts at close_h - 1.
    return list(range(open_h, close_h))   # e.g. range(7,24) = [7,8,...,23]


def get_firestore_client():
    import json, tempfile

    creds_env = settings.GOOGLE_APPLICATION_CREDENTIALS
    if creds_env:
        # Could be a raw JSON string or a file path
        if creds_env.strip().startswith("{"):
            try:
                creds = json.loads(creds_env)
                with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
                    json.dump(creds, f)
                    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = f.name
            except Exception as e:
                logger.warning(f"Could not parse JSON credentials: {e}")
        else:
            os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = creds_env
    else:
        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = settings.FIRESTORE_CREDENTIALS_FILE

    return firestore.Client(project=settings.FIRESTORE_PROJECT_ID)


# ---------------------------------------------------------------------------
# core logic
# ---------------------------------------------------------------------------

def generate_needed_slots_from_schema() -> list[dict]:
    """
    Build the complete list of slot dicts that *should* exist for the next
    DAYS_AHEAD days, using VENDORS_DATA, RESOURCES_DATA, SERVICES_DATA and
    the operating_hours defined in schema.py (DEFAULT_OPERATING_HOURS, etc.)
    as the authoritative source of truth for hour ranges.
    """
    from database.seed.vendors_data import VENDORS_DATA, RESOURCES_DATA, SERVICES_DATA
    from database.schema import SlotStatus

    PKT = pytz.timezone("Asia/Karachi")
    UTC = timezone.utc

    # Build lookup maps
    services_by_vendor  = {s["vendor_id"]: s for s in SERVICES_DATA}
    resources_by_vendor: dict[str, list] = {}
    for r in RESOURCES_DATA:
        resources_by_vendor.setdefault(r["vendor_id"], []).append(r)

    needed: list[dict] = []
    today_pkt = datetime.now(PKT).replace(hour=0, minute=0, second=0, microsecond=0)

    for day_offset in range(DAYS_AHEAD):
        current_date = today_pkt + timedelta(days=day_offset)
        date_str     = current_date.strftime("%Y-%m-%d")  # "2026-02-26"
        date_compact = current_date.strftime("%Y%m%d")    # "20260226"

        # 0=Monday … 6=Sunday  (Python weekday())
        dow_key = DOW_KEYS[current_date.weekday()]

        for vendor in VENDORS_DATA:
            vendor_id       = vendor["id"]
            vendor_service  = services_by_vendor.get(vendor_id)
            vendor_resources = resources_by_vendor.get(vendor_id, [])

            if not vendor_service or not vendor_resources:
                continue

            # Pull today's operating hours from the vendor's own hours config
            op_hours = vendor.get("operating_hours", {})
            day_hours = op_hours.get(dow_key)
            if not day_hours:
                logger.warning(f"No operating hours for vendor {vendor_id} on {dow_key}, skipping")
                continue

            hours = operating_hours_to_hour_range(day_hours["open"], day_hours["close"])

            for resource in vendor_resources:
                for hour in hours:
                    # Slot document ID — identical formula to safe_slot_seed.py
                    slot_id = f"{date_compact}_{hour:02d}_{vendor_id}_{resource['id']}"

                    # Timestamps: PKT → UTC (stored as Firestore Timestamp)
                    start_pkt = PKT.localize(datetime(
                        current_date.year, current_date.month, current_date.day,
                        hour % 24, 0, 0  # hour 23 → 23:00, hour 24 would wrap
                    ))
                    start_utc = start_pkt.astimezone(UTC)
                    end_utc   = start_utc + timedelta(hours=1)

                    needed.append({
                        "_doc_id"       : slot_id,
                        # ── exact same field set as the original seed ──────────
                        "vendor_id"     : vendor_id,
                        "service_id"    : vendor_service["id"],
                        "resource_id"   : resource["id"],
                        "date"          : date_str,
                        "start_time"    : start_utc,   # UTC datetime → Firestore Timestamp
                        "end_time"      : end_utc,     # UTC datetime → Firestore Timestamp
                        "price"         : vendor_service.get("pricing", {}).get("base", 2000),
                        "status"        : SlotStatus.AVAILABLE.value,  # "available"
                        "user_id"       : None,
                        "payment_id"    : None,
                        "hold_expires_at": None,
                        "created_at"    : firestore.SERVER_TIMESTAMP,
                        "updated_at"    : firestore.SERVER_TIMESTAMP,
                        # ── no extra fields — keeps schema identical ────────────
                    })

    logger.info(f"Generated {len(needed)} candidate slots spanning {DAYS_AHEAD} days")
    return needed


def smart_reseed(db: firestore.Client) -> int:
    """
    Additive reseed: check which slots already exist, create only the missing ones.
    Returns the count of newly created slots.
    """
    needed = generate_needed_slots_from_schema()
    all_ids = [s["_doc_id"] for s in needed]

    # ── Check existence in batches of 30 (Firestore client lib limit per get_all) ──
    logger.info(f"Checking {len(all_ids)} candidate slot IDs against Firestore…")
    existing_ids: set[str] = set()
    BATCH = 30

    for i in range(0, len(all_ids), BATCH):
        refs = [db.collection("slots").document(doc_id) for doc_id in all_ids[i:i + BATCH]]
        for doc in db.get_all(refs):
            if doc.exists:
                existing_ids.add(doc.id)

    to_create = [s for s in needed if s["_doc_id"] not in existing_ids]

    logger.info(f"Already in Firestore : {len(existing_ids):>5} slots  (SKIPPED — not touched)")
    logger.info(f"Missing from Firestore: {len(to_create):>5} slots  (WILL CREATE)")

    if not to_create:
        logger.info("✅ Nothing to do — all slots already exist.")
        return 0

    # ── Write in Firestore batch commits of 500 (hard limit) ──
    batch = db.batch()
    count = 0

    for slot in to_create:
        doc_id = slot.pop("_doc_id")
        # batch.set() creates the doc if absent, overwrites if present.
        # Since we already filtered out existing docs, this is effectively a create.
        batch.set(db.collection("slots").document(doc_id), slot)
        count += 1

        if count % 500 == 0:
            batch.commit()
            batch = db.batch()
            logger.info(f"  … committed {count} new slots so far")

    if count % 500 != 0:
        batch.commit()

    logger.info(f"✅ Created {count} new available slots.")
    return count


def verify(db: firestore.Client):
    """Quick sanity check — print a few sample docs."""
    logger.info("── Verification: sample slots ──────────────────────────────")
    sample = list(db.collection("slots").order_by("date").limit(5).stream())
    if not sample:
        logger.warning("No slots found at all in Firestore!")
        return
    for doc in sample:
        s = doc.to_dict()
        logger.info(
            f"  {doc.id}  status={s.get('status')}  "
            f"date={s.get('date')}  vendor={s.get('vendor_id')}  "
            f"resource={s.get('resource_id')}"
        )
    logger.info("────────────────────────────────────────────────────────────")


# ---------------------------------------------------------------------------
# main
# ---------------------------------------------------------------------------

def main():
    logger.info("🚀 SMART RESEED — safe, additive, schema-correct")
    logger.info(f"   Will ensure slots exist for the next {DAYS_AHEAD} days")
    logger.info(f"   Hour ranges derived from schema.py operating_hours")
    logger.info(f"   Slot ID format: YYYYMMDD_HH_vendorId_resourceId")

    db = get_firestore_client()
    created = smart_reseed(db)
    verify(db)

    logger.info(f"🎉 DONE — {created} new slots written to Firestore")


if __name__ == "__main__":
    main()
