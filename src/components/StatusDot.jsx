import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export default function StatusDot() {
  const isOnline = useOnlineStatus();

  return (
    <div
      className="flex items-center gap-2 px-2 py-1 rounded-full bg-slate-100/50"
      title={isOnline ? "Online - Sync Active" : "Offline - Working Locally"}
    >
      <div className="relative flex h-2.5 w-2.5 items-center justify-center">
        {isOnline && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-income opacity-75"></span>
        )}
        <span
          className={`relative inline-flex rounded-full h-2.5 w-2.5 transition-colors ${
            isOnline ? 'bg-income' : 'bg-gray-400'
          }`}
        ></span>
      </div>
      <span className="text-[10px] font-sans font-medium text-primary/60 uppercase tracking-wider">
        {isOnline ? 'Online' : 'Offline'}
      </span>
    </div>
  );
}
