import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { useUiStore } from '../stores/uiStore';

export default function Modal({ name, title, children }) {
  const { modals, closeModal } = useUiStore();
  const modalState = modals[name];

  const isOpen = modalState?.isOpen || false;

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-primary/40 backdrop-blur-sm transition-opacity"
        onClick={() => closeModal(name)}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-sm bg-white rounded-[12px] border border-[#B8D0E8] shadow-lg animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-[#B8D0E8]">
          <h2 className="font-serif text-lg text-primary m-0 pt-1">{title}</h2>
          <button
            onClick={() => closeModal(name)}
            className="p-2 -mr-2 text-primary/60 hover:text-primary transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-4 font-sans text-primary">
          {typeof children === 'function' ? children(modalState.data) : children}
        </div>
      </div>
    </div>
  );
}
