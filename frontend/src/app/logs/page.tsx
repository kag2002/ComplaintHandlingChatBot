'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  fetchRuns,
  fetchTranscripts,
  fetchMonitoringTools,
  fetchMonitoringGuardrails,
  fetchMonitoringTestCases,
  RunSummary,
  TranscriptSummary,
  ToolDeclaration,
  GuardrailsResponse,
  TestCase,
} from '../../services/logsApi';
import { RunCard } from '../../components/logs/RunCard';
import { TranscriptCard } from '../../components/logs/TranscriptCard';
import { LogDetail } from '../../components/logs/LogDetail';
import { VersionCompare } from '../../components/logs/VersionCompare';
import {
  FlaskConical,
  MessageSquareText,
  RefreshCw,
  Loader2,
  ArrowLeft,
  GitCompareArrows,
  Inbox,
  Wrench,
  ShieldCheck,
  ShieldAlert,
  ScrollText,
  ClipboardList,
  Terminal,
} from 'lucide-react';
import Link from 'next/link';

type Tab = 'runs' | 'transcripts' | 'tools' | 'guardrails' | 'test-cases';

export default function LogsPage() {
  const [tab, setTab] = useState<Tab>('runs');
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [transcripts, setTranscripts] = useState<TranscriptSummary[]>([]);
  const [tools, setTools] = useState<ToolDeclaration[]>([]);
  const [guardrails, setGuardrails] = useState<GuardrailsResponse | null>(null);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [runningEval, setRunningEval] = useState(false);

  // Detail panel
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<'run' | 'transcript'>('run');

  // Comparison
  const [compareSet, setCompareSet] = useState<RunSummary[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [r, t] = await Promise.all([fetchRuns(), fetchTranscripts()]);
      setRuns(r);
      setTranscripts(t);
      
      // Load monitoring data in background or catch errors separately so page still works if one fails
      try {
        const tls = await fetchMonitoringTools();
        setTools(tls);
      } catch (err) {
        console.error("Failed to load tools", err);
      }
      
      try {
        const g = await fetchMonitoringGuardrails();
        setGuardrails(g);
      } catch (err) {
        console.error("Failed to load guardrails", err);
      }
      
      try {
        const tc = await fetchMonitoringTestCases();
        setTestCases(tc);
      } catch (err) {
        console.error("Failed to load test cases", err);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load logs');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRunEval = async () => {
    setRunningEval(true);
    setError(null);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/evals/run', { method: 'POST' });
      if (!res.ok) {
        throw new Error('Chạy evaluation thất bại');
      }
      await loadData();
    } catch (e: any) {
      setError(e.message || 'Lỗi chạy evaluation');
    } finally {
      setRunningEval(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleCompare = (run: RunSummary) => {
    setCompareSet((prev) => {
      const exists = prev.find((r) => r.run_id === run.run_id);
      if (exists) return prev.filter((r) => r.run_id !== run.run_id);
      if (prev.length >= 2) return [prev[1], run];
      return [...prev, run];
    });
  };

  return (
    <div className="h-full flex flex-col bg-[#080b13]">
      {/* Top Nav Bar */}
      <header className="shrink-0 border-b border-slate-800/60 bg-[#0b0f19]/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/chat"
              className="p-2 hover:bg-white/5 text-slate-400 hover:text-slate-200 rounded-lg transition-colors"
              title="Quay lại Chat"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-sm font-semibold text-slate-100 tracking-wide flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              GrabFood Complaint Router - Monitoring
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRunEval}
              disabled={runningEval || loading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 rounded-lg shadow transition-all font-semibold"
            >
              {runningEval ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Đang chạy Eval...
                </>
              ) : (
                <>
                  <FlaskConical className="w-3.5 h-3.5" />
                  Chạy Evaluation
                </>
              )}
            </button>
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded-lg border border-slate-800/40 transition-all font-semibold"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="shrink-0 border-b border-slate-800/40 bg-[#0b0f19]/40">
        <div className="max-w-6xl mx-auto px-6 flex items-center gap-1 overflow-x-auto no-scrollbar">
          {[
            { key: 'runs' as Tab, label: 'Lịch sử Evals', icon: FlaskConical, count: runs.length },
            { key: 'transcripts' as Tab, label: 'Lịch sử Chat', icon: MessageSquareText, count: transcripts.length },
            { key: 'tools' as Tab, label: 'Các Tool hiện có', icon: Wrench, count: tools.length },
            { key: 'guardrails' as Tab, label: 'Các Guardrails', icon: ShieldCheck, count: guardrails ? 1 : 0 },
            { key: 'test-cases' as Tab, label: 'Kịch bản Test', icon: ClipboardList, count: testCases.length },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-medium transition-all duration-200 border-b-2 whitespace-nowrap ${
                tab === t.key
                  ? 'text-violet-300 border-violet-500'
                  : 'text-slate-500 border-transparent hover:text-slate-300 hover:border-slate-700'
              }`}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
              {t.count > 0 && (
                <span
                  className={`px-1.5 py-0.5 text-[9px] font-bold rounded-full ${
                    tab === t.key
                      ? 'bg-violet-500/20 text-violet-300'
                      : 'bg-slate-800/50 text-slate-500'
                  }`}
                >
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-6xl mx-auto p-6 space-y-6">
          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
            </div>
          )}

          {/* Comparison panel */}
          {compareSet.length === 2 && tab === 'runs' && (
            <VersionCompare
              runA={compareSet[0]}
              runB={compareSet[1]}
              onClose={() => setCompareSet([])}
            />
          )}

          {/* Compare hint */}
          {tab === 'runs' && runs.length >= 2 && compareSet.length < 2 && (
            <div className="flex items-center gap-2 text-[10px] text-slate-500 bg-slate-800/20 border border-slate-800/30 rounded-xl px-4 py-2.5">
              <GitCompareArrows className="w-3.5 h-3.5 text-cyan-400" />
              Click &quot;Compare&quot; on any 2 cards to compare versions
              {compareSet.length === 1 && (
                <span className="ml-2 text-cyan-400 font-medium">
                  (1 selected — pick one more)
                </span>
              )}
            </div>
          )}

          {/* Runs Grid */}
          {!loading && tab === 'runs' && (
            <>
              {runs.length === 0 ? (
                <EmptyState
                  message="No eval runs found."
                  hint="Run `python run_eval.py --provider openrouter` to generate one."
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {runs.map((run, i) => (
                    <RunCard
                      key={run.run_id}
                      run={run}
                      index={runs.length - i}
                      isSelected={selectedFile === run.file}
                      onSelect={(r) => {
                        setSelectedFile(r.file);
                        setSelectedType('run');
                      }}
                      onToggleCompare={handleToggleCompare}
                      isComparing={!!compareSet.find((c) => c.run_id === run.run_id)}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Transcripts Grid */}
          {!loading && tab === 'transcripts' && (
            <>
              {transcripts.length === 0 ? (
                <EmptyState
                  message="No transcripts found."
                  hint="Chat with the agent to generate transcripts."
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {transcripts.map((t, i) => (
                    <TranscriptCard
                      key={t.transcript_id}
                      transcript={t}
                      index={transcripts.length - i}
                      isSelected={selectedFile === t.file}
                      onSelect={(tr) => {
                        setSelectedFile(tr.file);
                        setSelectedType('transcript');
                      }}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Tools Grid */}
          {!loading && tab === 'tools' && (
            <ToolsView tools={tools} />
          )}

          {/* Guardrails View */}
          {!loading && tab === 'guardrails' && (
            <GuardrailsView guardrails={guardrails} />
          )}

          {/* Test Cases View */}
          {!loading && tab === 'test-cases' && (
            <TestCasesView testCases={testCases} />
          )}
        </div>
      </main>

      {/* Detail Drawer */}
      {selectedFile && (
        <LogDetail
          file={selectedFile}
          type={selectedType}
          onClose={() => setSelectedFile(null)}
        />
      )}
    </div>
  );
}

function EmptyState({ message, hint }: { message: string; hint: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="p-4 bg-slate-800/20 rounded-2xl border border-slate-800/30 mb-4">
        <Inbox className="w-10 h-10 text-slate-600" />
      </div>
      <p className="text-sm text-slate-400 font-medium">{message}</p>
      <p className="text-[11px] text-slate-500 mt-1 max-w-md font-mono">{hint}</p>
    </div>
  );
}

function ToolsView({ tools }: { tools: ToolDeclaration[] }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-slate-200">Danh sách các Công cụ (Tools)</h2>
        <p className="text-xs text-slate-400">Các công cụ mà AI Agent có thể sử dụng để tra cứu và xử lý khiếu nại.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tools.map((tool) => (
          <div key={tool.name} className="flex flex-col bg-[#0b0f19]/60 border border-slate-800/60 rounded-2xl p-5 hover:border-slate-700/80 transition-all duration-200 shadow-lg">
            <div className="flex items-center gap-2 mb-3">
              <span className="p-1.5 bg-violet-500/10 text-violet-300 rounded-lg border border-violet-500/20">
                <Terminal className="w-4 h-4" />
              </span>
              <h3 className="font-mono text-sm font-bold text-violet-300">{tool.name}</h3>
            </div>
            
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">{tool.description}</p>

            <div className="border-t border-slate-800/60 pt-4 mt-auto">
              <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Tham số (Parameters):</h4>
              {tool.parameters.properties && Object.keys(tool.parameters.properties).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(tool.parameters.properties).map(([name, prop]) => {
                    const isRequired = tool.parameters.required?.includes(name);
                    return (
                      <div key={name} className="bg-slate-900/40 border border-slate-800/40 rounded-xl p-3 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono font-bold text-slate-300">{name}</span>
                          <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-slate-800 text-slate-400 rounded">
                              {prop.type}
                            </span>
                            {isRequired && (
                              <span className="px-1.5 py-0.5 text-[9px] font-bold bg-red-500/10 text-red-400 border border-red-500/20 rounded">
                                Bắt buộc
                              </span>
                            )}
                          </div>
                        </div>
                        {prop.description && (
                          <p className="text-slate-400 text-[11px] leading-relaxed mt-1">{prop.description}</p>
                        )}
                        {prop.enum && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {prop.enum.map((val) => (
                              <span key={val} className="px-1.5 py-0.5 text-[9px] font-mono bg-violet-950/20 text-violet-300 border border-violet-800/30 rounded">
                                {val}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-slate-500 text-[11px] italic">Không yêu cầu tham số.</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GuardrailsView({ guardrails }: { guardrails: GuardrailsResponse | null }) {
  if (!guardrails) return null;

  const lines = guardrails.guardrails.split('\n');
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-slate-200">Chính sách An toàn & Guardrails</h2>
        <p className="text-xs text-slate-400">Các quy tắc an toàn nghiêm ngặt mà AI Agent bắt buộc phải tuân thủ để tránh bồi hoàn sai và đổ lỗi.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#0b0f19]/60 border border-slate-800/60 rounded-2xl p-6 shadow-lg leading-relaxed">
            <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800/60 pb-3 mb-4 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Chi tiết Quy tắc An toàn và Bảo vệ
            </h3>
            
            <div className="space-y-4 text-xs text-slate-300">
              {lines.map((line, idx) => {
                if (line.startsWith('###')) {
                  return (
                    <h4 key={idx} className="text-xs font-bold text-violet-300 pt-2 uppercase tracking-wide">
                      {line.replace('###', '').trim()}
                    </h4>
                  );
                }
                if (line.trim().startsWith('- **')) {
                  const boldPart = line.match(/\*\*(.*?)\*\*/)?.[1] || '';
                  const rest = line.replace(`- **${boldPart}**`, '').replace(/^[-\s*]+/, '').trim();
                  
                  let bgClass = "bg-slate-900/40 border-slate-800/40";
                  let iconColor = "text-violet-400";
                  if (boldPart.includes("KHÔNG hứa hoàn tiền")) {
                    bgClass = "bg-amber-500/5 border-amber-500/20";
                    iconColor = "text-amber-400";
                  } else if (boldPart.includes("KHÔNG quy kết trách nhiệm")) {
                    bgClass = "bg-red-500/5 border-red-500/20";
                    iconColor = "text-red-400";
                  } else if (boldPart.includes("Chưa nhận được hàng")) {
                    bgClass = "bg-cyan-500/5 border-cyan-500/20";
                    iconColor = "text-cyan-400";
                  }

                  return (
                    <div key={idx} className={`p-4 border rounded-xl ${bgClass} flex gap-3`}>
                      <span className={`shrink-0 mt-0.5 ${iconColor}`}>
                        <ShieldAlert className="w-4 h-4" />
                      </span>
                      <div>
                        <strong className="text-slate-100 block mb-1">{boldPart}</strong>
                        <span className="text-slate-350">{rest}</span>
                      </div>
                    </div>
                  );
                }

                if (line.trim()) {
                  return (
                    <p key={idx} className="pl-7 text-slate-300">
                      {line.replace(/^[-\s*]+/, '').trim()}
                    </p>
                  );
                }
                return null;
              })}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[#0b0f19]/60 border border-slate-800/60 rounded-2xl p-6 shadow-lg flex flex-col h-[500px]">
            <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800/60 pb-3 mb-4 flex items-center gap-2">
              <ScrollText className="w-4 h-4 text-violet-400" />
              Xem Toàn bộ System Prompt
            </h3>
            <div className="flex-1 overflow-y-auto bg-slate-950/60 border border-slate-900 rounded-xl p-4 font-mono text-[10px] text-slate-400 custom-scrollbar whitespace-pre-wrap leading-relaxed select-all">
              {guardrails.system_prompt}
            </div>
            <p className="text-[10px] text-slate-500 mt-2 italic text-center">Click đúp hoặc kéo chuột để sao chép prompt.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function TestCasesView({ testCases }: { testCases: TestCase[] }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-slate-200">Kịch bản Test (Eval Test Cases)</h2>
        <p className="text-xs text-slate-400">Các kịch bản khiếu nại mô phỏng được định nghĩa trước để đánh giá năng lực của AI Agent.</p>
      </div>

      <div className="bg-[#0b0f19]/60 border border-slate-800/60 rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-[#0d1424]/40 text-slate-400 font-semibold">
                <th className="p-4 w-1/5">Tên kịch bản</th>
                <th className="p-4 w-[12%]">Mã đơn hàng</th>
                <th className="p-4 w-2/5">Nội dung khiếu nại</th>
                <th className="p-4 w-[28%]">Kết quả kỳ vọng (Expected)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {testCases.map((tc) => {
                let badgeColor = "bg-slate-800 text-slate-300";
                if (tc.expected.issue_type === "missing_item") badgeColor = "bg-amber-500/10 text-amber-300 border border-amber-500/20";
                else if (tc.expected.issue_type === "not_received") badgeColor = "bg-red-500/10 text-red-300 border border-red-500/20";
                else if (tc.expected.issue_type === "wrong_item") badgeColor = "bg-blue-500/10 text-blue-300 border border-blue-500/20";
                else if (tc.expected.issue_type === "unclear") badgeColor = "bg-violet-500/10 text-violet-300 border border-violet-500/20";

                return (
                  <tr key={tc.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 font-semibold text-slate-200">
                      <div className="flex flex-col gap-0.5">
                        <span>{tc.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono select-all">{tc.id}</span>
                      </div>
                    </td>
                    <td className="p-4 font-mono font-bold text-violet-300 select-all">
                      {tc.orderId}
                    </td>
                    <td className="p-4 text-slate-300 leading-relaxed italic">
                      &quot;{tc.complaint}&quot;
                    </td>
                    <td className="p-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-500 font-medium w-16">Sự cố:</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${badgeColor}`}>
                            {tc.expected.issue_type}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-500 font-medium w-16">Định tuyến:</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 font-mono">
                            {tc.expected.route_to}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-500 font-medium w-16">Độ tin cậy:</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 font-mono">
                            {tc.expected.confidence}
                          </span>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
