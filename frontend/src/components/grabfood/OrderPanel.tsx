'use client';

import React, { useState, useEffect } from 'react';
import { OrderData } from '../../types/chat';

interface OrderPanelProps {
  orderId: string | null;
}

export default function OrderPanel({ orderId }: OrderPanelProps) {
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setOrder(null);
      return;
    }

    const fetchOrder = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`http://127.0.0.1:8000/api/orders/${orderId}`);
        if (!res.ok) {
          throw new Error(`Order ${orderId} not found`);
        }
        const data = await res.json();
        setOrder(data);
      } catch (err: any) {
        setError(err.message || 'Error loading order');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  if (!orderId) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-gray-400 bg-gray-900/40 rounded-xl border border-gray-800 backdrop-blur-md">
        <svg className="w-12 h-12 mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p className="text-sm font-medium">Chưa có thông tin đơn hàng</p>
        <p className="text-xs text-gray-500 mt-1">Đang chờ hệ thống tra cứu đơn hàng...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-6 bg-gray-900/40 rounded-xl border border-gray-800 backdrop-blur-md">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-4 bg-red-950/30 border border-red-900/50 text-red-400 rounded-xl">
        <p className="text-sm font-semibold">Lỗi tra cứu đơn hàng</p>
        <p className="text-xs mt-1">{error || 'Không tìm thấy đơn hàng.'}</p>
      </div>
    );
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'cancelled':
        return 'bg-red-500/10 text-red-400 border border-red-500/20';
      default:
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900/60 rounded-xl border border-gray-800 backdrop-blur-md overflow-hidden text-gray-300">
      {/* Header */}
      <div className="px-4 py-3 bg-gray-950/50 border-b border-gray-800 flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">GrabFood Order</span>
          <h3 className="text-base font-bold text-white">{order.order_id}</h3>
        </div>
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusBadgeClass(order.order_status)}`}>
          {order.order_status === 'delivered' ? 'Đã giao' : order.order_status}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Customer & Restaurant */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-gray-950/30 p-2.5 rounded-lg border border-gray-800/60">
            <span className="text-gray-500 block mb-0.5">Khách hàng</span>
            <span className="font-semibold text-white">{order.customer_name}</span>
          </div>
          <div className="bg-gray-950/30 p-2.5 rounded-lg border border-gray-800/60">
            <span className="text-gray-500 block mb-0.5">Cửa hàng</span>
            <span className="font-semibold text-white">{order.merchant_name}</span>
          </div>
        </div>

        {/* System Status Tracking */}
        <div className="bg-gray-950/30 p-3 rounded-lg border border-gray-800/60 space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Trạng thái thanh toán</span>
            <span className="font-medium text-white uppercase">{order.payment_status}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Trạng thái tài xế</span>
            <span className="font-medium text-white uppercase">{order.driver_status}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Khiếu nại khách hàng</span>
            <span className={`font-semibold ${order.delivery_status === 'not_received_claim' ? 'text-red-400' : 'text-gray-400'}`}>
              {order.delivery_status === 'not_received_claim' ? 'Khai báo chưa nhận đơn' : 'Bình thường'}
            </span>
          </div>
        </div>

        {/* Order Items */}
        <div>
          <span className="text-xs font-semibold text-gray-400 block mb-2">Món ăn đã đặt</span>
          <div className="bg-gray-950/20 rounded-lg border border-gray-800/40 divide-y divide-gray-800/40">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center px-3 py-2 text-xs">
                <span className="font-medium text-gray-200">{item.name}</span>
                <span className="text-gray-400 bg-gray-900 px-1.5 py-0.5 rounded">x{item.quantity}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Evidence Status */}
        <div>
          <span className="text-xs font-semibold text-gray-400 block mb-2">Bằng chứng kỹ thuật số</span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center space-x-2 bg-gray-950/20 p-2 rounded-lg border border-gray-800/40">
              <span className={`w-2 h-2 rounded-full ${order.evidence.customer_photo ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`} />
              <span className="truncate">Ảnh KH chụp</span>
            </div>
            <div className="flex items-center space-x-2 bg-gray-950/20 p-2 rounded-lg border border-gray-800/40">
              <span className={`w-2 h-2 rounded-full ${order.evidence.receipt_photo ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`} />
              <span className="truncate">Ảnh hóa đơn</span>
            </div>
            <div className="flex items-center space-x-2 bg-gray-950/20 p-2 rounded-lg border border-gray-800/40">
              <span className={`w-2 h-2 rounded-full ${order.evidence.driver_dropoff_photo ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`} />
              <span className="truncate">Ảnh tài xế chụp</span>
            </div>
            <div className="flex items-center space-x-2 bg-gray-950/20 p-2 rounded-lg border border-gray-800/40">
              <span className={`w-2 h-2 rounded-full ${order.evidence.merchant_receipt_match ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`} />
              <span className="truncate">Khớp hóa đơn</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
