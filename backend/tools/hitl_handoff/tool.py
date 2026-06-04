from __future__ import annotations

from typing import Any

def hitl_handoff(reason: str, next_action: str, ticket_details: dict[str, Any]) -> dict[str, Any]:
    """Chuyển giao khiếu nại sang bộ phận CSKH (Human-in-the-Loop) để duyệt thủ công."""
    return {
        "status": "handed_off",
        "reason": reason,
        "next_action": next_action,
        "ticket_details": ticket_details,
        "assigned_to": "customer_support",
        "review_required": True,
        "message": f"Hệ thống đã chuyển yêu cầu duyệt sang CSKH. Lý do: {reason}. Hành động tiếp theo: {next_action}."
    }
