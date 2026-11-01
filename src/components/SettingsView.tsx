import React from 'react';
import {
  Settings,
  Moon,
  Sun,
  ShieldCheck,
  Sliders,
  Trash2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { COUNTRIES_META } from '../constants/countries';
import { clearAllSessions } from '../utils/historyStorage';

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    clearAllData,
    clearCopiedMemory,
    showToast,
  } = useApp();

  const handleClearHistory = async () => {
    if (window.confirm('Clear all session history from local IndexedDB?')) {
      await clearAllSessions();
      showToast('Session history wiped successfully', 'success');
    }
  };

  const handleClearAllApp = async () => {
    if (
      window.confirm(
        'This will reset all settings, clear current numbers, and wipe IndexedDB history. Proceed?'
      )
    ) {
      await clearAllSessions();
      clearAllData();
      localStorage.removeItem('NumberExtractorPro_Settings');
      showToast('All application data cleared', 'info');
      window.location.reload();
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-4xl">
      {/* Header Info */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
          <Settings className="w-7 h-7 text-blue-400" />
          <span>Application Settings</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Customize phone extraction behavior, default export preferences, and safety filters.
        </p>
      </div>

      {/* SECTION 1: Appearance & Export Preferences */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-6">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Sliders className="w-4 h-4 text-blue-400" />
          <span>General & Formatting Preferences</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
          {/* Theme */}
          <div className="space-y-2">
            <label className="font-semibold text-slate-200 block">Theme Mode</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => updateSettings({ theme: 'dark' })}
                className={`flex-1 py-2 rounded-xl border flex items-center justify-center gap-2 font-semibold transition-all ${
                  settings.theme === 'dark'
                    ? 'border-blue-500 bg-blue-500/10 text-white'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white'
                }`}
              >
                <Moon className="w-4 h-4 text-indigo-400" />
                <span>Dark Navy (Default)</span>
              </button>

              <button
                type="button"
                onClick={() => updateSettings({ theme: 'light' })}
                className={`flex-1 py-2 rounded-xl border flex items-center justify-center gap-2 font-semibold transition-all ${
                  settings.theme === 'light'
                    ? 'border-blue-500 bg-blue-500/10 text-white'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white'
                }`}
              >
                <Sun className="w-4 h-4 text-amber-400" />
                <span>Light Mode</span>
              </button>
            </div>
          </div>

          {/* Default Export Format */}
          <div className="space-y-2">
            <label className="font-semibold text-slate-200 block">
              Default Export Format
            </label>
            <select
              value={settings.defaultExportFormat}
              onChange={(e) =>
                updateSettings({ defaultExportFormat: e.target.value as any })
              }
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="txt">TXT (Raw phone numbers, one per line)</option>
              <option value="xlsx">Excel (.xlsx with string format)</option>
              <option value="csv">CSV (Comma-separated values)</option>
            </select>
          </div>

          {/* Number Output Style */}
          <div className="space-y-2">
            <label className="font-semibold text-slate-200 block">
              Default Phone Number Format
            </label>
            <select
              value={settings.numberFormat}
              onChange={(e) => updateSettings({ numberFormat: e.target.value as any })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="e164">E.164 Standard (+96891234567) - Recommended</option>
              <option value="international">International (+968 9123 4567)</option>
              <option value="national">National Format</option>
              <option value="digitsOnly">Digits Only (96891234567)</option>
            </select>
          </div>

          {/* Default Fallback Country */}
          <div className="space-y-2">
            <label className="font-semibold text-slate-200 block">
              Fallback Country (Optional)
            </label>
            <select
              value={settings.defaultFallbackCountry || ''}
              onChange={(e) => updateSettings({ defaultFallbackCountry: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">None (Auto-detect via international dial code)</option>
              {Object.values(COUNTRIES_META).map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.name} ({c.dialCode})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* SECTION 2: Extraction Rules & Phone Length Limits */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-6">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Validation Rules & Length Thresholds</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
          {/* Min Length */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="font-semibold text-slate-200">
                Minimum Phone Number Length
              </label>
              <span className="font-mono text-blue-400 font-bold">
                {settings.minPhoneLength} digits
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="10"
              value={settings.minPhoneLength}
              onChange={(e) => updateSettings({ minPhoneLength: Number(e.target.value) })}
              className="w-full accent-blue-500"
            />
            <p className="text-slate-500 text-[11px]">
              Filters out short verification codes and IDs (default: 7).
            </p>
          </div>

          {/* Max Length */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="font-semibold text-slate-200">
                Maximum Phone Number Length
              </label>
              <span className="font-mono text-blue-400 font-bold">
                {settings.maxPhoneLength} digits
              </span>
            </div>
            <input
              type="range"
              min="12"
              max="18"
              value={settings.maxPhoneLength}
              onChange={(e) => updateSettings({ maxPhoneLength: Number(e.target.value) })}
              className="w-full accent-blue-500"
            />
            <p className="text-slate-500 text-[11px]">
              Filters out timestamps, card numbers, and long hashes (default: 16).
            </p>
          </div>
        </div>

        {/* Toggles */}
        <div className="pt-4 border-t border-slate-800 space-y-3 text-xs">
          <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-800 cursor-pointer">
            <div>
              <div className="font-semibold text-slate-200">
                Strict Demo OTP and Verification Code Filtering
              </div>
              <div className="text-slate-400 text-[11px] mt-0.5">
                Automatically ignores Telegram codes, login codes, and SMS verification codes.
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.strictOtpFiltering}
              onChange={(e) => updateSettings({ strictOtpFiltering: e.target.checked })}
              className="w-4 h-4 rounded text-blue-600 bg-slate-800 border-slate-700"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-800 cursor-pointer">
            <div>
              <div className="font-semibold text-slate-200">
                Automatic Duplicate Removal (Keep 1 Copy Only — বাদবাকি ডুপ্লিকেট বাদ)
              </div>
              <div className="text-slate-400 text-[11px] mt-0.5">
                When a number appears repeatedly, shows and exports only 1 unique instance and automatically excludes all extra duplicates.
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.autoDeduplicate}
              onChange={(e) => updateSettings({ autoDeduplicate: e.target.checked })}
              className="w-4 h-4 rounded text-blue-600 bg-slate-800 border-slate-700"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl bg-purple-950/20 border border-purple-500/30 cursor-pointer">
            <div>
              <div className="font-semibold text-purple-200">
                Auto-Exclude Already Copied Numbers on Export / Copy
              </div>
              <div className="text-slate-400 text-[11px] mt-0.5">
                Prevents already used leads from being re-copied or exported again when processing repeated files.
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.autoExcludeCopiedOnExport}
              onChange={(e) => updateSettings({ autoExcludeCopiedOnExport: e.target.checked })}
              className="w-4 h-4 rounded text-purple-600 bg-slate-800 border-slate-700"
            />
          </label>
        </div>
      </div>

      {/* SECTION 3: Danger Zone */}
      <div className="p-6 rounded-2xl bg-rose-950/20 border border-rose-500/20 space-y-4">
        <h2 className="text-base font-bold text-rose-300 flex items-center gap-2">
          <Trash2 className="w-4 h-4 text-rose-400" />
          <span>Storage & Data Reset Zone</span>
        </h2>
        <p className="text-xs text-rose-200/80">
          All file processing and extraction takes place entirely in your local browser sandbox. You can reset and purge your local IndexedDB storage anytime.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleClearHistory}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            Clear Processing History
          </button>

          <button
            type="button"
            onClick={clearCopiedMemory}
            className="px-3.5 py-2 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 text-purple-200 text-xs font-semibold border border-purple-500/40 transition-colors"
          >
            Reset Copied Leads Memory
          </button>

          <button
            type="button"
            onClick={handleClearAllApp}
            className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/30 transition-all"
          >
            Wipe All Application Data & Reset
          </button>
        </div>
      </div>
    </div>
  );
};
