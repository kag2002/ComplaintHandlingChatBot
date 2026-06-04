'use client';

import React from 'react';
import { TriageResult } from '../../types/chat';

interface TriagePanelProps {
  triage: TriageResult | null;
}

export default function TriagePanel({ triage }: TriagePanelProps) {
  if (!triage) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-gray-400 bg-gray-900/40 rounded-xl border border-gray-800 backdrop-blur-md">
        <svg className="w-12 h-12 mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-sm font-medium">Chưa có kết quả phân loại</p>
        <p className="text-xs text-gray-500 mt-1">Đang chờ hệ thống phân loại khiếu nại (Triage)...</p>
      </div>
    );
  }

  const getConfidenceColor = (conf: string) => {
    switch (conf) {
      case 'high':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'medium':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      default:
        return 'text-red-400 bg-red-500/10 border-red-500/20';
    }
  };

  const getRouteBadge = (route: string) => {
    switch (route) {
      case 'store':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      case 'driver':
        return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
      case 'customer_support':
        return 'bg-red-500/10 text-red-400 border border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border border-gray-500/20';
    }
  };

  const translateIssueType = (type: string) => {
    switch (type) {
      case 'missing_item':
        return 'Thiếu món ăn';
      case 'wrong_item':
        return 'Giao sai món';
      case 'damaged_or_spilled_item':
        return 'Món ăn bị đổ/hỏng';
      case 'not_received':
        return 'Chưa nhận được đơn hàng';
      case 'refund_status':
        return 'Hỏi trạng thái hoàn tiền';
      default:
        return 'Khiếu nại chưa rõ';
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900/60 rounded-xl border border-gray-800 backdrop-blur-md overflow-hidden text-gray-300">
      {/* Header */}
      <div className="px-4 py-3 bg-gray-950/50 border-b border-gray-800 flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Triage Result</span>
          <h3 className="text-base font-bold text-white">Ticket Phân Loại</h3>
        </div>
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getConfidenceColor(triage.confidence)}`}>
          Độ tin cậy: {triage.confidence.toUpperCase()}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* Issue Type & Route To */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-950/30 p-2.5 rounded-lg border border-gray-800/60">
            <span className="text-gray-500 block mb-0.5">Sự cố</span>
            <span className="font-semibold text-white">{translateIssueType(triage.issue_type)}</span>
          </div>
          <div className="bg-gray-950/30 p-2.5 rounded-lg border border-gray-800/60">
            <span className="text-gray-500 block mb-0.5">Chuyển hướng</span>
            <span className={`px-2 py-0.2 rounded font-semibold ${getRouteBadge(triage.route_to)}`}>
              {triage.route_to.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-gray-950/30 p-3 rounded-lg border border-gray-800/60">
          <span className="text-gray-500 block mb-1">Tóm tắt khiếu nại</span>
          <p className="text-gray-200 leading-relaxed font-medium">{triage.summary}</p>
        </div>

        {/* Missing Info */}
        {triage.missing_info && triage.missing_info.length > 0 && (
          <div className="bg-gray-950/30 p-3 rounded-lg border border-gray-800/60">
            <span className="text-red-400 font-semibold block mb-1">Thiếu thông tin bằng chứng</span>
            <ul className="list-disc pl-4 space-y-1 text-gray-400">
              {triage.missing_info.map((info, i) => (
                <li key={i}>{info}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Handoff Status */}
        <div className={`p-3 rounded-lg border flex items-center justify-between ${triage.handoff_required ? 'bg-amber-950/20 border-amber-900/40' : 'bg-emerald-950/20 border-emerald-900/40'}`}>
          <div>
            <span className="font-semibold block text-white">Yêu cầu CSKH duyệt (HITL)</span>
            <span className="text-[10px] text-gray-400 mt-0.5 block">{triage.handoff_reason || 'Tự động duyệt nếu độ tin cậy cao.'}</span>
          </div>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${triage.handoff_required ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
            {triage.handoff_required ? 'CSKH DUYỆT' : 'TỰ ĐỘNG'}
          </span>
        </div>

        {/* Questions for stakeholders */}
        {(triage.questions_to_customer.length > 0 || triage.questions_to_store.length > 0 || triage.questions_to_driver.length > 0) && (
          <div className="space-y-2">
            <span className="text-gray-500 font-semibold block">Câu hỏi xác minh</span>
            {triage.questions_to_customer.map((q, i) => (
              <div key={i} className="bg-gray-950/20 p-2 rounded border border-gray-800/40">
                <span className="text-emerald-400 font-bold block mb-0.5">KHÁCH HÀNG:</span>
                <span className="text-gray-300">{q}</span>
              </div>
            ))}
            {triage.questions_to_store.map((q, i) => (
              <div key={i} className="bg-gray-950/20 p-2 rounded border border-gray-800/40">
                <span className="text-blue-400 font-bold block mb-0.5">CỬA HÀNG:</span>
                <span className="text-gray-300">{q}</span>
              </div>
            ))}
            {triage.questions_to_driver.map((q, i) => (
              <div key={i} className="bg-gray-950/20 p-2 rounded border border-gray-800/40">
                <span className="text-purple-400 font-bold block mb-0.5">TÀI XẾ:</span>
                <span className="text-gray-300">{q}</span>
              </div>
            ))}
          </div>
        )}

        {/* Next Action */}
        <div className="bg-gray-950/30 p-3 rounded-lg border border-gray-800/60">
          <span className="text-gray-500 block mb-1">Hành động tiếp theo</span>
          <code className="text-amber-300 block font-mono bg-gray-950/50 p-1.5 rounded">{triage.next_action}</code>
        </div>
      </div>
    </div>
  );
}
