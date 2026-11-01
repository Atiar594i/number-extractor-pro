import React from 'react';
import {
  LayoutDashboard,
  UploadCloud,
  PhoneCall,
  Globe2,
  CopyX,
  BookmarkCheck,
  AlertTriangle,
  History,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { ActiveTab } from '../types';

interface NavItem {
  id: ActiveTab;
  label: string;
  icon: React.ReactNode;
  badge?: number | string;
  badgeColor?: string;
}

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, stats } = useApp();

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'extractor',
      label: 'File Extractor',
      icon: <UploadCloud className="w-4 h-4" />,
      badge: stats.totalFiles > 0 ? stats.totalFiles : undefined,
      badgeColor: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
    },
    {
      id: 'numbers',
      label: 'All Numbers',
      icon: <PhoneCall className="w-4 h-4" />,
      badge: stats.totalNumbers > 0 ? stats.totalNumbers.toLocaleString() : undefined,
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
    },
    {
      id: 'countries',
      label: 'Country Wise',
      icon: <Globe2 className="w-4 h-4" />,
      badge: stats.countriesCount > 0 ? stats.countriesCount : undefined,
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
    },
    {
      id: 'duplicates',
      label: 'Duplicates',
      icon: <CopyX className="w-4 h-4" />,
      badge: stats.duplicateNumbers > 0 ? stats.duplicateNumbers.toLocaleString() : undefined,
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    },
    {
      id: 'copied',
      label: 'Copied Memory',
      icon: <BookmarkCheck className="w-4 h-4" />,
      badge: stats.previouslyCopiedNumbers > 0 ? stats.previouslyCopiedNumbers.toLocaleString() : undefined,
      badgeColor: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
    },
    {
      id: 'review',
      label: 'Needs Review',
      icon: <AlertTriangle className="w-4 h-4" />,
      badge: stats.reviewNumbers > 0 ? stats.reviewNumbers : undefined,
      badgeColor: 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
    },
    {
      id: 'history',
      label: 'Session History',
      icon: <History className="w-4 h-4" />,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="w-4 h-4" />,
    },
  ];

  return (
    <aside className="w-full lg:w-64 shrink-0 border-b lg:border-b-0 lg:border-r border-slate-800/80 bg-slate-900/60 backdrop-blur-xl p-3.5 flex flex-col justify-between">
      {/* Mobile Horizontal Scroll / Desktop Vertical List */}
      <div>
        <div className="hidden lg:block px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
          Navigation Menu
        </div>
        <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 scrollbar-none">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 whitespace-nowrap shrink-0 lg:shrink ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 ring-1 ring-white/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`transition-colors duration-200 ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && (
                  <span
                    className={`ml-2 px-2 py-0.5 text-[10px] rounded-full font-bold font-mono ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : item.badgeColor || 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Engine & Lead Shield Status Card */}
      <div className="hidden lg:block mt-6 p-3.5 rounded-2xl border border-slate-800/90 bg-gradient-to-b from-slate-950/80 to-slate-900/40 shadow-inner">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Lead Shield Active</span>
          </span>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        </div>
        <p className="text-[11px] text-slate-300 font-medium">Duplicate SMS Prevention</p>
        <p className="text-[10px] text-slate-500 mt-1 leading-snug">
          Copied numbers are protected against re-extraction.
        </p>
      </div>
    </aside>
  );
};
