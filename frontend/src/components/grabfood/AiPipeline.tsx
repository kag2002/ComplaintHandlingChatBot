'use client';

import React from 'react';

interface AiPipelineProps {
  toolEvents: any[];
}

export default function AiPipeline({ toolEvents }: AiPipelineProps) {
  // Determine which tools were called
  const hasOrderLookup = toolEvents.some(e => e.tool === 'order_lookup');
  const hasEvidenceCheck = toolEvents.some(e => e.tool === 'evidence_check');
  const hasTriage = toolEvents.some(e => e.tool === 'triage');
  const hasClarify = toolEvents.some(e => e.tool === 'clarify');
  const hasHandoff = toolEvents.some(e => e.tool === 'hitl_handoff');

  const steps = [
    {
      id: 'intake',
      name: 'Tiếp nhận',
      desc: 'Nhập khiếu nại',
      status: toolEvents.length > 0 ? 'completed' : 'active'
    },
    {
      id: 'lookup',
      name: 'Tra cứu đơn',
      desc: 'order_lookup',
      status: hasOrderLookup 
        ? 'completed' 
        : (toolEvents.length > 0 && !hasOrderLookup ? 'active' : 'pending')
    },
    {
      id: 'evidence',
      name: 'Check bằng chứng',
      desc: 'evidence_check',
      status: hasEvidenceCheck 
        ? 'completed' 
        : (hasOrderLookup && !hasEvidenceCheck ? 'active' : 'pending')
    },
    {
      id: 'triage',
      name: 'Phân loại tự động',
      desc: 'triage rule engine',
      status: hasTriage 
        ? 'completed' 
        : (hasEvidenceCheck && !hasTriage ? 'active' : 'pending')
    },
    {
      id: 'guardrails',
      name: 'Kiểm duyệt an toàn',
      desc: 'Guardrail policy check',
      status: hasTriage 
        ? 'completed' 
        : 'pending'
    },
    {
      id: 'handoff',
      name: 'Chuyển CSKH',
      desc: 'hitl_handoff',
      status: hasHandoff 
        ? 'completed' 
        : (hasTriage && hasClarify ? 'clarifying' : (hasTriage && !hasHandoff ? 'idle' : 'pending'))
    }
  ];

  return (
    <div className="bg-gray-900/60 rounded-xl border border-gray-800 p-4 backdrop-blur-md text-gray-300 text-xs">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 block mb-3">AI Agent Runtime Pipeline</span>
      
      <div className="grid grid-cols-6 gap-2 relative">
        {steps.map((step, idx) => {
          const isCompleted = step.status === 'completed';
          const isActive = step.status === 'active';
          const isClarifying = step.status === 'clarifying';
          
          let circleColor = 'bg-gray-800 border-gray-700 text-gray-500';
          let textColor = 'text-gray-500';
          
          if (isCompleted) {
            circleColor = 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.3)]';
            textColor = 'text-gray-200';
          } else if (isActive) {
            circleColor = 'bg-blue-500/20 border-blue-500 text-blue-400 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.3)]';
            textColor = 'text-blue-400 font-bold';
          } else if (isClarifying) {
            circleColor = 'bg-amber-500/20 border-amber-500 text-amber-400 animate-pulse';
            textColor = 'text-amber-400';
          }

          return (
            <div key={step.id} className="flex flex-col items-center text-center relative z-10">
              {/* Connector Line */}
              {idx < steps.length - 1 && (
                <div className={`absolute left-[50%] top-4 w-[100%] h-[2px] -z-10 ${
                  isCompleted ? 'bg-emerald-500/50' : 'bg-gray-800'
                }`} />
              )}
              
              {/* Step Circle */}
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-xs mb-2 transition-all duration-300 ${circleColor}`}>
                {isCompleted ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  idx + 1
                )}
              </div>

              {/* Label */}
              <span className={`font-semibold text-[11px] ${textColor}`}>{step.name}</span>
              <span className="text-[9px] text-gray-500 mt-0.5">{step.desc}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
