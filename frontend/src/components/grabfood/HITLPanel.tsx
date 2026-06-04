'use client';

import React, { useState } from 'react';
import { TriageResult } from '../../types/chat';

interface HITLPanelProps {
  orderId: string | null;
  triage: TriageResult | null;
}

export default function HITLPanel({ orderId, triage }: HITLPanelProps) {
  const [storeConfirmed, setStoreConfirmed] = useState(false);
  const [driverConfirmed, setDriverConfirmed] = useState(false);
  const [cskhApproved, setCskhApproved] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  const addLog = (msg: string) => {
    setLog((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
  };

  const handleStoreConfirm = () => {
    setStoreConfirmed(true);
    addLog('Cửa hàng xác nhận: Đóng thiếu 1 ly trà sữa trân châu do hết nguyên liệu.');
  };

  const handleDriverConfirm = () => {
    setDriverConfirmed(true);
    addLog('Tài xế xác nhận: Đã giao đúng định vị, khách nhờ treo ở cổng.');
  };

  const handleCskhApprove = () => {
    setCskhApproved(true);
    addLog('CSKH phê duyệt: Bồi hoàn 35.000đ cho khách hàng vào ví GrabPay.');
  };

  const handleReset = () => {
    setStoreConfirmed(false);
    setDriverConfirmed(false);
    setCskhApproved(false);
    setLog([]);
  };

  if (!orderId) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-gray-400 bg-gray-900/40 rounded-xl border border-gray-800 backdrop-blur-md">
        <svg className="w-12 h-12 mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        <p className="text-sm font-medium">Chưa có thông tin HITL</p>
        <p className="text-xs text-gray-500 mt-1">Đang chờ sự cố cần sự can thiệp của con người...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-900/60 rounded-xl border border-gray-800 backdrop-blur-md overflow-hidden text-gray-300">
      {/* Header */}
      <div className="px-4 py-3 bg-gray-950/50 border-b border-gray-800 flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Human-In-The-Loop (HITL)</span>
          <h3 className="text-base font-bold text-white">Thao Tác CSKH & Đối Soát</h3>
        </div>
        <button
          onClick={handleReset}
          className="text-[10px] bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white px-2 py-1 rounded transition"
        >
          Reset
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* HITL Action Buttons */}
        <div className="space-y-2.5">
          {triage?.route_to === 'store' && (
            <button
              onClick={handleStoreConfirm}
              disabled={storeConfirmed}
              className={`w-full py-2.5 px-3 rounded-lg border font-semibold flex items-center justify-between transition-all ${
                storeConfirmed
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-500 border-blue-500 text-white shadow-md active:scale-[0.98]'
              }`}
            >
              <span>{storeConfirmed ? '✓ Cửa hàng đã xác nhận' : 'Cửa hàng xác nhận (Store Confirm)'}</span>
              <span className="text-[10px] opacity-75">Đối soát đóng gói</span>
            </button>
          )}

          {triage?.route_to === 'driver' && (
            <button
              onClick={handleDriverConfirm}
              disabled={driverConfirmed}
              className={`w-full py-2.5 px-3 rounded-lg border font-semibold flex items-center justify-between transition-all ${
                driverConfirmed
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-500 border-purple-500 text-white shadow-md active:scale-[0.98]'
              }`}
            >
              <span>{driverConfirmed ? '✓ Tài xế đã xác nhận' : 'Tài xế xác nhận (Driver Confirm)'}</span>
              <span className="text-[10px] opacity-75">Đối soát định vị</span>
            </button>
          )}

          {triage?.handoff_required && (
            <button
              onClick={handleCskhApprove}
              disabled={cskhApproved}
              className={`w-full py-2.5 px-3 rounded-lg border font-semibold flex items-center justify-between transition-all ${
                cskhApproved
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-500 border-emerald-500 text-white shadow-md active:scale-[0.98]'
              }`}
            >
              <span>{cskhApproved ? '✓ Đã phê duyệt hoàn tiền' : 'CSKH duyệt bồi hoàn (Approve Refund)'}</span>
              <span className="text-[10px] opacity-75">Hành động tiền bạc</span>
            </button>
          )}

          {!triage?.handoff_required && !triage?.route_to && (
            <div className="p-3 bg-gray-950/20 rounded-lg text-center text-gray-500 border border-gray-800/40">
              Đơn hàng này không cần HITL hoặc đang ở luồng trao đổi trực tiếp.
            </div>
          )}
        </div>

        {/* HITL Operation Logs */}
        <div className="mt-4">
          <span className="text-gray-500 font-semibold block mb-2">Nhật ký xử lý (Audit Log)</span>
          <div className="bg-gray-950/40 border border-gray-800/80 rounded-lg p-3 min-h-[80px] max-h-[140px] overflow-y-auto space-y-1.5 font-mono text-[10px] text-gray-400">
            {log.length === 0 ? (
              <span className="text-gray-600 italic">Chưa có nhật ký hoạt động...</span>
            ) : (
              log.map((line, idx) => (
                <div key={idx} className="border-b border-gray-800/30 pb-1 last:border-0 last:pb-0">
                  {line}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
