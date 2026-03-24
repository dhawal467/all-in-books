import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, BarChart2, Download, Settings, ChevronRight } from 'lucide-react';

export default function MorePage() {
  const navigate = useNavigate();

  const menuItems = [
    {
      title: 'Parties',
      subtitle: 'Manage customers and vendors',
      icon: Users,
      path: '/parties',
      color: 'bg-blue-50 text-blue-600'
    },
    {
      title: 'Reports',
      subtitle: 'P&L and GST summaries',
      icon: BarChart2,
      path: '/reports',
      color: 'bg-purple-50 text-purple-600'
    },
    {
      title: 'Import Data',
      subtitle: 'Upload Excel bahi-khata files',
      icon: Download,
      path: '/import',
      color: 'bg-green-50 text-green-600'
    },
    {
      title: 'Settings & Backup',
      subtitle: 'Google Drive and business info',
      icon: Settings,
      path: '/settings',
      color: 'bg-orange-50 text-orange-600'
    }
  ];

  return (
    <div className="w-full h-full bg-gray-50 animate-fade-in pb-8">
      <div className="mb-6">
        <h1 className="text-2xl font-serif text-primary tracking-tight">More</h1>
        <p className="text-sm text-gray-500 mt-1">Advanced features and data tools</p>
      </div>

      <div className="space-y-3">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="w-full flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm active:scale-[0.98] transition-all hover:bg-gray-50"
            >
              <div className={`p-2.5 rounded-lg ${item.color}`}>
                <Icon size={24} />
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-sm font-semibold text-primary">{item.title}</h3>
                <p className="text-xs text-gray-500">{item.subtitle}</p>
              </div>
              <ChevronRight size={20} className="text-gray-300" />
            </button>
          );
        })}
      </div>

      <div className="mt-8 pt-6 border-t border-gray-100 text-center">
        <p className="text-[10px] text-gray-400 uppercase tracking-widest font-medium">All in Books v1.0</p>
        <p className="text-[10px] text-gray-400 mt-1">Offline-first • Private • Indian Made</p>
      </div>
    </div>
  );
}
