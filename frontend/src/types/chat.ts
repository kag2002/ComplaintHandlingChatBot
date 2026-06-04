export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  latency_ms?: number;
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
}

export interface Session {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
}

export interface ChatResponseUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface ChatResponse {
  reply: string;
  model: string;
  usage: ChatResponseUsage;
  latency_ms: number;
}

// GrabFood Complaint Router Domain Types
export type IssueType =
  | "missing_item"
  | "wrong_item"
  | "damaged_or_spilled_item"
  | "not_received"
  | "refund_status"
  | "unclear";

export type RouteTo = "store" | "driver" | "customer_support" | "ask_customer";

export type Confidence = "high" | "medium" | "low";

export interface OrderItem {
  name: string;
  quantity: number;
}

export interface OrderEvidence {
  customer_photo: boolean;
  receipt_photo: boolean;
  driver_dropoff_photo?: boolean;
  merchant_receipt_match?: boolean;
}

export interface OrderData {
  order_id: string;
  order_status: "delivered" | "cancelled" | "in_progress";
  payment_status: "paid" | "refunded" | "pending";
  driver_status: "delivered" | "picked_up" | "not_assigned";
  delivery_status: "delivered" | "not_received_claim" | "unknown";
  merchant_name: string;
  customer_name: string;
  items: OrderItem[];
  evidence: OrderEvidence;
}

export interface TriageResult {
  issue_type: IssueType;
  summary: string;
  reported_items: string[];
  route_to: RouteTo;
  confidence: Confidence;
  missing_info: string[];
  questions_to_customer: string[];
  questions_to_store: string[];
  questions_to_driver: string[];
  handoff_required: boolean;
  handoff_reason: string;
  next_action: string;
  customer_message: string;
}

export interface DemoCase {
  id: string;
  label: string;
  orderId: string;
  complaint: string;
}

export interface EvalCase {
  id: string;
  name: string;
  orderId: string;
  complaint: string;
  expected: Pick<TriageResult, "issue_type" | "route_to" | "confidence">;
}

export interface EvalResultItem {
  id: string;
  name: string;
  order_id: string;
  complaint: string;
  expected: Pick<TriageResult, "issue_type" | "route_to" | "confidence">;
  actual_triage: Partial<TriageResult>;
  triage_called: boolean;
  hitl_called: boolean;
  routing_correct: boolean;
  type_correct: boolean;
  confidence_correct: boolean;
  guardrail_passed: boolean;
  guardrail_violations: string[];
  passed: boolean;
  failures: string[];
  assistant_text: string;
  latency_ms: number;
}
