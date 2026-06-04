'use client';

import React from 'react';
import { RunSummary } from '../../services/logsApi';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Cpu,
  Tag,
  ArrowRight,
} from 'lucide-react';
import { formatDateTime } from '../../utils/format';

interface RunCardProps {
  run: RunSummary;
  index?: number;
  onSelect: (run: RunSummary) => void;
  isSelected?: boolean;
  onToggleCompare?: (run: RunSummary) => void;
  isComparing?: boolean;
}

function AccuracyBar({ label, value }: { label: string; value: number }) {
  const pct = Math.round(value * 100);
  const color =
    pct >= 80
      ? 'from-emerald-500 to-green-400'
      : pct >= 50
        ? 'from-amber-500 to-yellow-400'
        : 'from-red-500 to-rose-400';
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-slate-400 w-20 shrink-0 truncate">
        {label}
      </span>
      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[10px] font-semibold text-slate-300 w-10 text-right">
        {pct}%
      </span>
    </div>
  );
}

export const RunCard: React.FC<RunCardProps> = ({
  run,
  index,
  onSelect,
  isSelected,
  onToggleCompare,
  isComparing,
}) => {
  const s = run.summary;
  const accuracy = s.case_accuracy ?? 0;
  const passRate = Math.round(accuracy * 100);
  const statusColor =
    passRate >= 80
      ? 'border-emerald-500/30 shadow-emerald-500/5'
      : passRate >= 50
        ? 'border-amber-500/30 shadow-amber-500/5'
        : 'border-red-500/30 shadow-red-500/5';

  return (
    <div
      onClick={() => onSelect(run)}
      className={`group relative cursor-pointer rounded-2xl border p-4 transition-all duration-300 hover:scale-[1.01] ${
        isSelected
          ? 'border-violet-500/50 bg-violet-500/5 shadow-lg shadow-violet-500/10 ring-1 ring-violet-500/20'
          : `bg-[#0e1221]/60 hover:bg-[#111730]/80 ${statusColor} shadow-lg`
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          {index != null && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-slate-700/40 text-slate-300 border border-slate-600/30 tabular-nums">
              #{index}
            </span>
          )}
          <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-violet-600/20 text-violet-300 border border-violet-500/20 uppercase tracking-wider">
            {run.version}
          </span>
          {run.suite && (
            <span className="px-2 py-0.5 text-[10px] font-medium rounded-md bg-indigo-600/10 text-indigo-300 border border-indigo-500/15">
              {run.suite}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {onToggleCompare && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleCompare(run);
              }}
              className={`px-2 py-1 text-[9px] font-semibold rounded-lg border transition-all duration-200 ${
                isComparing
                  ? 'bg-cyan-500/20 border-cyan-500/30 text-cyan-300'
                  : 'bg-white/5 border-slate-700/50 text-slate-400 hover:text-cyan-300 hover:border-cyan-500/30'
              }`}
            >
              {isComparing ? 'Selected' : 'Compare'}
            </button>
          )}
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold ${
              passRate >= 80
                ? 'bg-emerald-500/15 text-emerald-400'
                : passRate >= 50
                  ? 'bg-amber-500/15 text-amber-400'
                  : 'bg-red-500/15 text-red-400'
            }`}
          >
            {passRate >= 80 ? (
              <CheckCircle2 className="w-3 h-3" />
            ) : (
              <XCircle className="w-3 h-3" />
            )}
            {passRate}%
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="flex flex-col gap-1.5 mb-3 text-[10px] text-slate-400">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Tag className="w-3 h-3 text-slate-500" />
            <span className="max-w-[120px] truncate">{run.provider}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Cpu className="w-3 h-3 text-slate-500" />
            <span className="max-w-[150px] truncate">{run.model?.split('/').pop()}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-slate-300 font-medium">
          <Clock className="w-3 h-3 text-violet-400" />
          <span>{formatDateTime(run.generated_at)}</span>
        </div>
      </div>

      {/* Accuracy Bars */}
      <div className="space-y-1.5">
        <AccuracyBar label="Cases" value={accuracy} />
        {s.tool_routing_accuracy != null && (
          <AccuracyBar label="Routing" value={s.tool_routing_accuracy} />
        )}
        {s.argument_accuracy != null && (
          <AccuracyBar label="Args" value={s.argument_accuracy} />
        )}
      </div>

      {/* Counts */}
      <div className="mt-3 flex items-center justify-between text-[9px] text-slate-500">
        <span>
          {s.passed_cases}/{s.measured_cases} passed
          {s.provider_error_cases > 0 &&
            ` · ${s.provider_error_cases} errors`}
        </span>
        <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 text-violet-400 transition-opacity duration-300" />
      </div>
    </div>
  );
};
