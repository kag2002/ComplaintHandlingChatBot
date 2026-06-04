'use client';

import React from 'react';
import { RunSummary } from '../../services/logsApi';
import {
  ArrowUp,
  ArrowDown,
  Minus,
  X,
} from 'lucide-react';

interface VersionCompareProps {
  runA: RunSummary;
  runB: RunSummary;
  onClose: () => void;
}

function DeltaCell({ label, a, b, isPercent = true }: { label: string; a: number | null | undefined; b: number | null | undefined; isPercent?: boolean }) {
  if (a == null || b == null) return null;
  const aVal = isPercent ? Math.round(a * 100) : a;
  const bVal = isPercent ? Math.round(b * 100) : b;
  const delta = bVal - aVal;
  const suffix = isPercent ? '%' : '';

  return (
    <tr className="border-b border-slate-800/30 last:border-0">
      <td className="py-2.5 px-3 text-[11px] text-slate-400 font-medium">{label}</td>
      <td className="py-2.5 px-3 text-xs text-slate-300 text-center font-mono">
        {aVal}{suffix}
      </td>
      <td className="py-2.5 px-3 text-xs text-slate-300 text-center font-mono">
        {bVal}{suffix}
      </td>
      <td className="py-2.5 px-3 text-center">
        <span
          className={`inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-md ${
            delta > 0
              ? 'bg-emerald-500/15 text-emerald-400'
              : delta < 0
                ? 'bg-red-500/15 text-red-400'
                : 'bg-slate-700/30 text-slate-400'
          }`}
        >
          {delta > 0 ? (
            <ArrowUp className="w-3 h-3" />
          ) : delta < 0 ? (
            <ArrowDown className="w-3 h-3" />
          ) : (
            <Minus className="w-3 h-3" />
          )}
          {delta > 0 ? '+' : ''}{delta}{suffix}
        </span>
      </td>
    </tr>
  );
}

export const VersionCompare: React.FC<VersionCompareProps> = ({
  runA,
  runB,
  onClose,
}) => {
  const sA = runA.summary;
  const sB = runB.summary;

  return (
    <div className="bg-[#0e1221]/80 border border-cyan-500/20 rounded-2xl p-5 shadow-lg shadow-cyan-500/5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-cyan-300 flex items-center gap-2">
          <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-violet-600/20 text-violet-300 border border-violet-500/20 uppercase">
            {runA.version}
          </span>
          <span className="text-slate-500">vs</span>
          <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-violet-600/20 text-violet-300 border border-violet-500/20 uppercase">
            {runB.version}
          </span>
        </h3>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-white/5 text-slate-400 hover:text-slate-200 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-700/50">
            <th className="py-2 px-3 text-[9px] text-slate-500 uppercase tracking-wider text-left font-semibold">
              Metric
            </th>
            <th className="py-2 px-3 text-[9px] text-slate-500 uppercase tracking-wider text-center font-semibold">
              {runA.version}
            </th>
            <th className="py-2 px-3 text-[9px] text-slate-500 uppercase tracking-wider text-center font-semibold">
              {runB.version}
            </th>
            <th className="py-2 px-3 text-[9px] text-slate-500 uppercase tracking-wider text-center font-semibold">
              Delta
            </th>
          </tr>
        </thead>
        <tbody>
          <DeltaCell label="Case Accuracy" a={sA.case_accuracy} b={sB.case_accuracy} />
          <DeltaCell
            label="Tool Routing"
            a={sA.tool_routing_accuracy}
            b={sB.tool_routing_accuracy}
          />
          <DeltaCell
            label="Argument Accuracy"
            a={sA.argument_accuracy}
            b={sB.argument_accuracy}
          />
          <DeltaCell
            label="Passed Cases"
            a={sA.passed_cases}
            b={sB.passed_cases}
            isPercent={false}
          />
          <DeltaCell
            label="Total Cases"
            a={sA.measured_cases}
            b={sB.measured_cases}
            isPercent={false}
          />
        </tbody>
      </table>
    </div>
  );
};
