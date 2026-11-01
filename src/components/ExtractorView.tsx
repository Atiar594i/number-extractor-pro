import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  FileText,
  Trash2,
  Sparkles,
  Download,
  Play,
  Settings2,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { downloadSampleFlexSmsExcel } from '../utils/sampleData';

export const ExtractorView: React.FC = () => {
  const {
    processFiles,
    isProcessing,
    progress,
    loadSampleData,
    settings,
    updateSettings,
    showToast,
  } = useApp();

  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateAndAddFiles = (files: FileList | File[]) => {
    const validExtensions = ['.xlsx', '.xls', '.csv', '.txt'];
    const added: File[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const lower = file.name.toLowerCase();
      const hasValidExt = validExtensions.some((ext) => lower.endsWith(ext));

      if (!hasValidExt) {
        showToast(`Skipped "${file.name}": Only .xlsx, .xls, .csv, and .txt are supported`, 'warning');
        continue;
      }

      if (file.size > 100 * 1024 * 1024) {
        showToast(`Skipped "${file.name}": File size exceeds 100MB limit`, 'error');
        continue;
      }

      added.push(file);
    }

    if (added.length > 0) {
      setSelectedFiles((prev) => [...prev, ...added]);
      showToast(`Added ${added.length} file(s) to processing queue`, 'success');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndAddFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndAddFiles(e.target.files);
    }
  };

  const handleRemoveQueueItem = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearQueue = () => {
    setSelectedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleStartProcessing = async () => {
    if (selectedFiles.length === 0) {
      showToast('Please select or drop files to process', 'warning');
      return;
    }
    await processFiles(selectedFiles);
    setSelectedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <UploadCloud className="w-7 h-7 text-blue-400" />
            <span>File Extractor & Processor</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Upload Excel (.xlsx, .xls), CSV, or TXT SMS panel reports. Strings are strictly preserved to protect leading zeros.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={downloadSampleFlexSmsExcel}
            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            title="Download a real Excel file with sample Flex SMS failed report data"
          >
            <Download className="w-4 h-4 text-slate-400" />
            <span>Download Sample Excel</span>
          </button>

          <button
            type="button"
            onClick={loadSampleData}
            disabled={isProcessing}
            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 border border-blue-500/30 transition-colors"
            title="Immediately parse sample Flex SMS report directly in app"
          >
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span>Load Sample Flex SMS</span>
          </button>
        </div>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 ${
          dragActive
            ? 'border-blue-500 bg-blue-500/10 scale-[1.01]'
            : 'border-slate-700/80 bg-slate-900/40 hover:border-slate-600 hover:bg-slate-900/70'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".xlsx,.xls,.csv,.txt"
          onChange={handleFileInputChange}
          className="hidden"
        />

        <div className="mx-auto w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4 text-blue-400">
          <UploadCloud className="w-8 h-8" />
        </div>

        <h3 className="text-lg font-bold text-white mb-1">
          Drag and drop your spreadsheet files here
        </h3>
        <p className="text-sm text-slate-400 max-w-md mx-auto mb-4">
          Support for <strong className="text-slate-300">.XLSX, .XLS, .CSV</strong>, and <strong className="text-slate-300">.TXT</strong>. Multiple files can be merged and deduplicated simultaneously.
        </p>

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md shadow-blue-600/20 transition-all">
          <span>Browse Files from Computer</span>
        </div>

        <div className="mt-6 flex flex-wrap justify-center items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Leading Zeros Preserved
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Telegram OTP Excluded
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 100% Client-Side Local
          </span>
        </div>
      </div>

      {/* Live Processing Progress Bar */}
      {isProcessing && progress && (
        <div className="p-6 rounded-2xl bg-blue-950/40 border border-blue-500/30 space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="animate-spin rounded-full h-4 w-4 border-2 border-blue-400 border-t-transparent" />
              <span className="font-semibold text-white">
                Processing file: <span className="font-mono text-blue-300">{progress.currentFile}</span>
              </span>
            </div>
            <span className="font-mono font-bold text-blue-400">{progress.percent}%</span>
          </div>

          <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-cyan-400 h-3 rounded-full transition-all duration-150"
              style={{ width: `${progress.percent}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-xs text-slate-400 font-mono">
            <span>
              Rows parsed: {progress.processedRows.toLocaleString()} / {progress.totalRows.toLocaleString()}
            </span>
            <span>Numbers detected so far: {progress.numbersDetected.toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Selected Files Queue */}
      {selectedFiles.length > 0 && !isProcessing && (
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-indigo-400" />
                <span>Selected Files Queue ({selectedFiles.length})</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Ready to be parsed, cleaned, and organized country-wise
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClearQueue}
                className="text-xs text-slate-400 hover:text-rose-400 transition-colors font-medium px-2 py-1"
              >
                Clear Queue
              </button>
              <button
                type="button"
                onClick={handleStartProcessing}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all active:scale-95"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Process {selectedFiles.length} File(s) Now</span>
              </button>
            </div>
          </div>

          <div className="divide-y divide-slate-800/80 max-h-60 overflow-y-auto">
            {selectedFiles.map((file, idx) => (
              <div
                key={idx}
                className="py-3 flex items-center justify-between gap-4 text-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-slate-800 text-blue-400 shrink-0">
                    {file.name.endsWith('.txt') ? (
                      <FileText className="w-4 h-4" />
                    ) : (
                      <FileSpreadsheet className="w-4 h-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-200 truncate">{file.name}</div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {(file.size / 1024).toFixed(1)} KB
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveQueueItem(idx)}
                  className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                  title="Remove from queue"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Configurable Pre-Processing Options */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Settings2 className="w-5 h-5 text-blue-400" />
          <span>Extraction Parameters & Safety Filters</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          {/* Strict OTP filter */}
          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200">Strict OTP & Code Filter</span>
              <input
                type="checkbox"
                checked={settings.strictOtpFiltering}
                onChange={(e) => updateSettings({ strictOtpFiltering: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 bg-slate-800 border-slate-700"
              />
            </div>
            <p className="text-slate-400 text-[11px]">
              Guarantees demo OTPs, Telegram verification codes, and 4-8 digit auth codes are never extracted as phone numbers.
            </p>
          </div>

          {/* Auto Deduplication */}
          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200">Auto Deduplicate (Keep 1 Copy Only)</span>
              <input
                type="checkbox"
                checked={settings.autoDeduplicate}
                onChange={(e) => updateSettings({ autoDeduplicate: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 bg-slate-800 border-slate-700"
              />
            </div>
            <p className="text-slate-400 text-[11px]">
              Automatically keeps only 1 unique instance per phone number and excludes all subsequent duplicates across files.
            </p>
          </div>

          {/* Ambiguous Review Bucket */}
          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200">Enable Review Bucket</span>
              <input
                type="checkbox"
                checked={settings.enableReviewBucket}
                onChange={(e) => updateSettings({ enableReviewBucket: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 bg-slate-800 border-slate-700"
              />
            </div>
            <p className="text-slate-400 text-[11px]">
              Sends ambiguous or unverified national numbers to the Review section instead of discarding them.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
