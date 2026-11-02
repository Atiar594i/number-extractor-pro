import React from 'react';
import {
  LayoutDashboard,
  UploadCloud,
  PhoneCall,
  Globe2,
  BookmarkCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { ActiveTab } from '../types';

export const MobileBottomNav: React.FC = () => {
  const { activeTab, setActiveTab, stats } = useApp();

  const tabs: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: number | string }[] = [
    {
      id: 'dashboard',
      label: 'Home',
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      id: 'extractor',
      label: 'Upload',
      icon: <UploadCloud className="w-5 h-5" />,
    },
    {
      id: 'numbers',
      label: 'Numbers',
      icon: <PhoneCall className="w-5 h-5" />,
      badge: stats.uniqueNumbers > 0 ? stats.uniqueNumbers : undefined,
    },
    {
      id: 'countries',
      label: 'Countries',
      icon: <Globe2 className="w-5 h-5" />,
      badge: stats.countriesCount > 0 ? stats.countriesCount : undefined,
    },
    {
      id: 'copied',
      label: 'Memory',
      icon: <BookmarkCheck className="w-5 h-5" />,
      badge: stats.previouslyCopiedNumbers > 0 ? stats.previouslyCopiedNumbers : undefined,
    },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800/90 shadow-2xl">
      <div className="grid grid-cols-5 h-16 items-center px-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center h-full relative transition-colors ${
                isActive ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                {tab.icon}
                {tab.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2.5 px-1 py-0.2 text-[9px] font-mono font-bold bg-blue-600 text-white rounded-full min-w-[14px] text-center">
                    {typeof tab.badge === 'number' && tab.badge > 999 ? '999+' : tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight">{tab.label}</span>
              {isActive && (
                <span className="absolute top-0 w-8 h-0.5 bg-blue-500 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
