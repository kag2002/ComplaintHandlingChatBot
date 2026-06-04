from __future__ import annotations

import unicodedata
from typing import Any

CUSTOMER_CLARIFYING_QUESTIONS = [
    "Đơn gặp lỗi gì: thiếu món, sai món, món bị đổ/hỏng, chưa nhận được đơn, hay chưa nhận hoàn tiền?",
    "Bạn có thể gửi ảnh món đã nhận hoặc ảnh hóa đơn/tem đơn không?"
]

def normalize(text: str) -> str:
    text = text.lower()
    # Normalize unicode to separate base characters and diacritics
    normalized = unicodedata.normalize("NFD", text)
    # Filter out diacritics
    cleaned = "".join([c for c in normalized if unicodedata.category(c) != "Mn"])
    return cleaned.replace("đ", "d")

def has_any(normalized_text: str, keywords: list[str]) -> bool:
    return any(normalize(keyword) in normalized_text for keyword in keywords)

def extract_reported_items(complaint_text: str, order_data: dict[str, Any]) -> list[str]:
    normalized_text = normalize(complaint_text)
    items = order_data.get("items", [])
    return [item["name"] for item in items if normalize(item["name"]) in normalized_text]

def extract_missing_items(complaint_text: str, order_data: dict[str, Any]) -> list[str]:
    normalized_text = normalize(complaint_text)
    missing_markers = ["thieu", "khong co", "mat mon"]
    matched = []
    
    for item in order_data.get("items", []):
        item_name = normalize(item["name"])
        item_index = normalized_text.find(item_name)
        if item_index < 0:
            continue
            
        for marker in missing_markers:
            marker_index = normalized_text.find(marker)
            if marker_index < 0:
                continue
                
            segment = normalized_text[marker_index:item_index]
            same_sentence = not any(c in segment for c in [".", "!", "?", "\n"])
            if item_index >= marker_index and item_index - marker_index <= 60 and same_sentence:
                matched.append(item["name"])
                break
                
    return matched

def evidence_missing(order_data: dict[str, Any]) -> list[str]:
    missing = []
    evidence = order_data.get("evidence", {})
    if not evidence.get("customer_photo", False):
        missing.append("customer_photo")
    if not evidence.get("receipt_photo", False):
        missing.append("receipt_photo")
    return missing

def build_summary(issue_label: str, complaint_text: str, order_data: dict[str, Any]) -> str:
    return f"{issue_label} cho đơn {order_data.get('order_id')}: {complaint_text.strip()}"

def triage(complaint_text: str, order_data: dict[str, Any]) -> dict[str, Any]:
    """Phân loại tự động khiếu nại (rule-based triage)."""
    normalized_text = normalize(complaint_text)
    reported_items = extract_reported_items(complaint_text, order_data)
    missing_evidence = evidence_missing(order_data)
    
    asks_refund = has_any(normalized_text, ["hoàn tiền", "refund", "trả tiền", "hoan tien"])
    vague_complaint = has_any(normalized_text, ["đơn lỗi", "don loi", "có vấn đề", "co van de", "lỗi rồi", "loi roi"])
    missing_item = has_any(normalized_text, ["thiếu", "thieu", "không có", "khong co", "mất món", "mat mon"])
    wrong_item = has_any(normalized_text, [
        "sai món", "sai mon", "nhầm món", "nham mon", "khác món", "khac mon",
        "món khác", "mon khac", "nhận thành", "nhan thanh"
    ])
    damaged = has_any(normalized_text, [
        "bị đổ", "bi do", "đổ ra", "do ra", "đổ hết", "do het", "vỡ", "vo",
        "hỏng", "hong", "rách", "rach", "bung", "tràn", "tran"
    ])
    not_received = has_any(normalized_text, ["chưa nhận", "chua nhan", "không nhận", "khong nhan", "không thấy đơn", "khong thay don"])
    
    # 1. Unclear Complaint + Asks Refund
    if (vague_complaint and asks_refund) or (not missing_item and not wrong_item and not damaged and not not_received and asks_refund):
        return {
            "issue_type": "unclear",
            "summary": build_summary("Khiếu nại chưa đủ rõ", complaint_text, order_data),
            "reported_items": reported_items,
            "route_to": "ask_customer",
            "confidence": "low",
            "missing_info": ["issue_detail", "customer_photo_or_receipt"],
            "questions_to_customer": CUSTOMER_CLARIFYING_QUESTIONS,
            "questions_to_store": [],
            "questions_to_driver": [],
            "handoff_required": False,
            "handoff_reason": "Input chưa đủ rõ để tạo ticket cuối hoặc route sang một bên cụ thể.",
            "next_action": "ask_customer_for_issue_detail_and_evidence",
            "customer_message": "Mình cần thêm thông tin để hỗ trợ đúng vấn đề. Đơn của bạn gặp lỗi gì: thiếu món, sai món, món bị đổ/hỏng, chưa nhận được đơn, hay đang chờ hoàn tiền? Nếu có thể, bạn hãy gửi thêm ảnh món đã nhận hoặc ảnh hóa đơn/tem đơn."
        }
        
    # 2. Missing Item
    if missing_item and order_data.get("order_status") == "delivered":
        missing_reported_items = extract_missing_items(complaint_text, order_data)
        confidence = "high" if (len(missing_evidence) == 0 and len(reported_items) > 0) else "medium"
        item_label = (missing_reported_items[0] if len(missing_reported_items) > 0 else (reported_items[0] if len(reported_items) > 0 else "món trong đơn"))
        return {
            "issue_type": "missing_item",
            "summary": build_summary("Khách báo thiếu món", complaint_text, order_data),
            "reported_items": missing_reported_items if len(missing_reported_items) > 0 else reported_items,
            "route_to": "store",
            "confidence": confidence,
            "missing_info": missing_evidence,
            "questions_to_customer": CUSTOMER_CLARIFYING_QUESTIONS[1:] if len(missing_evidence) > 0 else [],
            "questions_to_store": ["Cửa hàng vui lòng xác nhận đơn này đã được đóng đủ các món trong hóa đơn chưa?"],
            "questions_to_driver": [],
            "handoff_required": True,
            "handoff_reason": "Store needs to confirm packing status before CSKH review",
            "next_action": "ask_store_to_confirm_packing",
            "customer_message": f"Mình đã ghi nhận khiếu nại thiếu {item_label} trong đơn {order_data.get('order_id')}. Cửa hàng sẽ được yêu cầu xác nhận tình trạng đóng gói. Yêu cầu này sẽ được CSKH kiểm tra trước khi có phương án hỗ trợ tiếp theo."
        }
        
    # 3. Wrong Item
    if wrong_item:
        customer_photo = order_data.get("evidence", {}).get("customer_photo", False)
        return {
            "issue_type": "wrong_item",
            "summary": build_summary("Khách báo nhận sai món", complaint_text, order_data),
            "reported_items": reported_items,
            "route_to": "store",
            "confidence": "medium" if customer_photo else "low",
            "missing_info": ["receipt_photo_if_available"] if customer_photo else ["customer_photo", "receipt_photo_if_available"],
            "questions_to_customer": ["Bạn có thể gửi ảnh món đã nhận và ảnh hóa đơn/tem đơn nếu có không?"],
            "questions_to_store": ["Cửa hàng vui lòng kiểm tra món đã chuẩn bị so với hóa đơn của đơn này."],
            "questions_to_driver": [],
            "handoff_required": True,
            "handoff_reason": "Store needs to compare prepared item with receipt before CSKH review",
            "next_action": "ask_store_to_check_wrong_item",
            "customer_message": f"Mình đã ghi nhận phản ánh nhận sai món cho đơn {order_data.get('order_id')}. Cần cửa hàng xác nhận thông tin chuẩn bị món và CSKH sẽ kiểm tra trước khi có hướng hỗ trợ."
        }
        
    # 4. Not Received
    if not_received and order_data.get("order_status") == "delivered":
        driver_dropoff_photo = order_data.get("evidence", {}).get("driver_dropoff_photo", False)
        return {
            "issue_type": "not_received",
            "summary": build_summary("Khách báo chưa nhận đơn nhưng hệ thống đã giao", complaint_text, order_data),
            "reported_items": reported_items,
            "route_to": "customer_support",
            "confidence": "medium",
            "missing_info": ["customer_confirmation"] if driver_dropoff_photo else ["driver_dropoff_photo", "customer_confirmation"],
            "questions_to_customer": ["Bạn có thể xác nhận địa chỉ/điểm nhận và thời điểm bạn kiểm tra đơn không?"],
            "questions_to_store": [],
            "questions_to_driver": ["Tài xế vui lòng xác nhận thời điểm và địa điểm giao đơn, kèm bằng chứng giao nếu có."],
            "handoff_required": True,
            "handoff_reason": "Order status conflicts with customer claim; CSKH must review without assigning fault",
            "next_action": "customer_support_review_delivery_conflict",
            "customer_message": f"Mình đã ghi nhận việc bạn chưa nhận được đơn {order_data.get('order_id')} trong khi hệ thống đang hiển thị đã giao. CSKH sẽ kiểm tra cùng thông tin từ tài xế và bằng chứng giao hàng trước khi phản hồi tiếp theo."
        }
        
    # 5. Damaged or Spilled
    if damaged:
        packaging_related = has_any(normalized_text, ["hộp bung", "hop bung", "đóng gói", "dong goi", "nắp", "nap"])
        delivery_related = has_any(normalized_text, ["túi rách", "tui rach", "giao đổ", "giao do", "nghiêng", "nghieng"])
        route_to = "store" if packaging_related else ("driver" if delivery_related else "customer_support")
        
        customer_photo = order_data.get("evidence", {}).get("customer_photo", False)
        return {
            "issue_type": "damaged_or_spilled_item",
            "summary": build_summary("Khách báo món bị đổ/hỏng", complaint_text, order_data),
            "reported_items": reported_items,
            "route_to": route_to,
            "confidence": "low" if route_to == "customer_support" else "medium",
            "missing_info": [] if customer_photo else ["customer_photo"],
            "questions_to_customer": [] if customer_photo else ["Bạn có thể gửi ảnh tình trạng món/túi/hộp khi nhận không?"],
            "questions_to_store": ["Cửa hàng vui lòng xác nhận tình trạng đóng gói của đơn này."] if route_to == "store" else [],
            "questions_to_driver": ["Tài xế vui lòng xác nhận tình trạng túi/hộp khi giao đơn."] if route_to == "driver" else [],
            "handoff_required": True,
            "handoff_reason": "Damaged/spilled complaint needs human confirmation before any support decision",
            "next_action": "customer_support_review_damage_claim" if route_to == "customer_support" else f"ask_{route_to}_to_confirm_condition",
            "customer_message": f"Mình đã ghi nhận phản ánh món bị đổ/hỏng trong đơn {order_data.get('order_id')}. Thông tin này cần được xác nhận thêm trước khi CSKH đề xuất phương án hỗ trợ."
        }
        
    # 6. Refund Status
    if asks_refund:
        return {
            "issue_type": "refund_status",
            "summary": build_summary("Khách hỏi trạng thái hoàn tiền", complaint_text, order_data),
            "reported_items": reported_items,
            "route_to": "customer_support",
            "confidence": "medium",
            "missing_info": ["refund_request_context"],
            "questions_to_customer": ["Bạn đang hỏi trạng thái yêu cầu hỗ trợ nào, hoặc đơn gặp vấn đề gì cần CSKH kiểm tra?"],
            "questions_to_store": [],
            "questions_to_driver": [],
            "handoff_required": True,
            "handoff_reason": "Money-related support needs CSKH review and cannot be promised automatically",
            "next_action": "customer_support_review_refund_status",
            "customer_message": f"Mình sẽ chuyển yêu cầu liên quan hoàn tiền của đơn {order_data.get('order_id')} để CSKH kiểm tra. Mình chưa thể xác nhận kết quả hoàn tiền cho đến khi yêu cầu được xem xét."
        }
        
    # Default: Unclear
    return {
        "issue_type": "unclear",
        "summary": build_summary("Khiếu nại chưa phân loại được", complaint_text, order_data),
        "reported_items": reported_items,
        "route_to": "ask_customer",
        "confidence": "low",
        "missing_info": ["issue_detail"],
        "questions_to_customer": CUSTOMER_CLARIFYING_QUESTIONS,
        "questions_to_store": [],
        "questions_to_driver": [],
        "handoff_required": False,
        "handoff_reason": "Complaint text does not contain enough signal for a safe route.",
        "next_action": "ask_customer_for_issue_detail",
        "customer_message": "Mình cần thêm thông tin để hỗ trợ đúng vấn đề. Đơn của bạn gặp lỗi gì: thiếu món, sai món, món bị đổ/hỏng, chưa nhận được đơn, hay đang chờ hoàn tiền?"
    }
