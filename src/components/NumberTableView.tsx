import React, { useState, useMemo } from 'react';
import {
  Search,
  Copy,
  Download,
  Trash2,
  CheckSquare,
  Square,
  FileSpreadsheet,
  FileText,
  ChevronLeft,
  ChevronRight,
  Check,
  BookmarkCheck,
  Sparkles,
  Zap,
  Filter,
  EyeOff,
  Eye,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  exportToTxt,
  exportToCsv,
  exportToExcel,
  copyNumbersToClipboard,
  formatPhoneNumberBySetting,
} from '../utils/exportUtils';
import type { ExtractedNumber } from '../types';

export const NumberTableView: React.FC = () => {
  const {
    numbers,
    countrySummaries,
    settings,
    updateSettings,
    selectedCountryFilter,
    setSelectedCountryFilter,
    deleteNumbers,
    markNumbersAsCopied,
    showToast,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'VALID' | 'POSSIBLE' | 'INVALID'>('ALL');
  const [duplicateFilter, setDuplicateFilter] = useState<'ALL' | 'UNIQUE' | 'DUPLICATES'>('ALL');
  const [leadFilter, setLeadFilter] = useState<'ALL' | 'FRESH_ONLY' | 'COPIED_ONLY'>('ALL');
  const [hideCopiedToggle, setHideCopiedToggle] = useState<boolean>(settings.hidePreviouslyCopied);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filtered dataset
  const filteredNumbers = useMemo(() => {
    return numbers.filter((item) => {
      // 0. Hide previously copied if toggle is on
      if (hideCopiedToggle && item.isPreviouslyCopied) {
        return false;
      }

      // 1. Lead filter (Fresh vs Already Copied)
      if (leadFilter === 'FRESH_ONLY' && item.isPreviouslyCopied) {
        return false;
      }
      if (leadFilter === 'COPIED_ONLY' && !item.isPreviouslyCopied) {
        return false;
      }

      // 2. Search query
      if (searchQuery) {
        const q = searchQuery.toLowerCase().trim();
        const matchNumber = item.normalized.toLowerCase().includes(q) || item.digitsOnly.includes(q);
        const matchCountry = item.countryName.toLowerCase().includes(q) || item.countryCode.toLowerCase().includes(q);
        const matchDial = item.dialCode.toLowerCase().includes(q);
        const matchSource = item.sourceFile.toLowerCase().includes(q);
        if (!matchNumber && !matchCountry && !matchDial && !matchSource) {
          return false;
        }
      }

      // 3. Country filter
      if (selectedCountryFilter && selectedCountryFilter !== 'ALL') {
        if (item.countryCode !== selectedCountryFilter) {
          return false;
        }
      }

      // 4. Status filter
      if (statusFilter !== 'ALL') {
        if (item.status !== statusFilter) {
          return false;
        }
      }

      // 5. Duplicate filter
      if (duplicateFilter === 'UNIQUE') {
        if (item.isDuplicate) return false;
      } else if (duplicateFilter === 'DUPLICATES') {
        if (!item.isDuplicate) return false;
      }

      return true;
    });
  }, [numbers, searchQuery, selectedCountryFilter, statusFilter, duplicateFilter, leadFilter, hideCopiedToggle]);

  // Counts for quick tabs
  const freshCount = useMemo(
    () => numbers.filter((n) => !n.isPreviouslyCopied && !n.isDuplicate && n.status !== 'REVIEW').length,
    [numbers]
  );
  const alreadyCopiedCount = useMemo(
    () => numbers.filter((n) => n.isPreviouslyCopied).length,
    [numbers]
  );

  // Pagination calculation
  const totalItems = filteredNumbers.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedNumbers = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredNumbers.slice(start, start + pageSize);
  }, [filteredNumbers, safeCurrentPage, pageSize]);

  // Selection handlers
  const handleToggleSelectAllPage = () => {
    const pageIds = paginatedNumbers.map((n) => n.id);
    const allSelected = pageIds.every((id) => selectedIds.has(id));

    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        pageIds.forEach((id) => next.delete(id));
      } else {
        pageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const handleSelectAllFiltered = () => {
    const allIds = new Set(filteredNumbers.map((n) => n.id));
    setSelectedIds(allIds);
    showToast(`Selected all ${filteredNumbers.length} filtered numbers`, 'info');
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleToggleItem = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Copy single number
  const handleCopySingle = async (item: ExtractedNumber) => {
    const val = formatPhoneNumberBySetting(item, settings.numberFormat);
    await navigator.clipboard.writeText(val);
    await markNumbersAsCopied([item]);
    setCopiedId(item.id);
    showToast(`Copied ${val} (Saved to Copied Memory)`, 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Copy selected numbers
  const handleCopySelected = async () => {
    let selectedList = numbers.filter((n) => selectedIds.has(n.id));
    if (selectedList.length === 0) {
      showToast('No numbers selected to copy', 'warning');
      return;
    }

    // Auto exclude already copied if enabled
    if (settings.autoExcludeCopiedOnExport) {
      const freshOnly = selectedList.filter((n) => !n.isPreviouslyCopied);
      if (freshOnly.length < selectedList.length) {
        const skipped = selectedList.length - freshOnly.length;
        if (freshOnly.length === 0) {
          showToast(`All ${skipped} selected numbers were ALREADY copied before! Nothing new to copy.`, 'warning');
          return;
        }
        showToast(`Skipped ${skipped} already-copied number(s). Copying ${freshOnly.length} fresh leads...`, 'info');
        selectedList = freshOnly;
      }
    }

    await copyNumbersToClipboard(selectedList, settings.numberFormat);
    await markNumbersAsCopied(selectedList);
    showToast(`Copied ${selectedList.length} numbers (1 per line). Saved to Memory!`, 'success');
  };

  // Copy all fresh numbers
  const handleCopyAllFreshOnly = async () => {
    const freshList = filteredNumbers.filter((n) => !n.isPreviouslyCopied);
    if (freshList.length === 0) {
      showToast('No fresh uncopied numbers available in active filter!', 'warning');
      return;
    }
    await copyNumbersToClipboard(freshList, settings.numberFormat);
    await markNumbersAsCopied(freshList);
    showToast(`Copied ${freshList.length} fresh uncopied numbers (1 per line)!`, 'success');
  };

  // Copy all filtered numbers
  const handleCopyAllFiltered = async () => {
    if (filteredNumbers.length === 0) {
      showToast('No numbers available to copy', 'warning');
      return;
    }

    let targetList = filteredNumbers;
    if (settings.autoExcludeCopiedOnExport) {
      const freshOnly = filteredNumbers.filter((n) => !n.isPreviouslyCopied);
      const skipped = filteredNumbers.length - freshOnly.length;
      if (skipped > 0) {
        if (freshOnly.length === 0) {
          showToast(`All ${skipped} filtered numbers were ALREADY copied before!`, 'warning');
          return;
        }
        showToast(`Excluded ${skipped} already-copied numbers. Copying ${freshOnly.length} fresh leads...`, 'info');
        targetList = freshOnly;
      }
    }

    await copyNumbersToClipboard(targetList, settings.numberFormat);
    await markNumbersAsCopied(targetList);
    showToast(`Copied ${targetList.length} numbers to clipboard (1 per line)`, 'success');
  };

  // Export handlers
  const handleExportTxt = async (targetList: ExtractedNumber[], label: string) => {
    exportToTxt(targetList, `${label}_Numbers.txt`, settings.numberFormat);
    await markNumbersAsCopied(targetList);
    showToast(`Exported ${targetList.length} numbers as TXT and saved to memory`, 'success');
  };

  const handleExportCsv = async (targetList: ExtractedNumber[], label: string) => {
    exportToCsv(targetList, `${label}_Numbers.csv`);
    await markNumbersAsCopied(targetList);
    showToast(`Exported ${targetList.length} numbers as CSV`, 'success');
  };

  const handleExportExcel = async (targetList: ExtractedNumber[], label: string) => {
    exportToExcel(targetList, `${label}_Numbers.xlsx`);
    await markNumbersAsCopied(targetList);
    showToast(`Exported ${targetList.length} numbers as Excel (.xlsx)`, 'success');
  };

  const getSelectedNumbers = () => numbers.filter((n) => selectedIds.has(n.id));

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Info & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <span>Extracted Phone Numbers</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 font-mono">
              {filteredNumbers.length.toLocaleString()} visible
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Displaying numbers with verified country dial codes. Already-copied leads are protected from being duplicated.
          </p>
        </div>

        {/* Global Export & Copy Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {freshCount > 0 && (
            <button
              type="button"
              onClick={handleCopyAllFreshOnly}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all active:scale-95"
              title="Copy only fresh leads that have never been copied before"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Copy Fresh Only ({freshCount})</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopyAllFiltered}
            disabled={filteredNumbers.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors disabled:opacity-50"
            title="Copy all currently filtered numbers"
          >
            <Copy className="w-3.5 h-3.5 text-blue-400" />
            <span>Copy Filtered ({filteredNumbers.length})</span>
          </button>

          <button
            type="button"
            onClick={() => handleExportTxt(filteredNumbers, 'Extracted')}
            disabled={filteredNumbers.length === 0}
            className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors disabled:opacity-50"
            title="Download clean TXT"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
            <span>TXT</span>
          </button>

          <button
            type="button"
            onClick={() => handleExportCsv(filteredNumbers, 'Extracted')}
            disabled={filteredNumbers.length === 0}
            className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors disabled:opacity-50"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-400" />
            <span>CSV</span>
          </button>

          <button
            type="button"
            onClick={() => handleExportExcel(filteredNumbers, 'Extracted')}
            disabled={filteredNumbers.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition-all disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Excel (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Quick Lead Filter Pills Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-slate-400 font-medium mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-blue-400" />
            Filter Leads:
          </span>

          <button
            type="button"
            onClick={() => {
              setLeadFilter('ALL');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
              leadFilter === 'ALL'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            All Numbers ({numbers.length})
          </button>

          <button
            type="button"
            onClick={() => {
              setLeadFilter('FRESH_ONLY');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all flex items-center gap-1.5 ${
              leadFilter === 'FRESH_ONLY'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-1 ring-emerald-400'
                : 'bg-slate-950 text-emerald-400 hover:text-emerald-300 border border-emerald-500/30'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            <span>Fresh Leads ({freshCount})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setLeadFilter('COPIED_ONLY');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all flex items-center gap-1.5 ${
              leadFilter === 'COPIED_ONLY'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 ring-1 ring-purple-400'
                : 'bg-slate-950 text-purple-300 hover:text-purple-200 border border-purple-500/30'
            }`}
          >
            <BookmarkCheck className="w-3.5 h-3.5 text-purple-400" />
            <span>Already Copied ({alreadyCopiedCount})</span>
          </button>
        </div>

        {/* Toggle to completely hide copied */}
        <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] text-slate-300 font-medium px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700">
          <input
            type="checkbox"
            checked={hideCopiedToggle}
            onChange={(e) => {
              setHideCopiedToggle(e.target.checked);
              updateSettings({ hidePreviouslyCopied: e.target.checked });
              setCurrentPage(1);
            }}
            className="w-3.5 h-3.5 rounded text-purple-600 bg-slate-800 border-slate-700"
          />
          <span className="flex items-center gap-1">
            {hideCopiedToggle ? <EyeOff className="w-3.5 h-3.5 text-purple-400" /> : <Eye className="w-3.5 h-3.5 text-slate-400" />}
            Hide Already Copied Numbers
          </span>
        </label>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search box */}
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search phone number, country, dialing code..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950/70 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Country filter */}
          <div>
            <select
              value={selectedCountryFilter || 'ALL'}
              onChange={(e) => {
                setSelectedCountryFilter(e.target.value === 'ALL' ? null : e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-950/70 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Countries ({countrySummaries.length})</option>
              {countrySummaries.map((c) => (
                <option key={c.countryCode} value={c.countryCode}>
                  {c.flag} {c.countryName} ({c.dialCode}) — {c.totalCount} ({c.freshCount} fresh)
                </option>
              ))}
            </select>
          </div>

          {/* Duplicate filter */}
          <div>
            <select
              value={duplicateFilter}
              onChange={(e) => {
                setDuplicateFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-950/70 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All (Unique & Duplicates)</option>
              <option value="UNIQUE">Unique Only</option>
              <option value="DUPLICATES">Duplicates Only</option>
            </select>
          </div>

          {/* Validation Status filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-950/70 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="VALID">Valid Numbers Only</option>
              <option value="POSSIBLE">Possible Numbers Only</option>
              <option value="INVALID">Invalid Numbers</option>
            </select>
          </div>
        </div>

        {/* Format Selector Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Display Format:</span>
            <div className="inline-flex rounded-lg bg-slate-950 p-0.5 border border-slate-800">
              <button
                type="button"
                onClick={() => updateSettings({ numberFormat: 'e164' })}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                  settings.numberFormat === 'e164'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                E.164 (+96891234567)
              </button>
              <button
                type="button"
                onClick={() => updateSettings({ numberFormat: 'international' })}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                  settings.numberFormat === 'international'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                International (+968 9123 4567)
              </button>
              <button
                type="button"
                onClick={() => updateSettings({ numberFormat: 'national' })}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                  settings.numberFormat === 'national'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                National
              </button>
              <button
                type="button"
                onClick={() => updateSettings({ numberFormat: 'digitsOnly' })}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                  settings.numberFormat === 'digitsOnly'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Digits Only
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSelectAllFiltered}
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
            >
              Select All {filteredNumbers.length}
            </button>

            <div className="flex items-center gap-2 text-slate-400 font-mono">
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white"
              >
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
                <option value="250">250</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Action Toolbar */}
      {selectedIds.size > 0 && (
        <div className="p-3 rounded-xl bg-blue-950/60 border border-blue-500/40 flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in">
          <div className="flex items-center gap-2 font-medium text-white">
            <span className="px-2 py-0.5 rounded-full bg-blue-500 text-white font-bold font-mono">
              {selectedIds.size}
            </span>
            <span>numbers selected</span>
            <button
              onClick={handleClearSelection}
              className="text-blue-300 hover:text-white underline ml-2 text-xs"
            >
              Clear selection
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySelected}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Selected</span>
            </button>

            <button
              onClick={() => handleExportTxt(getSelectedNumbers(), 'Selected')}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span>TXT</span>
            </button>

            <button
              onClick={() => handleExportExcel(getSelectedNumbers(), 'Selected')}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-blue-400" />
              <span>Excel</span>
            </button>

            <button
              onClick={() => {
                deleteNumbers(Array.from(selectedIds));
                setSelectedIds(new Set());
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="p-3.5 w-10 text-center">
                <button
                  type="button"
                  onClick={handleToggleSelectAllPage}
                  className="text-slate-400 hover:text-white transition-colors"
                  title="Select all on this page"
                >
                  {paginatedNumbers.length > 0 &&
                  paginatedNumbers.every((n) => selectedIds.has(n.id)) ? (
                    <CheckSquare className="w-4 h-4 text-blue-400" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
              </th>
              <th className="p-3.5 w-14">#</th>
              <th className="p-3.5">Country</th>
              <th className="p-3.5">Dial Code</th>
              <th className="p-3.5">Phone Number</th>
              <th className="p-3.5">Lead Status</th>
              <th className="p-3.5">Type</th>
              <th className="p-3.5">Validation</th>
              <th className="p-3.5">Duplicate</th>
              <th className="p-3.5">Source</th>
              <th className="p-3.5 text-right w-24">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono">
            {paginatedNumbers.length === 0 ? (
              <tr>
                <td colSpan={11} className="p-8 text-center text-slate-500 font-sans text-sm">
                  {numbers.length === 0
                    ? 'No phone numbers extracted yet. Upload a spreadsheet or load sample data.'
                    : 'No numbers match your active search or filters.'}
                </td>
              </tr>
            ) : (
              paginatedNumbers.map((item, idx) => {
                const isSelected = selectedIds.has(item.id);
                const serialNum = (safeCurrentPage - 1) * pageSize + idx + 1;
                const formattedNum = formatPhoneNumberBySetting(item, settings.numberFormat);

                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      isSelected
                        ? 'bg-blue-950/20'
                        : item.isPreviouslyCopied
                        ? 'bg-purple-950/5'
                        : ''
                    }`}
                  >
                    <td className="p-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleItem(item.id)}
                        className="w-4 h-4 rounded text-blue-600 bg-slate-800 border-slate-700"
                      />
                    </td>
                    <td className="p-3.5 text-slate-500 text-[11px]">{serialNum}</td>
                    <td className="p-3.5 font-sans font-medium text-white">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{item.flag}</span>
                        <span>{item.countryName}</span>
                      </div>
                    </td>
                    <td className="p-3.5 text-slate-400 font-mono">{item.dialCode || '—'}</td>
                    <td className="p-3.5 font-bold tracking-wide">
                      <span className={item.isPreviouslyCopied ? 'text-purple-300' : 'text-white'}>
                        {formattedNum}
                      </span>
                    </td>

                    {/* LEAD STATUS COLUMN: Fresh Lead vs Already Copied */}
                    <td className="p-3.5 font-sans text-[11px]">
                      {item.isPreviouslyCopied ? (
                        <span
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 font-semibold cursor-help"
                          title={
                            item.copiedAt
                              ? `Copied on ${new Date(item.copiedAt).toLocaleDateString()}`
                              : 'Already copied in a previous session'
                          }
                        >
                          <BookmarkCheck className="w-3 h-3 text-purple-400" /> Already Copied
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold">
                          <Sparkles className="w-3 h-3 text-emerald-400" /> Fresh Lead
                        </span>
                      )}
                    </td>

                    <td className="p-3.5 font-sans text-[11px]">
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                        {item.numberType}
                      </span>
                    </td>
                    <td className="p-3.5 font-sans text-[11px]">
                      {item.isValid ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <Check className="w-3 h-3" /> Valid
                        </span>
                      ) : item.isPossible ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          Possible
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          Invalid
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 font-sans text-[11px]">
                      {item.isDuplicate ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          Duplicate ({item.duplicateCount})
                        </span>
                      ) : (
                        <span className="text-slate-500">Unique</span>
                      )}
                    </td>
                    <td className="p-3.5 font-sans text-[11px] text-slate-400 truncate max-w-[150px]">
                      {item.sourceFile}:{item.sourceRow}
                    </td>
                    <td className="p-3.5 text-right font-sans">
                      <button
                        type="button"
                        onClick={() => handleCopySingle(item)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                          copiedId === item.id
                            ? 'bg-emerald-500 text-white'
                            : item.isPreviouslyCopied
                            ? 'bg-purple-900/40 text-purple-200 border border-purple-500/30 hover:bg-purple-800/50'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                        }`}
                        title={item.isPreviouslyCopied ? 'Already copied before. Click to copy again.' : 'Copy phone number'}
                      >
                        {copiedId === item.id ? (
                          <>
                            <Check className="w-3 h-3" />
                            <span>Copied</span>
                          </>
                        ) : item.isPreviouslyCopied ? (
                          <>
                            <BookmarkCheck className="w-3 h-3 text-purple-400" />
                            <span>Re-copy</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            Showing {(safeCurrentPage - 1) * pageSize + 1} to{' '}
            {Math.min(safeCurrentPage * pageSize, totalItems)} of {totalItems.toLocaleString()} numbers
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safeCurrentPage === 1}
              className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="font-mono px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-white">
              Page {safeCurrentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safeCurrentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
