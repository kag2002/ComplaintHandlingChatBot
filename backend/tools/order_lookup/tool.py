from __future__ import annotations

import json
from pathlib import Path
from typing import Any

ROOT = Path(__file__).parent.parent.parent
MOCK_ORDERS_PATH = ROOT / "data" / "mock_orders.json"

def order_lookup(order_id: str) -> dict[str, Any]:
    """Tra cứu thông tin chi tiết đơn hàng theo order_id."""
    if not MOCK_ORDERS_PATH.exists():
        return {"error": "mock_data_not_found", "message": "Không tìm thấy dữ liệu mock_orders.json"}
    
    try:
        with open(MOCK_ORDERS_PATH, "r", encoding="utf-8") as f:
            orders = json.load(f)
    except Exception as e:
        return {"error": "read_error", "message": f"Lỗi đọc dữ liệu: {str(e)}"}
        
    for order in orders:
        if order.get("order_id") == order_id:
            return {
                "order_id": order.get("order_id"),
                "order_status": order.get("order_status"),
                "payment_status": order.get("payment_status"),
                "driver_status": order.get("driver_status"),
                "delivery_status": order.get("delivery_status"),
                "merchant_name": order.get("merchant_name"),
                "customer_name": order.get("customer_name"),
                "items": order.get("items", []),
                "evidence": order.get("evidence", {})
            }
            
    return {"error": "order_not_found", "message": f"Không tìm thấy đơn hàng với mã {order_id}"}
