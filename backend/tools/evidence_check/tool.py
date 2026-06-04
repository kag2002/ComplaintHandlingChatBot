from __future__ import annotations

import json
from pathlib import Path
from typing import Any
from tools.order_lookup.tool import order_lookup

def evidence_check(order_id: str) -> dict[str, Any]:
    """Kiểm tra tình trạng bằng chứng hình ảnh của đơn hàng."""
    order = order_lookup(order_id)
    if "error" in order:
        return order
        
    evidence = order.get("evidence", {})
    customer_photo = evidence.get("customer_photo", False)
    receipt_photo = evidence.get("receipt_photo", False)
    driver_dropoff_photo = evidence.get("driver_dropoff_photo", False)
    merchant_receipt_match = evidence.get("merchant_receipt_match", False)
    
    missing_evidence = []
    if not customer_photo:
        missing_evidence.append("customer_photo (Ảnh món đã nhận của khách)")
    if not receipt_photo:
        missing_evidence.append("receipt_photo (Ảnh hóa đơn/tem dán trên túi)")
    if not driver_dropoff_photo:
        missing_evidence.append("driver_dropoff_photo (Ảnh giao hàng của tài xế)")
        
    return {
        "order_id": order_id,
        "customer_photo_present": customer_photo,
        "receipt_photo_present": receipt_photo,
        "driver_dropoff_photo_present": driver_dropoff_photo,
        "merchant_receipt_match": merchant_receipt_match,
        "missing_evidence": missing_evidence,
        "status": "checked",
        "has_sufficient_evidence": customer_photo and receipt_photo
    }
