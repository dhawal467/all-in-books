import React from 'react';
import { Plus } from 'lucide-react';
import { useUiStore } from '../stores/uiStore';

export default function FAB({ onClick }) {
  const visible = useUiStore(state => state.fabVisible);

  if (!visible) return null;

  return (
    <div className="fixed bottom-[32px] left-1/2 -translate-x-1/2 z-40 pointer-events-none">
      <button
        onClick={onClick}
        className="pointer-events-auto flex items-center justify-center w-14 h-14 bg-accent text-white rounded-full shadow-[0_4px_14px_rgba(26,111,168,0.4)] hover:bg-accent/90 active:scale-95 transition-all outline-none focus:ring-4 focus:ring-accent/30"
        aria-label="Add New Entry"
      >
        <Plus size={28} strokeWidth={2.5} />
      </button>
    </div>
  );
}
