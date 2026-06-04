'use client';

import React, { useState, useEffect } from 'react';
import { ChatProvider, useChat } from '../../store/chatContext';
import { Sidebar } from '../../components/chat/Sidebar';
import { ChatBox } from '../../components/chat/ChatBox';
import { ChatInput } from '../../components/chat/ChatInput';
import { PanelLeftOpen, PanelRightClose, PanelRightOpen, FileText, ShoppingBag, Users, Activity } from 'lucide-react';
import { fetchLogDetail } from '../../services/logsApi';
import { TriageResult } from '../../types/chat';

// Import our new panels
import TriagePanel from '../../components/grabfood/TriagePanel';
import OrderPanel from '../../components/grabfood/OrderPanel';
import HITLPanel from '../../components/grabfood/HITLPanel';
import AiPipeline from '../../components/grabfood/AiPipeline';

type PanelTab = 'triage' | 'order' | 'hitl' | 'pipeline';

const ChatClientContent: React.FC = () => {
  const { isSidebarOpen, toggleSidebar, activeSession, isLoading } = useChat();
  
  // Right panel states
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<PanelTab>('triage');
  
  // GrabFood domain states fetched from transcripts
  const [triageData, setTriageData] = useState<TriageResult | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [toolEvents, setToolEvents] = useState<any[]>([]);

  useEffect(() => {
    if (!activeSession) {
      setTriageData(null);
      setOrderId(null);
      setToolEvents([]);
      return;
    }

    const loadLatestSessionData = async () => {
      try {
        const detail = await fetchLogDetail(`transcripts/web_${activeSession.id}.json`);
        if (detail && detail.turns && detail.turns.length > 0) {
          // Get the latest turn that has tool events
          let lastTurnWithTools = null;
          for (let idx = detail.turns.length - 1; idx >= 0; idx--) {
            const turn = detail.turns[idx];
            if (turn.tool_events && turn.tool_events.length > 0) {
              lastTurnWithTools = turn;
              break;
            }
          }

          const turnToUse = lastTurnWithTools || detail.turns[detail.turns.length - 1];
          const events = turnToUse.tool_events || [];
          setToolEvents(events);
          
          // Find order_id
          let foundOrderId = null;
          for (const ev of events) {
            if (ev.tool === 'order_lookup' && ev.args && ev.args.order_id) {
              foundOrderId = ev.args.order_id;
            }
            if (ev.tool === 'evidence_check' && ev.args && ev.args.order_id) {
              foundOrderId = ev.args.order_id;
            }
            if (ev.tool === 'triage' && ev.args && ev.args.order_data && ev.args.order_data.order_id) {
              foundOrderId = ev.args.order_data.order_id;
            }
          }
          
          if (foundOrderId) {
            setOrderId(foundOrderId);
          }

          // Find triage result
          const triageEvent = events.find((ev: any) => ev.tool === 'triage');
          if (triageEvent && triageEvent.result && !triageEvent.result.error) {
            setTriageData(triageEvent.result);
          } else {
            // Check if handoff has ticket details
            const handoffEvent = events.find((ev: any) => ev.tool === 'hitl_handoff');
            if (handoffEvent && handoffEvent.args && handoffEvent.args.ticket_details) {
              setTriageData(handoffEvent.args.ticket_details);
            } else {
              setTriageData(null);
            }
          }
        } else {
          setTriageData(null);
          setOrderId(null);
          setToolEvents([]);
        }
      } catch (err) {
        // Transcript might not exist yet if session has no messages
        setTriageData(null);
        setOrderId(null);
        setToolEvents([]);
      }
    };

    // Load data immediately and check if it's currently loading
    loadLatestSessionData();
  }, [activeSession, isLoading]);

  const togglePanel = () => setIsPanelOpen(!isPanelOpen);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#080b13] text-slate-100 font-sans">
      {/* 1. Left Sidebar */}
      <Sidebar />

      {/* 2. Main Chat Area */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden border-r border-slate-800/40">
        {/* Toggle Sidebar Button (visible only when sidebar is closed) */}
        {!isSidebarOpen && (
          <div className="absolute top-4 left-4 z-10 select-none">
            <button
              onClick={toggleSidebar}
              className="p-2.5 bg-[#0f1424]/80 border border-slate-800 hover:border-slate-700/80 text-slate-300 hover:text-slate-100 rounded-xl backdrop-blur-md transition-all duration-300 shadow-md shadow-slate-950/20"
              title="Mở sidebar"
            >
              <PanelLeftOpen className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Toggle Right Panel Button (visible only when right panel is closed) */}
        {!isPanelOpen && (
          <div className="absolute top-4 right-4 z-10 select-none">
            <button
              onClick={togglePanel}
              className="p-2.5 bg-[#0f1424]/80 border border-slate-800 hover:border-slate-700/80 text-slate-300 hover:text-slate-100 rounded-xl backdrop-blur-md transition-all duration-300 shadow-md shadow-slate-950/20"
              title="Mở bảng theo dõi"
            >
              <PanelRightOpen className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Header / Title bar */}
        <div className="h-14 border-b border-slate-800/40 bg-[#080b13]/80 flex items-center justify-center select-none flex-shrink-0 z-5">
          <span className="text-xs font-semibold text-slate-400 tracking-wider">
            GrabFood Complaint Router Agent (FastAPI Port 8000)
          </span>
        </div>

        {/* Chat List Scroll View */}
        <ChatBox />

        {/* Chat Input Text Area */}
        <ChatInput />
      </main>

      {/* 3. Right Tracking Panels (Tab-based, collapsable) */}
      {isPanelOpen && (
        <aside className="w-[450px] flex flex-col h-full bg-[#0b0e17] border-l border-slate-800/40 relative z-10 flex-shrink-0">
          {/* Header & Collapse button */}
          <div className="h-14 border-b border-slate-800/40 px-4 flex items-center justify-between bg-[#080b13]/80">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Bảng Theo Dõi Tracking</span>
            <button
              onClick={togglePanel}
              className="p-1.5 hover:bg-slate-800/50 rounded-lg text-slate-400 hover:text-slate-100 transition"
              title="Đóng bảng theo dõi"
            >
              <PanelRightClose className="w-4 h-4" />
            </button>
          </div>

          {/* Tabs Navigation */}
          <div className="flex bg-[#0f1422]/60 border-b border-slate-800/40 p-1">
            <button
              onClick={() => setActiveTab('triage')}
              className={`flex-1 py-2 px-1 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'triage'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm shadow-emerald-500/5'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Triage
            </button>
            <button
              onClick={() => setActiveTab('order')}
              className={`flex-1 py-2 px-1 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'order'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm shadow-emerald-500/5'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              Đơn hàng
            </button>
            <button
              onClick={() => setActiveTab('hitl')}
              className={`flex-1 py-2 px-1 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'hitl'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm shadow-emerald-500/5'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              HITL
            </button>
            <button
              onClick={() => setActiveTab('pipeline')}
              className={`flex-1 py-2 px-1 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'pipeline'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm shadow-emerald-500/5'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              Pipeline
            </button>
          </div>

          {/* Active Tab Panel Content */}
          <div className="flex-1 p-4 overflow-y-auto">
            {activeTab === 'triage' && <TriagePanel triage={triageData} />}
            {activeTab === 'order' && <OrderPanel orderId={orderId} />}
            {activeTab === 'hitl' && <HITLPanel orderId={orderId} triage={triageData} />}
            {activeTab === 'pipeline' && <AiPipeline toolEvents={toolEvents} />}
          </div>
        </aside>
      )}
    </div>
  );
};

export default function ChatPage() {
  return (
    <ChatProvider>
      <ChatClientContent />
    </ChatProvider>
  );
}
