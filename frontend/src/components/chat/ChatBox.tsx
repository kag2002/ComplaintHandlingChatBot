'use client';

import React, { useRef, useEffect } from 'react';
import { useChat, LoadingStep } from '../../store/chatContext';
import { ChatMessage } from './ChatMessage';
import { useChatStream } from '../../hooks/useChatStream';
import {
  Sparkles, Terminal, BookOpen,
  CheckCircle2, ShoppingBag, AlertTriangle, HelpCircle
} from 'lucide-react';

const STEPS: Array<{
  key: LoadingStep;
  label: string;
  sublabel: string;
  Icon: React.FC<{ className?: string }>;
  color: string;
  ringColor: string;
}> = [
  {
    key: 'validating',
    label: 'Tiếp nhận khiếu nại',
    sublabel: 'Nhập nội dung phản ánh của khách',
    Icon: Sparkles,
    color: 'text-emerald-400',
    ringColor: 'ring-emerald-500/40 bg-emerald-500/10',
  },
  {
    key: 'thinking',
    label: 'Tra cứu đơn hàng',
    sublabel: 'Tìm mã đơn & kiểm tra trạng thái trên hệ thống',
    Icon: ShoppingBag,
    color: 'text-violet-400',
    ringColor: 'ring-violet-500/40 bg-violet-500/10',
  },
  {
    key: 'searching',
    label: 'Kiểm tra bằng chứng',
    sublabel: 'Đối chiếu hình ảnh & hóa đơn dán trên túi',
    Icon: HelpCircle,
    color: 'text-cyan-400',
    ringColor: 'ring-cyan-500/40 bg-cyan-500/10',
  },
  {
    key: 'analyzing',
    label: 'Phân loại khiếu nại (Triage)',
    sublabel: 'Chạy rule-based engine để định tuyến xử lý',
    Icon: BookOpen,
    color: 'text-amber-400',
    ringColor: 'ring-amber-500/40 bg-amber-500/10',
  },
  {
    key: 'generating',
    label: 'Kiểm duyệt an toàn',
    sublabel: 'Kiểm tra guardrails bồi hoàn & quy kết lỗi',
    Icon: CheckCircle2,
    color: 'text-indigo-400',
    ringColor: 'ring-indigo-500/40 bg-indigo-500/10',
  },
];

const STEP_ORDER: LoadingStep[] = ['validating', 'thinking', 'searching', 'analyzing', 'generating'];

function AgentProgressIndicator({ currentStep }: { currentStep: LoadingStep }) {
  const currentIndex = STEP_ORDER.indexOf(currentStep);

  return (
    <div className="flex w-full gap-4 py-5 px-4 bg-[#0f1422]/40 border-y border-slate-800/50">
      {/* Avatar */}
      <div className="flex-shrink-0">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 border border-emerald-400/20 flex items-center justify-center text-white shadow-lg shadow-emerald-500/10">
          <Sparkles className="w-5 h-5 fill-white/20 animate-pulse" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col gap-3 min-w-0">
        <span className="text-xs font-semibold text-slate-300 select-none">AI Triage Assistant · Đang xử lý</span>

        {/* Progress bar */}
        <div className="flex items-center gap-1.5">
          {STEPS.map((step, idx) => {
            const isDone = idx < currentIndex;
            const isActive = idx === currentIndex;
            return (
              <div
                key={step.key}
                className={`h-1 flex-1 rounded-full transition-all duration-700 ${
                  isDone
                    ? 'bg-emerald-500'
                    : isActive
                    ? 'bg-emerald-400 animate-pulse'
                    : 'bg-slate-700/60'
                }`}
              />
            );
          })}
        </div>

        {/* Step list */}
        <div className="flex flex-col gap-1.5">
          {STEPS.map((step, idx) => {
            const isDone = idx < currentIndex;
            const isActive = idx === currentIndex;
            const { Icon } = step;

            if (!isActive && !isDone) return null;

            return (
              <div
                key={step.key}
                className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg transition-all duration-500 ${
                  isActive ? `ring-1 ${step.ringColor}` : 'opacity-50'
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                ) : (
                  <Icon className={`w-4 h-4 flex-shrink-0 ${step.color} ${isActive ? 'animate-pulse' : ''}`} />
                )}
                <div className="flex flex-col min-w-0">
                  <span className={`text-xs font-medium leading-tight ${isActive ? 'text-slate-200' : 'text-slate-500'}`}>
                    {step.label}
                  </span>
                  {isActive && (
                    <span className="text-[10px] text-slate-500 leading-tight mt-0.5">{step.sublabel}</span>
                  )}
                </div>
                {isActive && (
                  <div className="ml-auto flex items-center gap-0.5 flex-shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '120ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '240ms' }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Estimated time note */}
        <p className="text-[10px] text-slate-600 select-none">
          ⏱ Đang chạy Agent Loop (Tối đa 4 vòng, tự động kiểm duyệt bồi hoàn & quy trách nhiệm)
        </p>
      </div>
    </div>
  );
}

export const ChatBox: React.FC = () => {
  const { activeSession, isLoading, loadingStep } = useChat();
  const { sendMessage } = useChatStream();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const promptCards = [
    {
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
      title: "1. Thiếu món rõ ràng (GF12345)",
      description: "Đơn đã giao, có đủ ảnh đồ ăn nhận được & hóa đơn. Triaged: store.",
      prompt: "Đơn hàng GF12345 của mình thiếu 1 ly trà sữa trân châu. Mình đã nhận cơm gà và khoai tây, nhưng không có trà sữa. Đây là ảnh các món đã nhận và hóa đơn."
    },
    {
      icon: <HelpCircle className="w-5 h-5 text-amber-400" />,
      title: "2. Khiếu nại mơ hồ (GF67890)",
      description: "Đơn đã giao, không có ảnh chứng từ. Triaged: unclear.",
      prompt: "Đơn hàng GF67890 lỗi rồi, tôi muốn hoàn tiền."
    },
    {
      icon: <AlertTriangle className="w-5 h-5 text-red-400" />,
      title: "3. Chưa nhận được đơn (GF24680)",
      description: "App báo đã giao nhưng khách báo chưa nhận. Triaged: CSKH.",
      prompt: "Tôi chưa nhận được đơn GF24680 của mình, mặc dù trên app báo đã giao thành công cách đây 10 phút. Làm ơn kiểm tra giùm."
    },
    {
      icon: <Terminal className="w-5 h-5 text-blue-400" />,
      title: "4. Hỏi hoàn tiền (GF12345)",
      description: "Hỏi trạng thái hoàn tiền (Money-related). Triaged: CSKH.",
      prompt: "Tại sao đơn hàng GF12345 của tôi vẫn chưa nhận được hoàn tiền? Tôi đã khiếu nại từ hôm qua."
    }
  ];

  // Scroll to bottom whenever messages list or loading state changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession?.messages?.length, isLoading]);

  const messages = activeSession?.messages || [];

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col bg-[#080b13]">
      {messages.length === 0 ? (
        /* Empty State Landing page */
        <div className="flex-1 flex flex-col items-center justify-center max-w-3xl mx-auto px-6 py-12 select-none">
          <div className="flex flex-col items-center text-center gap-3.5 mb-10">
            <div className="p-3 bg-emerald-600/10 border border-emerald-500/30 rounded-2xl text-emerald-400 shadow-lg shadow-emerald-500/5">
              <Sparkles className="w-8 h-8 fill-emerald-400/20" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 via-teal-200 to-cyan-300 bg-clip-text text-transparent tracking-tight">
              GrabFood Complaint Router
            </h1>
            <p className="text-sm text-slate-400 max-w-md leading-relaxed">
              Hệ thống tự động tiếp nhận khiếu nại, đối soát bằng chứng hình ảnh và phân loại định tuyến ticket sử dụng mô hình AI Agent Loop & Guardrails.
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            {promptCards.map((card, idx) => (
              <div
                key={idx}
                onClick={() => sendMessage(card.prompt)}
                className="group p-5 bg-[#0f1424]/40 hover:bg-[#12192e]/60 border border-slate-800/60 hover:border-emerald-500/40 rounded-2xl cursor-pointer transition-all duration-300 transform hover:-translate-y-1 shadow-md shadow-slate-950/20"
              >
                <div className="flex gap-4 items-start">
                  <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-xl flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                    {card.icon}
                  </div>
                  <div className="flex flex-col gap-1 overflow-hidden flex-1">
                    <span className="text-sm font-semibold text-slate-200 group-hover:text-emerald-400 transition-colors duration-200 truncate">
                      {card.title}
                    </span>
                    <span className="text-xs text-slate-400 leading-relaxed">
                      {card.description}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Messages List */
        <div className="flex flex-col flex-1 py-4">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}

          {/* Agent Progress Indicator */}
          {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && loadingStep !== 'idle' && (
            <AgentProgressIndicator currentStep={loadingStep} />
          )}
          <div ref={messagesEndRef} />
        </div>
      )}
    </div>
  );
};
