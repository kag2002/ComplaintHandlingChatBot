from __future__ import annotations

import argparse
import json
import re
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Any

ROOT = Path(__file__).parent
if str(ROOT) not in sys.path:
    sys.path.append(str(ROOT))

from env_loader import load_lab_env
from providers import make_provider
from tools import load_tool_declarations, to_openai_tools
from chat import run_model_tool_loop

load_lab_env(ROOT)

def check_guardrails(text: str) -> list[str]:
    """Check text response against GrabFood safety policy guardrails.
    Returns list of violations.
    """
    violations = []
    text_lower = text.lower()
    
    # 1. Refund promises
    refund_promises = [
        "chắc chắn hoàn tiền", "chac chan hoan tien",
        "chắc chắn sẽ được hoàn", "chac chan se duoc hoan",
        "cam kết hoàn tiền", "cam ket hoan tien",
        "sẽ hoàn tiền 100%", "se hoan tien 100%",
        "chắc chắn nhận lại tiền", "chac chan nhan lai tien"
    ]
    for promise in refund_promises:
        if promise in text_lower:
            violations.append(f"Hứa hẹn hoàn tiền chắc chắn: '{promise}'")
            break
            
    # 2. Blame attribution
    blame_terms = [
        "lỗi do tài xế", "loi do tai xe",
        "lỗi tại tài xế", "loi tai tai xe",
        "lỗi của tài xế", "loi cua tai xe",
        "tài xế giao nhầm", "tai xe giao nham",
        "lỗi do cửa hàng", "loi do cua hang",
        "lỗi tại cửa hàng", "loi tai cua hang",
        "lỗi của cửa hàng", "loi cua cua hang",
        "cửa hàng chuẩn bị thiếu", "cua hang chuan bi thieu",
        "cửa hàng đóng gói sai", "cua hang dong goi sai"
    ]
    for term in blame_terms:
        if term in text_lower:
            violations.append(f"Quy trách nhiệm/Đổ lỗi: '{term}'")
            break
            
    return violations

def run_evaluation(provider_name: str, model_name: str | None = None) -> dict[str, Any]:
    system_prompt_path = ROOT / "artifacts" / "system_prompt.md"
    tools_path = ROOT / "artifacts" / "tools.yaml"
    eval_cases_path = ROOT / "data" / "eval_cases.json"
    
    if not eval_cases_path.exists():
        raise FileNotFoundError(f"Không tìm thấy file eval cases: {eval_cases_path}")
        
    system_prompt = system_prompt_path.read_text(encoding="utf-8")
    tool_declarations = load_tool_declarations(tools_path)
    openai_tools = to_openai_tools(tool_declarations)
    
    provider = make_provider(provider_name)
    selected_model = model_name or getattr(provider, "default_model", None)
    
    with open(eval_cases_path, "r", encoding="utf-8") as f:
        cases = json.load(f)
        
    results = []
    passed_cases = 0
    guardrail_violations_count = 0
    
    for case in cases:
        case_id = case["id"]
        name = case["name"]
        order_id = case["orderId"]
        complaint = case["complaint"]
        expected = case["expected"]
        
        print(f"Running eval case: {case_id} ({name})...")
        
        # Build message history for the agent
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Đơn hàng: {order_id}. Khiếu nại: {complaint}"}
        ]
        
        start_time = time.time()
        loop_res = run_model_tool_loop(
            provider=provider,
            messages=messages,
            tools=openai_tools,
            model=selected_model,
            max_tool_rounds=4
        )
        latency_ms = (time.time() - start_time) * 1000
        
        # Extract triage result
        actual_triage = {}
        triage_called = False
        hitl_called = False
        
        for event in loop_res.get("tool_events", []):
            if event.get("tool") == "triage":
                triage_called = True
                actual_triage = event.get("result", {})
            elif event.get("tool") == "hitl_handoff":
                hitl_called = True
                
        # If triage was not called as a tool (e.g. model output final reply immediately),
        # try to parse from the assistant text if it wrote JSON
        assistant_text = loop_res.get("assistant_text", "")
        if not triage_called:
            try:
                # Look for JSON structure in reply
                json_match = re.search(r"\{.*\}", assistant_text, re.DOTALL)
                if json_match:
                    actual_triage = json.loads(json_match.group(0))
                    triage_called = True
            except Exception:
                pass
                
        # Compare actual vs expected
        routing_correct = True
        type_correct = True
        confidence_correct = True
        
        failures = []
        if triage_called:
            act_type = actual_triage.get("issue_type")
            act_route = actual_triage.get("route_to")
            act_conf = actual_triage.get("confidence")
            
            exp_type = expected.get("issue_type")
            exp_route = expected.get("route_to")
            exp_conf = expected.get("confidence")
            
            if act_type != exp_type:
                type_correct = False
                failures.append(f"issue_type: expected '{exp_type}', got '{act_type}'")
            if act_route != exp_route:
                routing_correct = False
                failures.append(f"route_to: expected '{exp_route}', got '{act_route}'")
            if act_conf != exp_conf:
                confidence_correct = False
                failures.append(f"confidence: expected '{exp_conf}', got '{act_conf}'")
        else:
            routing_correct = False
            type_correct = False
            confidence_correct = False
            failures.append("Triage tool was not called and no triage JSON found in response.")
            
        # Check guardrails
        violations = check_guardrails(assistant_text)
        guardrail_passed = len(violations) == 0
        if not guardrail_passed:
            guardrail_violations_count += 1
            failures.extend(violations)
            
        case_passed = routing_correct and type_correct and confidence_correct and guardrail_passed
        if case_passed:
            passed_cases += 1
            
        results.append({
            "id": case_id,
            "name": name,
            "order_id": order_id,
            "complaint": complaint,
            "expected": expected,
            "actual_triage": actual_triage,
            "triage_called": triage_called,
            "hitl_called": hitl_called,
            "routing_correct": routing_correct,
            "type_correct": type_correct,
            "confidence_correct": confidence_correct,
            "guardrail_passed": guardrail_passed,
            "guardrail_violations": violations,
            "passed": case_passed,
            "failures": failures,
            "assistant_text": assistant_text,
            "latency_ms": latency_ms,
            "rounds": loop_res.get("rounds", [])
        })
        
    summary = {
        "total_cases": len(cases),
        "passed_cases": passed_cases,
        "accuracy": round(passed_cases / len(cases), 4) if cases else 0.0,
        "guardrail_violations_count": guardrail_violations_count,
        "run_at": datetime.now().isoformat()
    }
    
    return {
        "summary": summary,
        "results": results
    }

def main() -> None:
    parser = argparse.ArgumentParser(description="Run GrabFood complaint agent evaluations.")
    parser.add_argument("--provider", default="openrouter", choices=["openrouter", "openai", "anthropic", "gemini"])
    parser.add_argument("--model", default=None)
    args = parser.parse_args()
    
    try:
        eval_res = run_evaluation(args.provider, args.model)
        summary = eval_res["summary"]
        results = eval_res["results"]
        
        print("\n=== EVALUATION RESULTS ===")
        for r in results:
            status = "PASS" if r["passed"] else "FAIL"
            print(f"[{status}] {r['id']} - {r['name']}")
            if not r["passed"]:
                for f in r["failures"]:
                    print(f"  -> {f}")
                    
        print("\n=== SUMMARY ===")
        print(f"Total cases: {summary['total_cases']}")
        print(f"Passed cases: {summary['passed_cases']}")
        print(f"Accuracy: {summary['accuracy'] * 100}%")
        print(f"Guardrail Violations: {summary['guardrail_violations_count']}")
        
        # Save run log
        runs_dir = ROOT / "runs"
        runs_dir.mkdir(exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%dT%H%M%S")
        run_file = runs_dir / f"eval_{args.provider}_{timestamp}.json"
        
        run_data = {
            "run_id": f"eval_{args.provider}_{timestamp}",
            "provider": args.provider,
            "model": args.model,
            "summary": summary,
            "results": results
        }
        run_file.write_text(json.dumps(run_data, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"\nSaved eval log to: {run_file}")
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
