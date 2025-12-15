"""
Payment file upload endpoint
Handles multipart/form-data file uploads for payment screenshots
"""

from fastapi import File, UploadFile, Form
import os
import uuid
from pathlib import Path

# Create uploads directory if it doesn't exist
UPLOAD_DIR = Path("uploads/payments")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


@router.post("/payments/upload")
async def upload_payment_screenshot(
    file: UploadFile = File(...),
    slot_id: str = Form(...),
    amount_claimed: float = Form(...),
    user_id: str = Depends(get_current_user_id)
):
    """
    Upload payment screenshot and create payment record
    
    Args:
        file: Payment screenshot image
        slot_id: Slot ID
        amount_claimed: Amount claimed in payment
        user_id: User ID (from JWT token)
        
    Returns:
        Payment confirmation
    """
    try:
        logger.info(f"Uploading payment screenshot for slot {slot_id} by user {user_id}")
        
        # Validate slot
        slot = await firestore_v2.get_slot(slot_id)
        if not slot:
            raise HTTPException(status_code=404, detail="Slot not found")
        
        if slot.get('user_id') != user_id:
            raise HTTPException(status_code=403, detail="This slot is not locked by you")
        
        if slot.get('status') != 'locked':
            raise HTTPException(status_code=400, detail=f"Slot is not locked (current: {slot.get('status')})")
        
        vendor_id = slot.get('vendor_id')
        if not vendor_id:
            raise HTTPException(status_code=400, detail="Slot has no vendor_id")
        
        # Save file
        file_extension = os.path.splitext(file.filename)[1] if file.filename else '.jpg'
        unique_filename = f"{slot_id}_{uuid.uuid4()}{file_extension}"
        file_path = UPLOAD_DIR / unique_filename
        
        # Write file to disk
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Create relative URL for the file
        screenshot_url = f"/uploads/payments/{unique_filename}"
        
        # Create payment record
        payment_doc = {
            'slot_id': slot_id,
            'user_id': user_id,
            'vendor_id': vendor_id,
            'screenshot_url': screenshot_url,
            'amount_claimed': amount_claimed,
            'status': 'pending',
            'created_at': firestore.SERVER_TIMESTAMP
        }
        
        payment_ref = firestore_db.db.collection('payments').add(payment_doc)
        payment_id = payment_ref[1].id
        
        # Submit payment
        payment_result = slot_service.submit_payment(slot_id, user_id, payment_id)
        
        if not payment_result['success']:
            # Clean up uploaded file if payment submission fails
            if file_path.exists():
                file_path.unlink()
            raise HTTPException(status_code=400, detail=payment_result.get('error', 'Failed to submit payment'))
        
        # Confirm booking
        confirm_result = slot_service.confirm_booking(slot_id, vendor_id)
        
        if not confirm_result['success']:
            logger.warning(f"Payment submitted but confirmation failed: {confirm_result.get('error')}")
        
        return {
            "success": True,
            "payment_id": payment_id,
            "slot_id": slot_id,
            "screenshot_url": screenshot_url,
            "status": "confirmed",
            "message": "Payment uploaded and booking confirmed"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading payment screenshot: {e}")
        # Clean up file if it was created
        if 'file_path' in locals() and file_path.exists():
            file_path.unlink()
        raise HTTPException(status_code=500, detail=f"Failed to upload payment: {str(e)}")
