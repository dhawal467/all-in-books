import React from 'react';
import { useUiStore } from '../stores/uiStore';
import { Home, List, Users, MoreHorizontal } from 'lucide-react';

export default function BottomNav() {
  const { activeTab, setTab } = useUiStore();

  const navItems = [
    { id: 0, label: 'Home', icon: Home },
    { id: 1, label: 'Entries', icon: List },
    { id: 'fab-spacer', label: '', isSpacer: true },
    { id: 2, label: 'Parties', icon: Users },
    { id: 3, label: 'More', icon: MoreHorizontal },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-[64px] bg-white border-t border-[#B8D0E8] shadow-[0_-2px_10px_rgba(0,0,0,0.05)] z-30 flex items-center px-2 pb-safe">
      <div className="flex w-full justify-between items-center max-w-md mx-auto">
        {navItems.map((item, idx) => {
          if (item.isSpacer) {
            return <div key="spacer" className="w-[56px] shrink-0" />;
          }

          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className="flex flex-col items-center justify-center flex-1 min-w-[64px] h-[56px] gap-1 transition-colors"
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
                  isActive ? 'bg-accent/10 text-accent' : 'text-primary/60 hover:text-primary'
                }`}
              >
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span
                className={`text-[10px] font-sans font-medium ${
                  isActive ? 'text-accent' : 'text-primary/60'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
