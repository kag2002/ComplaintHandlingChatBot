'use client';

import React, { useEffect, useState } from 'react';
import { fetchLogDetail } from '../../services/logsApi';
import {
  X,
  CheckCircle2,
  XCircle,
  Wrench,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface LogDetailProps {
  file: string;
  type: 'run' | 'transcript';
  onClose: () => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function RunDetail({ data }: { data: any }) {
  const [expandedCase, setExpandedCase] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const results: any[] = data.results ?? [];
  const summary = data.summary ?? {};

  return (
    <div className="space-y-4">
      {/* Summary header */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Cases', value: `${summary.passed_cases ?? 0}/${summary.measured_cases ?? 0}` },
          { label: 'Accuracy', value: `${Math.round((summary.case_accuracy ?? 0) * 100)}%` },
          { label: 'Routing', value: summary.tool_routing_accuracy != null ? `${Math.round(summary.tool_routing_accuracy * 100)}%` : '—' },
          { label: 'Args', value: summary.argument_accuracy != null ? `${Math.round(summary.argument_accuracy * 100)}%` : '—' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-[#0e1221]/80 border border-slate-800/50 rounded-xl p-3 text-center"
          >
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
              {stat.label}
            </div>
            <div className="text-lg font-bold text-slate-100">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Results table */}
      <div className="space-y-1">
        {results.map((item) => {
          const passed = item.result?.passed;
          const expanded = expandedCase === item.id;
          return (
            <div key={item.id} className="rounded-xl border border-slate-800/40 overflow-hidden">
              <button
                onClick={() => setExpandedCase(expanded ? null : item.id)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors"
              >
                {expanded ? (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                )}
                {passed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                )}
                <span className="text-xs font-mono text-slate-300 flex-1 text-left truncate">
                  {item.id}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    passed
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : 'bg-red-500/15 text-red-400'
                  }`}
                >
                  {passed ? 'PASS' : 'FAIL'}
                </span>
              </button>

              {expanded && (
                <div className="px-4 pb-4 pt-1 border-t border-slate-800/30 space-y-3">
                  {/* Input */}
                  <div>
                    <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">
                      Input
                    </div>
                    <p className="text-xs text-slate-300 bg-[#080b13]/60 rounded-lg p-2 font-mono">
                      {typeof item.input === 'string'
                        ? item.input
                        : JSON.stringify(item.input, null, 2)}
                    </p>
                  </div>

                  {/* Expected */}
                  <div>
                    <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">
                      Expected
                    </div>
                    <pre className="text-[10px] text-slate-400 bg-[#080b13]/60 rounded-lg p-2 overflow-x-auto max-h-32 custom-scrollbar">
                      {JSON.stringify(item.expect, null, 2)}
                    </pre>
                  </div>

                  {/* Actual Tool Calls */}
                  {item.result?.actual_tool_calls?.length > 0 && (
                    <div>
                      <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">
                        Actual Tool Calls
                      </div>
                      <div className="space-y-1">
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {item.result.actual_tool_calls.map((tc: any, i: number) => (
                          <div
                            key={i}
                            className="flex items-start gap-2 bg-[#080b13]/60 rounded-lg p-2"
                          >
                            <Wrench className="w-3 h-3 text-violet-400 mt-0.5 shrink-0" />
                            <div>
                              <span className="text-[10px] font-semibold text-violet-300">
                                {tc.name}
                              </span>
                              <pre className="text-[9px] text-slate-500 mt-0.5">
                                {JSON.stringify(tc.args, null, 2)}
                              </pre>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Failures */}
                  {item.result?.failures?.length > 0 && (
                    <div>
                      <div className="text-[9px] text-red-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Failures
                      </div>
                      <ul className="space-y-0.5">
                        {item.result.failures.map((f: string, i: number) => (
                          <li
                            key={i}
                            className="text-[10px] text-red-300 bg-red-500/5 rounded-md px-2 py-1 font-mono"
                          >
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TranscriptDetail({ data }: { data: any }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const turns: any[] = data.turns ?? [];

  return (
    <div className="space-y-3">
      {/* Meta */}
      <div className="flex flex-wrap gap-2 text-[10px]">
        <span className="px-2 py-0.5 rounded-md bg-violet-600/20 text-violet-300 border border-violet-500/20 font-bold">
          {data.version}
        </span>
        <span className="px-2 py-0.5 rounded-md bg-slate-700/30 text-slate-300 border border-slate-700/20">
          {data.provider} / {data.model}
        </span>
        <span className="px-2 py-0.5 rounded-md bg-slate-700/30 text-slate-400 border border-slate-700/20">
          {turns.length} turns
        </span>
      </div>

      {/* Timeline */}
      <div className="relative pl-6 border-l-2 border-slate-800/60 space-y-4">
        {turns.map((turn, i) => (
          <div key={i} className="relative">
            {/* Dot */}
            <div className="absolute -left-[25px] top-1 w-3 h-3 rounded-full bg-violet-600 ring-2 ring-[#0b0f19]" />

            {/* Turn card */}
            <div className="bg-[#0e1221]/60 border border-slate-800/40 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-violet-300">
                  Turn {turn.turn_index ?? i + 1}
                </span>
                <span
                  className={`text-[9px] px-2 py-0.5 rounded-md font-medium ${
                    turn.status === 'answered'
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : 'bg-amber-500/15 text-amber-400'
                  }`}
                >
                  {turn.status}
                </span>
              </div>

              {/* User message */}
              <div className="flex items-start gap-2">
                <MessageSquare className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" />
                <p className="text-xs text-slate-300">{turn.user}</p>
              </div>

              {/* Tool Rounds */}
              {turn.rounds?.map(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (round: any, ri: number) =>
                  round.tool_calls?.length > 0 && (
                    <div key={ri} className="ml-5 space-y-1">
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {round.tool_calls.map((tc: any, ti: number) => (
                        <div
                          key={ti}
                          className="flex items-start gap-2 bg-[#080b13]/60 rounded-lg p-2"
                        >
                          <Wrench className="w-3 h-3 text-violet-400 mt-0.5 shrink-0" />
                          <div>
                            <span className="text-[10px] font-semibold text-violet-300">
                              {tc.name}
                            </span>
                            <pre className="text-[9px] text-slate-500 mt-0.5 max-h-20 overflow-auto custom-scrollbar">
                              {JSON.stringify(tc.args, null, 2)}
                            </pre>
                          </div>
                        </div>
                      ))}
                    </div>
                  ),
              )}

              {/* Assistant response */}
              {turn.assistant_text && (
                <div className="ml-5 bg-[#080b13]/40 rounded-lg p-2 border border-slate-800/30">
                  <p className="text-xs text-slate-300 whitespace-pre-wrap">
                    {turn.assistant_text}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export const LogDetail: React.FC<LogDetailProps> = ({
  file,
  type,
  onClose,
}) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchLogDetail(file)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [file]);

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end bg-black/60 backdrop-blur-sm">
      <div
        className="w-full max-w-2xl bg-[#0b0f19] border-l border-slate-800/60 flex flex-col animate-slide-in overflow-hidden"
        style={{
          animation: 'slideInRight 0.3s ease-out',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800/60 shrink-0">
          <h2 className="text-sm font-semibold text-slate-100">
            {type === 'run' ? 'Eval Run Detail' : 'Transcript Detail'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 text-slate-400 hover:text-slate-200 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
            </div>
          )}
          {error && (
            <div className="text-red-400 text-sm bg-red-500/10 p-4 rounded-xl border border-red-500/20">
              {error}
            </div>
          )}
          {data && !loading && (
            <>
              {type === 'run' ? (
                <RunDetail data={data} />
              ) : (
                <TranscriptDetail data={data} />
              )}
            </>
          )}
        </div>
      </div>

      {/* Slide-in animation */}
      <style jsx>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};
