import React, { useEffect, useState, useMemo } from 'react';
import {
  BookmarkCheck,
  Search,
  Trash2,
  Copy,
  FileText,
  FileSpreadsheet,
  RefreshCw,
  Calendar,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { exportToTxt, exportToExcel } from '../utils/exportUtils';
import type { CopiedRecord, ExtractedNumber } from '../types';

export const CopiedMemoryView: React.FC = () => {
  const {
    getAllCopiedMemory,
    clearCopiedMemory,
    removeNumbersFromMemory,
    settings,
    showToast,
  } = useApp();

  const [records, setRecords] = useState<CopiedRecord[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchRecords = async () => {
    setIsLoading(true);
    const data = await getAllCopiedMemory();
    setRecords(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const filtered = useMemo(() => {
    if (!search) return records;
    const q = search.toLowerCase().trim();
    return records.filter(
      (r) =>
        r.normalized.toLowerCase().includes(q) ||
        r.countryName.toLowerCase().includes(q) ||
        r.dialCode.toLowerCase().includes(q)
    );
  }, [records, search]);

  const handleCopySingle = (normalized: string) => {
    navigator.clipboard.writeText(normalized);
    showToast(`Copied ${normalized} to clipboard`, 'success');
  };

  const handleRemoveSingle = async (normalized: string) => {
    await removeNumbersFromMemory([normalized]);
    setRecords((prev) => prev.filter((r) => r.normalized !== normalized));
  };

  const handleClearAll = async () => {
    if (records.length === 0) return;
    if (
      window.confirm(
        'Clear all previously copied numbers memory? They will be treated as fresh leads again.'
      )
    ) {
      await clearCopiedMemory();
      setRecords([]);
    }
  };

  const handleExportTxt = () => {
    const fakeExtracted: ExtractedNumber[] = records.map((r, i) => ({
      id: `copied_${i}`,
      original: r.normalized,
      normalized: r.normalized,
      nationalFormat: r.normalized,
      internationalFormat: r.normalized,
      digitsOnly: r.normalized.replace(/\D/g, ''),
      countryCode: '',
      countryName: r.countryName,
      dialCode: r.dialCode,
      flag: '🌐',
      status: 'VALID',
      isValid: true,
      isPossible: true,
      numberType: 'MOBILE',
      sourceFile: r.sourceFile || 'History',
      sourceRow: i + 1,
      isDuplicate: false,
      duplicateCount: 0,
      isPreviouslyCopied: true,
      confidence: 'HIGH',
    }));

    exportToTxt(fakeExtracted, 'Lifetime_Copied_Numbers_Memory.txt', settings.numberFormat);
    showToast(`Exported ${records.length} copied numbers as TXT`, 'success');
  };

  const handleExportExcel = () => {
    const fakeExtracted: ExtractedNumber[] = records.map((r, i) => ({
      id: `copied_${i}`,
      original: r.normalized,
      normalized: r.normalized,
      nationalFormat: r.normalized,
      internationalFormat: r.normalized,
      digitsOnly: r.normalized.replace(/\D/g, ''),
      countryCode: '',
      countryName: r.countryName,
      dialCode: r.dialCode,
      flag: '🌐',
      status: 'VALID',
      isValid: true,
      isPossible: true,
      numberType: 'MOBILE',
      sourceFile: r.sourceFile || 'History',
      sourceRow: i + 1,
      isDuplicate: false,
      duplicateCount: 0,
      isPreviouslyCopied: true,
      confidence: 'HIGH',
    }));

    exportToExcel(fakeExtracted, 'Lifetime_Copied_Numbers_Memory.xlsx');
    showToast(`Exported ${records.length} copied numbers as Excel`, 'success');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <BookmarkCheck className="w-7 h-7 text-purple-400" />
            <span>Copied Numbers Memory (Used Leads Shield)</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Every phone number you copy is permanently remembered here. When you upload future spreadsheets, previously used numbers will never be copied twice!
          </p>
        </div>

        {records.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportTxt}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export TXT</span>
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-blue-400" />
              <span>Export Excel</span>
            </button>

            <button
              type="button"
              onClick={handleClearAll}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600/20 text-rose-300 hover:bg-rose-600/30 border border-rose-500/30 text-xs font-bold transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset Copied Memory</span>
            </button>
          </div>
        )}
      </div>

      {/* Info Shield Card */}
      <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/30 flex items-start gap-3 text-xs text-purple-200">
        <ShieldCheck className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
        <div>
          <div className="font-semibold text-white">
            Lead Protection Active: Duplicate SMS prevention
          </div>
          <p className="text-purple-300/80 mt-1 leading-relaxed">
            Whenever you copy numbers from this app, they are stored in this memory. If you re-upload the same file or a different report containing the same phone numbers, the engine detects them as <strong>"Already Copied"</strong> and prevents accidental duplicate sending.
          </p>
        </div>
      </div>

      {/* Stats and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search copied phone numbers or countries..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950/70 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex items-center gap-3 text-slate-400 font-mono text-xs">
          <span>
            Total in Memory: <strong className="text-white">{records.length.toLocaleString()}</strong>
          </span>
          <button
            onClick={fetchRecords}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
            title="Refresh memory"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="p-3.5 w-14">#</th>
              <th className="p-3.5">Country</th>
              <th className="p-3.5">Copied Phone Number</th>
              <th className="p-3.5">Copied Timestamp</th>
              <th className="p-3.5">Original File</th>
              <th className="p-3.5 text-right w-28">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500 font-sans text-sm">
                  Loading copied numbers from IndexedDB memory...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500 font-sans text-sm">
                  {records.length === 0
                    ? 'No numbers have been copied yet. Numbers you copy will be tracked here.'
                    : 'No copied numbers match your search.'}
                </td>
              </tr>
            ) : (
              filtered.map((item, idx) => (
                <tr key={item.normalized} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3.5 text-slate-500 text-[11px]">{idx + 1}</td>
                  <td className="p-3.5 font-sans font-medium text-white">
                    {item.countryName} ({item.dialCode})
                  </td>
                  <td className="p-3.5 font-bold text-purple-300 tracking-wide">
                    {item.normalized}
                  </td>
                  <td className="p-3.5 font-sans text-[11px] text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      {new Date(item.copiedAt).toLocaleString()}
                    </span>
                  </td>
                  <td className="p-3.5 font-sans text-[11px] text-slate-400 truncate max-w-[150px]">
                    {item.sourceFile || '—'}
                  </td>
                  <td className="p-3.5 text-right font-sans">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleCopySingle(item.normalized)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                        title="Copy again"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveSingle(item.normalized)}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                        title="Remove from memory (Mark as fresh lead again)"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
