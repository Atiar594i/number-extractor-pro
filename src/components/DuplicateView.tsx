import React, { useState } from 'react';
import {
  CopyX,
  Trash2,
  Copy,
  FileText,
  FileSpreadsheet,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  exportToTxt,
  exportToExcel,
  copyNumbersToClipboard,
  formatPhoneNumberBySetting,
} from '../utils/exportUtils';

export const DuplicateView: React.FC = () => {
  const {
    duplicateNumbers,
    numbers,
    settings,
    deleteNumbers,
    showToast,
  } = useApp();

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopySingle = async (item: typeof duplicateNumbers[0]) => {
    const val = formatPhoneNumberBySetting(item, settings.numberFormat);
    await navigator.clipboard.writeText(val);
    setCopiedId(item.id);
    showToast(`Copied ${val} to clipboard`, 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyAllDuplicates = async () => {
    if (duplicateNumbers.length === 0) return;
    await copyNumbersToClipboard(duplicateNumbers, settings.numberFormat);
    showToast(`Copied ${duplicateNumbers.length} duplicate numbers (1 per line)`, 'success');
  };

  const handlePurgeAllDuplicates = () => {
    if (duplicateNumbers.length === 0) {
      showToast('No duplicates to remove', 'info');
      return;
    }
    const duplicateIds = duplicateNumbers.map((n) => n.id);
    deleteNumbers(duplicateIds);
    showToast(`Successfully purged ${duplicateIds.length} duplicate instances from session!`, 'success');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <CopyX className="w-7 h-7 text-amber-400" />
            <span>Duplicate Number Detection & Removal</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Standardized duplicate matching using normalized international format. Keep your database clean.
          </p>
        </div>

        {/* Global Duplicate Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCopyAllDuplicates}
            disabled={duplicateNumbers.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors disabled:opacity-50"
          >
            <Copy className="w-3.5 h-3.5 text-blue-400" />
            <span>Copy All Duplicates</span>
          </button>

          <button
            type="button"
            onClick={() => exportToTxt(duplicateNumbers, 'Duplicates_List.txt', settings.numberFormat)}
            disabled={duplicateNumbers.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors disabled:opacity-50"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export TXT</span>
          </button>

          <button
            type="button"
            onClick={() => exportToExcel(duplicateNumbers, 'Duplicates_Report.xlsx')}
            disabled={duplicateNumbers.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors disabled:opacity-50"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />
            <span>Export Excel</span>
          </button>

          <button
            type="button"
            onClick={handlePurgeAllDuplicates}
            disabled={duplicateNumbers.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/30 transition-all disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Purge All Duplicates Now</span>
          </button>
        </div>
      </div>

      {/* Info Banner on Deduplication Logic */}
      <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-500/30 flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300 space-y-1">
          <div className="font-bold text-white text-sm">
            Auto-Deduplication Shield Active (১টি করে দেখাও — বাদবাকি ডুপ্লিকেট বাদ)
          </div>
          <p className="text-slate-400">
            যখন কোনো একটি নাম্বার বারবার আসে, আমাদের সিস্টেম মূল টেবিলে এবং কান্ট্রি লিস্টে শুধুমাত্র প্রথম ১টি অরিজিনাল কপি রাখে এবং বাদবাকি সকল অতিরিক্ত ডুপ্লিকেট স্বয়ংক্রিয়ভাবে বাদ দিয়ে দেয়। কপি বা এক্সপোর্ট করলেও শুধুমাত্র ১ কপিই বের হবে। নিচে বাদ দেওয়া ডুপ্লিকেট তালিকা দেওয়া হলো:
          </p>
        </div>
      </div>

      {/* Duplicate Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="text-xs font-sans font-semibold uppercase tracking-wider text-slate-400">
            Total Duplicates Detected
          </div>
          <div className="text-3xl font-extrabold text-amber-400 mt-2">
            {duplicateNumbers.length.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 mt-1 font-sans">
            Extra occurrences across all files
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="text-xs font-sans font-semibold uppercase tracking-wider text-slate-400">
            Duplication Rate
          </div>
          <div className="text-3xl font-extrabold text-white mt-2">
            {numbers.length > 0
              ? `${Math.round((duplicateNumbers.length / numbers.length) * 100)}%`
              : '0%'}
          </div>
          <div className="text-xs text-slate-500 mt-1 font-sans">
            Percentage of repeated numbers
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="text-xs font-sans font-semibold uppercase tracking-wider text-slate-400">
            Unique Numbers Retained
          </div>
          <div className="text-3xl font-extrabold text-emerald-400 mt-2">
            {(numbers.length - duplicateNumbers.length).toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 mt-1 font-sans">
            Primary instances kept safe
          </div>
        </div>
      </div>

      {/* Duplicates Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="p-3.5 w-14">#</th>
              <th className="p-3.5">Country</th>
              <th className="p-3.5">Duplicate Number</th>
              <th className="p-3.5">Duplicate Count</th>
              <th className="p-3.5">Source File & Row</th>
              <th className="p-3.5 text-right w-24">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono">
            {duplicateNumbers.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500 font-sans text-sm">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
                  Great news! No duplicate phone numbers found in your dataset.
                </td>
              </tr>
            ) : (
              duplicateNumbers.map((item, idx) => {
                const formattedNum = formatPhoneNumberBySetting(item, settings.numberFormat);

                return (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 text-slate-500 text-[11px]">{idx + 1}</td>
                    <td className="p-3.5 font-sans font-medium text-white">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{item.flag}</span>
                        <span>{item.countryName}</span>
                      </div>
                    </td>
                    <td className="p-3.5 font-bold text-amber-300 tracking-wide">
                      {formattedNum}
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold text-[11px]">
                        Duplicate #{item.duplicateCount}
                      </span>
                    </td>
                    <td className="p-3.5 font-sans text-[11px] text-slate-400">
                      {item.sourceFile}:{item.sourceRow}
                    </td>
                    <td className="p-3.5 text-right font-sans">
                      <button
                        type="button"
                        onClick={() => handleCopySingle(item)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                          copiedId === item.id
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                        }`}
                      >
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
