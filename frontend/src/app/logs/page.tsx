'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  fetchRuns,
  fetchTranscripts,
  RunSummary,
  TranscriptSummary,
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
} from 'lucide-react';
import Link from 'next/link';

type Tab = 'runs' | 'transcripts';

export default function LogsPage() {
  const [tab, setTab] = useState<Tab>('runs');
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [transcripts, setTranscripts] = useState<TranscriptSummary[]>([]);
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
            <h1 className="text-sm font-semibold text-slate-100 tracking-wide">
              GrabFood Complaint Router Log Viewer & Evals
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
        <div className="max-w-6xl mx-auto px-6 flex items-center gap-1">
          {[
            { key: 'runs' as Tab, label: 'Eval Runs', icon: FlaskConical, count: runs.length },
            { key: 'transcripts' as Tab, label: 'Transcripts', icon: MessageSquareText, count: transcripts.length },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-medium transition-all duration-200 border-b-2 ${
                tab === t.key
                  ? 'text-violet-300 border-violet-500'
                  : 'text-slate-500 border-transparent hover:text-slate-300 hover:border-slate-700'
              }`}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
              <span
                className={`px-1.5 py-0.5 text-[9px] font-bold rounded-full ${
                  tab === t.key
                    ? 'bg-violet-500/20 text-violet-300'
                    : 'bg-slate-800/50 text-slate-500'
                }`}
              >
                {t.count}
              </span>
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
                  hint="Run `python run_eval.py --provider openrouter --model google/gemini-2.5-flash:free --version v0 --suite base` to generate one."
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
