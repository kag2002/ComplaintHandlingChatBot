const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '';

export interface RunSummary {
  file: string;
  run_id: string;
  version: string;
  artifact_version?: string;
  suite: string;
  provider: string;
  model: string;
  generated_at: string;
  summary: {
    total_cases: number;
    measured_cases: number;
    provider_error_cases: number;
    passed_cases: number;
    case_accuracy: number;
    tool_routing_accuracy?: number;
    argument_accuracy?: number;
    multiturn_accuracy?: number | null;
    failure_counts?: Record<string, number>;
    observed_mismatch_counts?: Record<string, number>;
  };
}

export interface TranscriptSummary {
  file: string;
  transcript_id: string;
  version: string;
  provider: string;
  model: string;
  created_at: string;
  turn_count: number;
}

export async function fetchRuns(): Promise<RunSummary[]> {
  const res = await fetch(`${API_BASE}/api/logs/runs`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch runs: ${res.status}`);
  const data = await res.json();
  return data.runs ?? [];
}

export async function fetchTranscripts(): Promise<TranscriptSummary[]> {
  const res = await fetch(`${API_BASE}/api/logs/transcripts`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch transcripts: ${res.status}`);
  const data = await res.json();
  return data.transcripts ?? [];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function fetchLogDetail(file: string): Promise<any> {
  const res = await fetch(`${API_BASE}/api/logs/detail?file=${encodeURIComponent(file)}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch log detail: ${res.status}`);
  return res.json();
}

