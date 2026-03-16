import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useUiStore } from '../stores/uiStore';

export default function Sheet({ name, title, children }) {
  const { modals, closeModal } = useUiStore();
  const modalState = modals[name];
  const isOpen = modalState?.isOpen || false;
  
  // Animation state to handle slide out before unmounting
  const [render, setRender] = useState(isOpen);
  const [slideIn, setSlideIn] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRender(true);
      document.body.style.overflow = 'hidden';
      // Small delay to allow element to render before adding translation class
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setSlideIn(true));
      });
    } else {
      setSlideIn(false);
      document.body.style.overflow = '';
      const timer = setTimeout(() => setRender(false), 300); // match transition duration
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!render) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-primary/40 backdrop-blur-sm transition-opacity duration-300 ${slideIn ? 'opacity-100' : 'opacity-0'}`}
        onClick={() => closeModal(name)}
      />
      
      {/* Sheet Content */}
      <div 
        className={`relative w-full max-w-md mx-auto bg-white rounded-t-[20px] border-t border-x border-[#B8D0E8] shadow-[0_-8px_30px_rgba(0,0,0,0.12)] transition-transform duration-300 ease-out flex flex-col max-h-[90vh] ${slideIn ? 'translate-y-0' : 'translate-y-full'}`}
      >
        {/* Handle area for visual affordance */}
        <div className="flex justify-center pt-3 pb-1" onClick={() => closeModal(name)}>
          <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
        </div>

        <div className="flex items-center justify-between px-4 pb-3 border-b border-[#B8D0E8] shrink-0">
          <h2 className="font-serif text-xl text-primary m-0">{title}</h2>
          <button
            onClick={() => closeModal(name)}
            className="p-2 -mr-2 text-primary/60 hover:text-primary transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-gray-50"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 font-sans text-primary overflow-y-auto">
          {typeof children === 'function' ? children(modalState?.data) : children}
        </div>
      </div>
    </div>
  );
}
