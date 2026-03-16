import React from 'react';
import { useUiStore } from '../stores/uiStore';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

export default function Toast() {
  const toasts = useUiStore((state) => state.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-[80px] left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-full max-w-[320px] px-4 pointer-events-none">
      {toasts.map((toast) => {
        let Icon = Info;
        let bgColor = 'bg-primary';
        
        if (toast.type === 'success') {
          Icon = CheckCircle2;
          bgColor = 'bg-income';
        } else if (toast.type === 'error') {
          Icon = AlertCircle;
          bgColor = 'bg-expense';
        } else if (toast.type === 'warning') {
          Icon = AlertCircle;
          bgColor = 'bg-warning';
        }

        return (
          <div
            key={toast.id}
            className={`${bgColor} text-white px-4 py-3 rounded-[12px] shadow-lg flex items-center gap-3 transition-all duration-300 min-h-[44px] pointer-events-auto`}
          >
            <Icon size={20} className="shrink-0" />
            <span className="font-sans text-sm font-medium">{toast.message}</span>
          </div>
        );
      })}
    </div>
  );
}
