import React from 'react';

export default function EmptyState({ icon: Icon, title, message, ctaText, onCtaClick }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center w-full min-h-[300px]">
      {Icon && (
        <div className="bg-primary/5 text-accent p-4 rounded-full mb-4">
          <Icon size={32} strokeWidth={1.5} />
        </div>
      )}
      
      <h3 className="font-serif text-xl tracking-wide text-primary mb-2">
        {title}
      </h3>
      
      <p className="font-sans text-[15px] leading-relaxed text-primary/70 max-w-[280px] mb-6">
        {message}
      </p>

      {ctaText && onCtaClick && (
        <button
          onClick={onCtaClick}
          className="min-h-[44px] min-w-[120px] px-6 py-2 bg-accent text-white font-sans font-medium rounded-full shadow-[0_2px_8px_rgba(26,111,168,0.25)] hover:bg-accent/90 active:scale-95 transition-all outline-none focus:ring-2 focus:ring-accent/50 focus:ring-offset-2"
        >
          {ctaText}
        </button>
      )}
    </div>
  );
}
