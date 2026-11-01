import React, { useState, useMemo } from 'react';
import {
  Globe2,
  Search,
  Copy,
  Download,
  FileText,
  ArrowLeft,
  Check,
  Archive,
  BookmarkCheck,
  Sparkles,
  Zap,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  exportToTxt,
  exportToExcel,
  copyNumbersToClipboard,
  formatPhoneNumberBySetting,
  exportCountryWiseZip,
} from '../utils/exportUtils';
import type { ExtractedNumber } from '../types';

export const CountryView: React.FC = () => {
  const {
    countrySummaries,
    selectedCountryFilter,
    setSelectedCountryFilter,
    settings,
    markNumbersAsCopied,
    showToast,
  } = useApp();

  const [countrySearch, setCountrySearch] = useState('');
  const [selectedCountryCodes, setSelectedCountryCodes] = useState<Set<string>>(new Set());

  // Deep dive inside a single selected country
  const activeCountry = useMemo(() => {
    if (!selectedCountryFilter) return null;
    return countrySummaries.find((c) => c.countryCode === selectedCountryFilter) || null;
  }, [countrySummaries, selectedCountryFilter]);

  // Inside single country state
  const [numberSearch, setNumberSearch] = useState('');
  const [countryDeduplicate, setCountryDeduplicate] = useState<boolean>(true);
  const [singleCountrySelectedIds, setSingleCountrySelectedIds] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filtered countries list
  const filteredCountries = useMemo(() => {
    return countrySummaries.filter((c) => {
      if (!countrySearch) return true;
      const q = countrySearch.toLowerCase().trim();
      return (
        c.countryName.toLowerCase().includes(q) ||
        c.countryCode.toLowerCase().includes(q) ||
        c.dialCode.toLowerCase().includes(q)
      );
    });
  }, [countrySummaries, countrySearch]);

  // Multi-country selection handlers
  const handleToggleCountryCheckbox = (code: string) => {
    setSelectedCountryCodes((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  };

  const handleSelectAllCountries = () => {
    if (selectedCountryCodes.size === countrySummaries.length) {
      setSelectedCountryCodes(new Set());
    } else {
      setSelectedCountryCodes(new Set(countrySummaries.map((c) => c.countryCode)));
    }
  };

  const handleExportSelectedCountriesCombinedTxt = async () => {
    if (selectedCountryCodes.size === 0) {
      showToast('Please select at least one country to export', 'warning');
      return;
    }
    const combinedNumbers = countrySummaries
      .filter((c) => selectedCountryCodes.has(c.countryCode))
      .flatMap((c) => c.numbers);

    exportToTxt(combinedNumbers, `Selected_Countries_Numbers.txt`, settings.numberFormat);
    await markNumbersAsCopied(combinedNumbers);
    showToast(`Exported ${combinedNumbers.length} numbers from ${selectedCountryCodes.size} countries as TXT`, 'success');
  };

  const handleExportSelectedCountriesZip = async () => {
    if (selectedCountryCodes.size === 0) {
      showToast('Please select at least one country to export', 'warning');
      return;
    }
    const combinedNumbers = countrySummaries
      .filter((c) => selectedCountryCodes.has(c.countryCode))
      .flatMap((c) => c.numbers);

    showToast('Generating country ZIP package...', 'info');
    await exportCountryWiseZip(combinedNumbers, 'Selected_Countries_Package.zip', settings.numberFormat);
    await markNumbersAsCopied(combinedNumbers);
    showToast('Country package ZIP downloaded successfully', 'success');
  };

  // Inside single country numbers filtering
  const filteredCountryNumbers = useMemo(() => {
    if (!activeCountry) return [];
    let list = activeCountry.numbers;
    if (countryDeduplicate) {
      list = list.filter((n) => !n.isDuplicate);
    }
    return list.filter((item) => {
      if (!numberSearch) return true;
      const q = numberSearch.toLowerCase().trim();
      return (
        item.normalized.toLowerCase().includes(q) ||
        item.digitsOnly.includes(q) ||
        item.sourceFile.toLowerCase().includes(q)
      );
    });
  }, [activeCountry, numberSearch, countryDeduplicate]);

  const handleToggleSingleNumber = (id: string) => {
    setSingleCountrySelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleSelectAllInCountry = () => {
    if (singleCountrySelectedIds.size === filteredCountryNumbers.length) {
      setSingleCountrySelectedIds(new Set());
    } else {
      setSingleCountrySelectedIds(new Set(filteredCountryNumbers.map((n) => n.id)));
    }
  };

  const handleCopySingle = async (item: ExtractedNumber) => {
    const val = formatPhoneNumberBySetting(item, settings.numberFormat);
    await navigator.clipboard.writeText(val);
    await markNumbersAsCopied([item]);
    setCopiedId(item.id);
    showToast(`Copied ${val} to clipboard`, 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyFreshInCountry = async () => {
    if (!activeCountry) return;
    const fresh = activeCountry.numbers.filter((n) => !n.isPreviouslyCopied);
    if (fresh.length === 0) {
      showToast(`All numbers in ${activeCountry.countryName} were already copied before!`, 'warning');
      return;
    }
    await copyNumbersToClipboard(fresh, settings.numberFormat);
    await markNumbersAsCopied(fresh);
    showToast(`Copied ${fresh.length} fresh numbers for ${activeCountry.countryName} (1 per line)`, 'success');
  };

  const handleCopyAllInCountry = async () => {
    if (!activeCountry || filteredCountryNumbers.length === 0) return;
    await copyNumbersToClipboard(filteredCountryNumbers, settings.numberFormat);
    await markNumbersAsCopied(filteredCountryNumbers);
    showToast(`Copied ${filteredCountryNumbers.length} numbers for ${activeCountry.countryName} (1 per line)`, 'success');
  };

  const handleCopySelectedInCountry = async () => {
    if (!activeCountry) return;
    const selected = activeCountry.numbers.filter((n) => singleCountrySelectedIds.has(n.id));
    if (selected.length === 0) {
      showToast('No numbers selected in this country', 'warning');
      return;
    }
    await copyNumbersToClipboard(selected, settings.numberFormat);
    await markNumbersAsCopied(selected);
    showToast(`Copied ${selected.length} selected numbers to clipboard`, 'success');
  };

  // ==========================================
  // VIEW 1: SINGLE COUNTRY DETAILED DEEP DIVE
  // ==========================================
  if (activeCountry) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        {/* Back button & Breadcrumb */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelectedCountryFilter(null)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Back to all countries"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="text-xs text-slate-400">
            <span
              onClick={() => setSelectedCountryFilter(null)}
              className="cursor-pointer hover:text-white"
            >
              All Countries
            </span>{' '}
            / <span className="text-white font-semibold">{activeCountry.countryName}</span>
          </div>
        </div>

        {/* Country Header Card */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-950/80 via-slate-900 to-indigo-950/60 border border-blue-500/20 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="text-5xl">{activeCountry.flag}</span>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-extrabold text-white">
                    {activeCountry.countryName}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-mono font-bold border border-blue-500/30">
                    {activeCountry.dialCode}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-1 font-mono">
                  <span>
                    Total: <strong className="text-white">{activeCountry.totalCount.toLocaleString()}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Fresh (Uncopied):{' '}
                    <strong className="text-emerald-400">
                      {activeCountry.freshCount.toLocaleString()}
                    </strong>
                  </span>
                  <span>•</span>
                  <span>
                    Already Copied:{' '}
                    <strong className="text-purple-300">
                      {activeCountry.previouslyCopiedCount.toLocaleString()}
                    </strong>
                  </span>
                  <span>•</span>
                  <span>
                    Duplicates:{' '}
                    <strong className="text-amber-400">
                      {activeCountry.duplicateCount.toLocaleString()}
                    </strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Quick action buttons for this country */}
            <div className="flex flex-wrap items-center gap-2">
              {activeCountry.freshCount > 0 && (
                <button
                  type="button"
                  onClick={handleCopyFreshInCountry}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition-all active:scale-95"
                  title="Copy only numbers that have not been copied yet"
                >
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>Copy Fresh Only ({activeCountry.freshCount})</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleCopyAllInCountry}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors"
                title={`Copy ${countryDeduplicate ? 'unique' : 'all'} numbers for this country (1 per line)`}
              >
                <Copy className="w-3.5 h-3.5 text-blue-400" />
                <span>Copy {countryDeduplicate ? 'Unique' : 'All'} ({filteredCountryNumbers.length})</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  exportToTxt(
                    filteredCountryNumbers,
                    `${activeCountry.countryName}_${activeCountry.dialCode}_${countryDeduplicate ? 'Unique_' : ''}Numbers.txt`,
                    settings.numberFormat
                  )
                }
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export TXT</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  exportToExcel(
                    filteredCountryNumbers,
                    `${activeCountry.countryName}_${activeCountry.dialCode}_${countryDeduplicate ? 'Unique_' : ''}Report.xlsx`
                  )
                }
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Excel</span>
              </button>
            </div>
          </div>
        </div>

        {/* Deduplication Filter Pills inside Country View */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-400 font-semibold flex items-center gap-1.5 mr-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Deduplication:</span>
            </span>

            <button
              type="button"
              onClick={() => setCountryDeduplicate(true)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                countryDeduplicate
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-1 ring-blue-400'
                  : 'bg-slate-950 text-slate-300 hover:text-white border border-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-300" />
              <span>১টি করে দেখাও (Duplicates Excluded) ({activeCountry.uniqueCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setCountryDeduplicate(false)}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all flex items-center gap-1.5 ${
                !countryDeduplicate
                  ? 'bg-slate-700 text-white ring-1 ring-slate-500'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <span>সবগুলো (Show All) ({activeCountry.totalCount})</span>
            </button>
          </div>

          {activeCountry.duplicateCount > 0 && countryDeduplicate && (
            <span className="text-[11px] text-amber-400/90 font-medium bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-500/20">
              {activeCountry.duplicateCount} duplicate instance(s) excluded
            </span>
          )}
        </div>

        {/* Search within this country */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={`Search within ${activeCountry.countryName}...`}
              value={numberSearch}
              onChange={(e) => setNumberSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950/70 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleSelectAllInCountry}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
            >
              {singleCountrySelectedIds.size === filteredCountryNumbers.length
                ? 'Deselect All'
                : 'Select All'}
            </button>

            {singleCountrySelectedIds.size > 0 && (
              <button
                onClick={handleCopySelectedInCountry}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold"
              >
                Copy Selected ({singleCountrySelectedIds.size})
              </button>
            )}
          </div>
        </div>

        {/* Numbers Table for this Country */}
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-3.5 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={
                      filteredCountryNumbers.length > 0 &&
                      singleCountrySelectedIds.size === filteredCountryNumbers.length
                    }
                    onChange={handleToggleSelectAllInCountry}
                    className="w-4 h-4 rounded text-blue-600 bg-slate-800 border-slate-700"
                  />
                </th>
                <th className="p-3.5 w-14">#</th>
                <th className="p-3.5">Phone Number</th>
                <th className="p-3.5">Lead Status</th>
                <th className="p-3.5">Type</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Duplicate</th>
                <th className="p-3.5">Source File</th>
                <th className="p-3.5 text-right w-24">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono">
              {filteredCountryNumbers.map((item, idx) => {
                const isSelected = singleCountrySelectedIds.has(item.id);
                const formattedNum = formatPhoneNumberBySetting(item, settings.numberFormat);

                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      isSelected
                        ? 'bg-blue-950/20'
                        : item.isPreviouslyCopied
                        ? 'bg-purple-950/10'
                        : ''
                    }`}
                  >
                    <td className="p-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSingleNumber(item.id)}
                        className="w-4 h-4 rounded text-blue-600 bg-slate-800 border-slate-700"
                      />
                    </td>
                    <td className="p-3.5 text-slate-500 text-[11px]">{idx + 1}</td>
                    <td className="p-3.5 font-bold tracking-wide">
                      <span className={item.isPreviouslyCopied ? 'text-purple-300' : 'text-white'}>
                        {formattedNum}
                      </span>
                    </td>
                    <td className="p-3.5 font-sans text-[11px]">
                      {item.isPreviouslyCopied ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 font-semibold">
                          <BookmarkCheck className="w-3 h-3 text-purple-400" /> Already Copied
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold">
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
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          Possible
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 font-sans text-[11px]">
                      {item.isDuplicate ? (
                        <span className="text-amber-400">Duplicate</span>
                      ) : item.duplicateCount > 0 ? (
                        <span
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold cursor-help"
                          title={`This number appeared ${item.duplicateCount + 1} times. Kept 1st copy; ${item.duplicateCount} duplicate instance(s) excluded.`}
                        >
                          <Sparkles className="w-3 h-3 text-amber-400" />
                          Repeated {item.duplicateCount + 1}x (1 Kept)
                        </span>
                      ) : (
                        <span className="text-slate-500">Unique (1x)</span>
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
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: ALL COUNTRIES GRID & SELECTION
  // ==========================================
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Globe2 className="w-7 h-7 text-cyan-400" />
            <span>Country-Wise Organization</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Phone numbers cleanly split by country. Select individual countries to view, or export multiple countries in a single ZIP package.
          </p>
        </div>

        {/* Multi-Country Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {selectedCountryCodes.size > 0 && (
            <>
              <button
                type="button"
                onClick={handleExportSelectedCountriesCombinedTxt}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export Selected TXT ({selectedCountryCodes.size})</span>
              </button>

              <button
                type="button"
                onClick={handleExportSelectedCountriesZip}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition-all"
              >
                <Archive className="w-3.5 h-3.5" />
                <span>Export ZIP Package</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={handleSelectAllCountries}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
          >
            {selectedCountryCodes.size === countrySummaries.length
              ? 'Deselect All'
              : 'Select All Countries'}
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Filter country by name or dial code (e.g. Oman, +968, Ivory Coast)..."
          value={countrySearch}
          onChange={(e) => setCountrySearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Country Cards Grid */}
      {filteredCountries.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-500 text-sm">
          No countries found matching your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCountries.map((country) => {
            const isSelected = selectedCountryCodes.has(country.countryCode);

            return (
              <div
                key={country.countryCode}
                className={`p-5 rounded-2xl border transition-all duration-200 relative group ${
                  isSelected
                    ? 'border-blue-500/60 bg-blue-950/20 shadow-lg shadow-blue-500/10'
                    : 'border-slate-800/80 bg-slate-900/60 hover:bg-slate-800/50 hover:border-slate-700'
                }`}
              >
                {/* Checkbox for batch export */}
                <div className="absolute top-4 right-4">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleToggleCountryCheckbox(country.countryCode)}
                    className="w-4 h-4 rounded text-blue-600 bg-slate-800 border-slate-700 cursor-pointer"
                  />
                </div>

                {/* Country Flag & Name */}
                <div
                  className="cursor-pointer"
                  onClick={() => setSelectedCountryFilter(country.countryCode)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{country.flag}</span>
                    <div>
                      <h3 className="font-bold text-white text-base group-hover:text-blue-400 transition-colors">
                        {country.countryName}
                      </h3>
                      <span className="text-xs font-mono font-semibold text-blue-400">
                        {country.dialCode || country.countryCode}
                      </span>
                    </div>
                  </div>

                  {/* Statistics */}
                  <div className="mt-4 grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center font-mono">
                    <div>
                      <div className="text-[10px] text-slate-400 font-sans">Total</div>
                      <div className="text-sm font-bold text-white mt-0.5">
                        {country.totalCount.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-emerald-400 font-sans">Fresh</div>
                      <div className="text-sm font-bold text-emerald-400 mt-0.5">
                        {country.freshCount.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-purple-400 font-sans">Copied</div>
                      <div className="text-sm font-bold text-purple-300 mt-0.5">
                        {country.previouslyCopiedCount.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions bottom */}
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                  <button
                    onClick={() => setSelectedCountryFilter(country.countryCode)}
                    className="text-blue-400 hover:text-blue-300 font-semibold"
                  >
                    View Numbers →
                  </button>

                  <div className="flex items-center gap-1.5">
                    {country.freshCount > 0 && (
                      <button
                        onClick={async () => {
                          const fresh = country.numbers.filter((n) => !n.isPreviouslyCopied);
                          await copyNumbersToClipboard(fresh, settings.numberFormat);
                          await markNumbersAsCopied(fresh);
                          showToast(`Copied ${fresh.length} fresh numbers for ${country.countryName}`, 'success');
                        }}
                        className="p-1.5 rounded-lg bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-900/60 transition-colors"
                        title="Copy Fresh Only"
                      >
                        <Zap className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={async () => {
                        await copyNumbersToClipboard(country.numbers, settings.numberFormat);
                        await markNumbersAsCopied(country.numbers);
                        showToast(`Copied ${country.numbers.length} numbers for ${country.countryName}`, 'success');
                      }}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                      title="Copy all numbers"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() =>
                        exportToTxt(
                          country.numbers,
                          `${country.countryName}_${country.dialCode}.txt`,
                          settings.numberFormat
                        )
                      }
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                      title="Export TXT"
                    >
                      <FileText className="w-3.5 h-3.5 text-emerald-400" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
