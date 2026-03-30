"""
Admin API Endpoints
Role-protected operational controls for platform administration.
"""

import asyncio
import logging
from datetime import datetime
from typing import Any, Dict, List, Literal, Optional

import pytz
from fastapi import APIRouter, Depends, Header, HTTPException, Query
from google.cloud import firestore
from pydantic import BaseModel

from app.firestore import firestore_db
from database.auth_service import AuthService
from database.schema import Collections
from database.slot_service import SlotService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/admin", tags=["Admin"])

auth_service = AuthService(firestore_db.db)
slot_service = SlotService(firestore_db.db)
KARACHI_TZ = pytz.timezone("Asia/Karachi")


def _ts_iso(value: Any) -> Optional[str]:
    if value is None:
        return None
    if hasattr(value, "isoformat"):
        return value.isoformat()
    return str(value)


def _clean_doc(data: Dict[str, Any]) -> Dict[str, Any]:
    safe = dict(data or {})
    safe.pop("password_hash", None)
    return safe


def get_current_user(authorization: str = Header(None)) -> Dict[str, Any]:
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")
    token = authorization.replace("Bearer ", "")
    payload = auth_service.verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return payload


async def require_admin(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    role = (current_user.get("role") or "").lower()
    if role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


async def _write_audit_log(
    admin_user: Dict[str, Any],
    action: str,
    target_type: str,
    target_id: str,
    reason: Optional[str] = None,
    before: Optional[Dict[str, Any]] = None,
    after: Optional[Dict[str, Any]] = None,
    metadata: Optional[Dict[str, Any]] = None,
) -> None:
    doc = {
        "admin_user_id": admin_user.get("sub"),
        "admin_email": admin_user.get("email"),
        "action": action,
        "target_type": target_type,
        "target_id": target_id,
        "reason": reason or "",
        "before": _clean_doc(before or {}),
        "after": _clean_doc(after or {}),
        "metadata": metadata or {},
        "created_at": firestore.SERVER_TIMESTAMP,
    }
    await asyncio.to_thread(lambda: firestore_db.db.collection(Collections.ADMIN_AUDIT_LOGS).add(doc))


class VendorStatusUpdateRequest(BaseModel):
    action: Literal["approve", "reject", "suspend", "reactivate"]
    reason: Optional[str] = None


class PaymentReviewRequest(BaseModel):
    reason: Optional[str] = None


class SlotGenerationRequest(BaseModel):
    vendor_id: Optional[str] = None
    days_ahead: int = 14


class UserStatusUpdateRequest(BaseModel):
    active: bool
    reason: Optional[str] = None


@router.get("/overview")
async def admin_overview(admin: Dict[str, Any] = Depends(require_admin)):
    try:
        db = firestore_db.db
        vendors_docs = await asyncio.to_thread(lambda: list(db.collection(Collections.VENDORS).stream()))
        payments_docs = await asyncio.to_thread(
            lambda: list(db.collection(Collections.PAYMENTS).where("status", "==", "uploaded").stream())
        )
        slots_locked_docs = await asyncio.to_thread(
            lambda: list(db.collection(Collections.SLOTS).where("status", "==", "locked").stream())
        )

        pending_vendors = 0
        suspended_vendors = 0
        active_vendors = 0
        for doc in vendors_docs:
            status = str((doc.to_dict() or {}).get("status", "active")).lower()
            if status in {"pending", "submitted", "onboarding_requested"}:
                pending_vendors += 1
            elif status == "suspended":
                suspended_vendors += 1
            elif status in {"active", "approved"} or not status:
                active_vendors += 1

        return {
            "success": True,
            "metrics": {
                "pending_vendors": pending_vendors,
                "active_vendors": active_vendors,
                "suspended_vendors": suspended_vendors,
                "pending_payments": len(payments_docs),
                "locked_slots": len(slots_locked_docs),
            },
        }
    except Exception as e:
        logger.error(f"admin overview failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to load admin overview")


@router.get("/vendors")
async def admin_list_vendors(
    status: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    admin: Dict[str, Any] = Depends(require_admin),
):
    try:
        db = firestore_db.db
        docs = await asyncio.to_thread(lambda: list(db.collection(Collections.VENDORS).stream()))

        rows = []
        for doc in docs:
            data = doc.to_dict() or {}
            v_status = str(data.get("status", "active")).lower()
            if status and v_status != status.lower():
                continue
            rows.append(
                {
                    "id": doc.id,
                    "name": data.get("name") or data.get("business_name") or doc.id,
                    "owner_name": data.get("owner_name"),
                    "email": data.get("email"),
                    "phone": data.get("phone"),
                    "area": data.get("area"),
                    "status": v_status,
                    "created_at": _ts_iso(data.get("created_at")),
                    "user_id": data.get("user_id"),
                }
            )

        rows.sort(key=lambda r: r.get("created_at") or "", reverse=True)
        return {"success": True, "vendors": rows[:limit], "count": len(rows)}
    except Exception as e:
        logger.error(f"admin list vendors failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to list vendors")


@router.patch("/vendors/{vendor_id}/status")
async def admin_update_vendor_status(
    vendor_id: str,
    request: VendorStatusUpdateRequest,
    admin: Dict[str, Any] = Depends(require_admin),
):
    try:
        db = firestore_db.db
        vendor_ref = db.collection(Collections.VENDORS).document(vendor_id)
        vendor_doc = await asyncio.to_thread(vendor_ref.get)
        if not vendor_doc.exists:
            raise HTTPException(status_code=404, detail="Vendor not found")

        before = vendor_doc.to_dict() or {}
        status_map = {
            "approve": "active",
            "reject": "rejected",
            "suspend": "suspended",
            "reactivate": "active",
        }
        next_status = status_map[request.action]
        update_doc = {
            "status": next_status,
            "status_reason": request.reason or "",
            "status_updated_at": firestore.SERVER_TIMESTAMP,
            "updated_at": firestore.SERVER_TIMESTAMP,
        }
        await asyncio.to_thread(lambda: vendor_ref.update(update_doc))

        user_id = before.get("user_id")
        if user_id:
            user_ref = db.collection(Collections.USERS).document(user_id)
            user_doc = await asyncio.to_thread(user_ref.get)
            if user_doc.exists:
                user_update: Dict[str, Any] = {"updated_at": firestore.SERVER_TIMESTAMP}
                if request.action in {"approve", "reactivate"}:
                    user_update.update({"role": "vendor", "vendor_id": vendor_id, "account_status": "active"})
                elif request.action == "suspend":
                    user_update.update({"account_status": "suspended"})
                elif request.action == "reject":
                    user_update.update({"account_status": "rejected"})
                await asyncio.to_thread(lambda: user_ref.update(user_update))

        refreshed = await asyncio.to_thread(vendor_ref.get)
        after = refreshed.to_dict() or {}
        await _write_audit_log(
            admin,
            action=f"vendor_{request.action}",
            target_type="vendor",
            target_id=vendor_id,
            reason=request.reason,
            before=before,
            after=after,
        )

        return {"success": True, "vendor_id": vendor_id, "status": after.get("status", next_status)}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"admin update vendor status failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to update vendor status")


@router.delete("/vendors/{vendor_id}")
async def admin_delete_vendor(
    vendor_id: str,
    hard_delete: bool = Query(False),
    reason: Optional[str] = Query(None),
    admin: Dict[str, Any] = Depends(require_admin),
):
    try:
        db = firestore_db.db
        vendor_ref = db.collection(Collections.VENDORS).document(vendor_id)
        vendor_doc = await asyncio.to_thread(vendor_ref.get)
        if not vendor_doc.exists:
            raise HTTPException(status_code=404, detail="Vendor not found")

        before = vendor_doc.to_dict() or {}
        if hard_delete:
            await asyncio.to_thread(vendor_ref.delete)
            action = "vendor_hard_delete"
            after = {}
        else:
            update_doc = {
                "status": "deleted",
                "deleted_at": firestore.SERVER_TIMESTAMP,
                "status_reason": reason or "",
                "updated_at": firestore.SERVER_TIMESTAMP,
            }
            await asyncio.to_thread(lambda: vendor_ref.update(update_doc))
            action = "vendor_soft_delete"
            after_doc = await asyncio.to_thread(vendor_ref.get)
            after = after_doc.to_dict() or {}

        user_id = before.get("user_id")
        if user_id:
            user_ref = db.collection(Collections.USERS).document(user_id)
            user_doc = await asyncio.to_thread(user_ref.get)
            if user_doc.exists:
                await asyncio.to_thread(
                    lambda: user_ref.update(
                        {
                            "account_status": "deleted",
                            "vendor_id": None,
                            "updated_at": firestore.SERVER_TIMESTAMP,
                        }
                    )
                )

        await _write_audit_log(
            admin,
            action=action,
            target_type="vendor",
            target_id=vendor_id,
            reason=reason,
            before=before,
            after=after,
            metadata={"hard_delete": hard_delete},
        )

        return {"success": True, "vendor_id": vendor_id, "hard_delete": hard_delete}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"admin delete vendor failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete vendor")


@router.post("/slots/generate")
async def admin_generate_slots(
    request: SlotGenerationRequest,
    admin: Dict[str, Any] = Depends(require_admin),
):
    try:
        from database.seed.smart_reseed import DAYS_AHEAD, smart_reseed

        # Canonical admin slot generation path:
        # use the same additive 2-week smart seed logic used in your ops workflow.
        created = await asyncio.to_thread(lambda: smart_reseed(firestore_db.db))

        await _write_audit_log(
            admin,
            action="slots_generate",
            target_type="slots",
            target_id=request.vendor_id or "all_vendors",
            metadata={
                "source": "database.seed.smart_reseed.smart_reseed",
                "configured_days_ahead": DAYS_AHEAD,
                "request_vendor_id": request.vendor_id,
                "request_days_ahead": request.days_ahead,
                "created": created,
            },
        )
        return {
            "success": True,
            "created": created,
            "days_ahead": DAYS_AHEAD,
            "note": "Slots generated via canonical smart_reseed additive flow.",
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"admin generate slots failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate slots")


@router.post("/slots/release-stale-locks")
async def admin_release_stale_locks(admin: Dict[str, Any] = Depends(require_admin)):
    try:
        result = slot_service.cleanup_expired_locks()
        await _write_audit_log(
            admin,
            action="slots_release_stale_locks",
            target_type="slots",
            target_id="expired_locks",
            metadata=result,
        )
        return {"success": True, **result}
    except Exception as e:
        logger.error(f"admin release stale locks failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to release stale locks")


@router.get("/payments/pending")
async def admin_list_pending_payments(
    limit: int = Query(50, ge=1, le=200),
    admin: Dict[str, Any] = Depends(require_admin),
):
    try:
        db = firestore_db.db
        docs = await asyncio.to_thread(
            lambda: list(db.collection(Collections.PAYMENTS).where("status", "==", "uploaded").stream())
        )

        rows = []
        for doc in docs:
            data = doc.to_dict() or {}
            rows.append(
                {
                    "id": doc.id,
                    "slot_id": data.get("slot_id"),
                    "vendor_id": data.get("vendor_id"),
                    "user_id": data.get("user_id"),
                    "amount_claimed": data.get("amount_claimed"),
                    "ocr_verified_amount": data.get("ocr_verified_amount"),
                    "screenshot_url": data.get("screenshot_url"),
                    "created_at": _ts_iso(data.get("created_at")),
                    "status": data.get("status"),
                }
            )

        rows.sort(key=lambda r: r.get("created_at") or "", reverse=True)
        return {"success": True, "payments": rows[:limit], "count": len(rows)}
    except Exception as e:
        logger.error(f"admin list pending payments failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to list pending payments")


@router.post("/payments/{payment_id}/approve")
async def admin_approve_payment(
    payment_id: str,
    request: PaymentReviewRequest,
    admin: Dict[str, Any] = Depends(require_admin),
):
    try:
        db = firestore_db.db
        payment_ref = db.collection(Collections.PAYMENTS).document(payment_id)
        payment_doc = await asyncio.to_thread(payment_ref.get)
        if not payment_doc.exists:
            raise HTTPException(status_code=404, detail="Payment not found")
        before = payment_doc.to_dict() or {}

        await asyncio.to_thread(
            lambda: payment_ref.update(
                {
                    "status": "verified",
                    "reviewed_by": admin.get("sub"),
                    "review_reason": request.reason or "",
                    "reviewed_at": firestore.SERVER_TIMESTAMP,
                    "updated_at": firestore.SERVER_TIMESTAMP,
                }
            )
        )

        slot_id = before.get("slot_id")
        if slot_id:
            slot_ref = db.collection(Collections.SLOTS).document(slot_id)
            slot_doc = await asyncio.to_thread(slot_ref.get)
            if slot_doc.exists:
                slot_data = slot_doc.to_dict() or {}
                if slot_data.get("status") in {"pending", "locked"}:
                    await asyncio.to_thread(
                        lambda: slot_ref.update(
                            {
                                "status": "confirmed",
                                "payment_id": payment_id,
                                "updated_at": firestore.SERVER_TIMESTAMP,
                            }
                        )
                    )

        after_doc = await asyncio.to_thread(payment_ref.get)
        after = after_doc.to_dict() or {}
        await _write_audit_log(
            admin,
            action="payment_approve",
            target_type="payment",
            target_id=payment_id,
            reason=request.reason,
            before=before,
            after=after,
        )
        return {"success": True, "payment_id": payment_id, "status": "verified"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"admin approve payment failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to approve payment")


@router.post("/payments/{payment_id}/reject")
async def admin_reject_payment(
    payment_id: str,
    request: PaymentReviewRequest,
    admin: Dict[str, Any] = Depends(require_admin),
):
    try:
        db = firestore_db.db
        payment_ref = db.collection(Collections.PAYMENTS).document(payment_id)
        payment_doc = await asyncio.to_thread(payment_ref.get)
        if not payment_doc.exists:
            raise HTTPException(status_code=404, detail="Payment not found")
        before = payment_doc.to_dict() or {}

        await asyncio.to_thread(
            lambda: payment_ref.update(
                {
                    "status": "rejected",
                    "reviewed_by": admin.get("sub"),
                    "review_reason": request.reason or "",
                    "reviewed_at": firestore.SERVER_TIMESTAMP,
                    "updated_at": firestore.SERVER_TIMESTAMP,
                }
            )
        )

        slot_id = before.get("slot_id")
        if slot_id:
            slot_ref = db.collection(Collections.SLOTS).document(slot_id)
            slot_doc = await asyncio.to_thread(slot_ref.get)
            if slot_doc.exists:
                slot_data = slot_doc.to_dict() or {}
                if slot_data.get("status") in {"pending", "locked"}:
                    await asyncio.to_thread(
                        lambda: slot_ref.update(
                            {
                                "status": "available",
                                "user_id": None,
                                "payment_id": None,
                                "hold_expires_at": None,
                                "updated_at": firestore.SERVER_TIMESTAMP,
                            }
                        )
                    )

        after_doc = await asyncio.to_thread(payment_ref.get)
        after = after_doc.to_dict() or {}
        await _write_audit_log(
            admin,
            action="payment_reject",
            target_type="payment",
            target_id=payment_id,
            reason=request.reason,
            before=before,
            after=after,
        )
        return {"success": True, "payment_id": payment_id, "status": "rejected"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"admin reject payment failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to reject payment")


@router.get("/users")
async def admin_list_users(
    q: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=300),
    admin: Dict[str, Any] = Depends(require_admin),
):
    try:
        db = firestore_db.db
        docs = await asyncio.to_thread(lambda: list(db.collection(Collections.USERS).stream()))
        needle = (q or "").strip().lower()

        rows = []
        for doc in docs:
            data = doc.to_dict() or {}
            name = str(data.get("name") or "")
            email = str(data.get("email") or "")
            if needle and needle not in name.lower() and needle not in email.lower():
                continue
            rows.append(
                {
                    "id": doc.id,
                    "name": name,
                    "email": email,
                    "phone": data.get("phone"),
                    "role": data.get("role", "customer"),
                    "vendor_id": data.get("vendor_id"),
                    "account_status": data.get("account_status", "active"),
                    "created_at": _ts_iso(data.get("created_at")),
                }
            )

        rows.sort(key=lambda r: r.get("created_at") or "", reverse=True)
        return {"success": True, "users": rows[:limit], "count": len(rows)}
    except Exception as e:
        logger.error(f"admin list users failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to list users")


@router.post("/users/{user_id}/status")
async def admin_update_user_status(
    user_id: str,
    request: UserStatusUpdateRequest,
    admin: Dict[str, Any] = Depends(require_admin),
):
    try:
        db = firestore_db.db
        user_ref = db.collection(Collections.USERS).document(user_id)
        user_doc = await asyncio.to_thread(user_ref.get)
        if not user_doc.exists:
            raise HTTPException(status_code=404, detail="User not found")
        before = user_doc.to_dict() or {}

        account_status = "active" if request.active else "disabled"
        await asyncio.to_thread(
            lambda: user_ref.update(
                {
                    "account_status": account_status,
                    "updated_at": firestore.SERVER_TIMESTAMP,
                }
            )
        )

        after_doc = await asyncio.to_thread(user_ref.get)
        after = after_doc.to_dict() or {}
        await _write_audit_log(
            admin,
            action="user_activate" if request.active else "user_disable",
            target_type="user",
            target_id=user_id,
            reason=request.reason,
            before=before,
            after=after,
        )
        return {"success": True, "user_id": user_id, "account_status": account_status}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"admin update user status failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to update user status")


@router.get("/audit-logs")
async def admin_audit_logs(
    limit: int = Query(50, ge=1, le=200),
    admin: Dict[str, Any] = Depends(require_admin),
):
    try:
        db = firestore_db.db
        docs = await asyncio.to_thread(
            lambda: list(
                db.collection(Collections.ADMIN_AUDIT_LOGS)
                .order_by("created_at", direction=firestore.Query.DESCENDING)
                .limit(limit)
                .stream()
            )
        )
        rows = []
        for doc in docs:
            data = doc.to_dict() or {}
            rows.append(
                {
                    "id": doc.id,
                    "admin_user_id": data.get("admin_user_id"),
                    "admin_email": data.get("admin_email"),
                    "action": data.get("action"),
                    "target_type": data.get("target_type"),
                    "target_id": data.get("target_id"),
                    "reason": data.get("reason"),
                    "created_at": _ts_iso(data.get("created_at")),
                }
            )
        return {"success": True, "logs": rows}
    except Exception as e:
        logger.error(f"admin audit logs failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch audit logs")
