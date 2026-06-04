from __future__ import annotations

from pathlib import Path
from typing import Any
import yaml

# Import our GrabFood tools
from .clarify.tool import ask_user
from .order_lookup.tool import order_lookup
from .evidence_check.tool import evidence_check
from .triage.tool import triage
from .hitl_handoff.tool import hitl_handoff

TOOL_FUNCTIONS = {
    "clarify": ask_user,
    "order_lookup": order_lookup,
    "evidence_check": evidence_check,
    "triage": triage,
    "hitl_handoff": hitl_handoff,
}

def load_tool_declarations(path: Path) -> list[dict[str, Any]]:
    return yaml.safe_load(Path(path).read_text(encoding="utf-8"))["tools"]

def to_openai_tools(declarations: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [{
        "type": "function",
        "function": {
            "name": item["name"],
            "description": item.get("description", ""),
            "parameters": item.get("parameters", {"type": "object", "properties": {}}),
        },
    } for item in declarations]
