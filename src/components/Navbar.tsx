import React from 'react';
import {
  FileSpreadsheet,
  Moon,
  Sun,
  ShieldCheck,
  Sparkles,
  Upload,
  Trash2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Navbar: React.FC = () => {
  const {
    settings,
    updateSettings,
    stats,
    setActiveTab,
    loadSampleData,
    clearAllData,
    isProcessing,
  } = useApp();

  const toggleTheme = () => {
    updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-md transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-2.5 cursor-pointer min-w-0" onClick={() => setActiveTab('dashboard')}>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-0.5 shadow-lg shadow-blue-500/20 flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
                <FileSpreadsheet className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm sm:text-base text-slate-100 tracking-tight truncate">
                  Number Extractor
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
                  PRO
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block">
                Enterprise SMS & Phone Intelligence
              </p>
            </div>
          </div>

          {/* Privacy & Security Tag */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>100% Private • Local Browser Processing</span>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2.5">
            {stats.totalNumbers === 0 ? (
              <button
                onClick={loadSampleData}
                disabled={isProcessing}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600/10 text-blue-400 hover:bg-blue-600/20 border border-blue-500/30 transition-all duration-200"
                title="Load sample Flex SMS Failed SMS Report dataset to test right away"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>Load Sample Report</span>
              </button>
            ) : (
              <button
                onClick={clearAllData}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 transition-all duration-200"
                title="Clear current data"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Data</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('extractor')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/25 transition-all duration-200 active:scale-95"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Files</span>
            </button>

            {/* Dark/Light mode toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
              title={`Switch to ${settings.theme === 'dark' ? 'Light' : 'Dark'} mode`}
            >
              {settings.theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-300" />
              ) : (
                <Moon className="w-4 h-4 text-slate-300" />
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
