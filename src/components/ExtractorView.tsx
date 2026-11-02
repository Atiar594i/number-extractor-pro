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
  Smartphone,
  ClipboardPaste,
  Zap,
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
    setActiveTab,
    showToast,
  } = useApp();

  const [extractionMode, setExtractionMode] = useState<'upload' | 'paste'>('upload');
  const [pastedText, setPastedText] = useState('');
  const [autoProcessOnSelect, setAutoProcessOnSelect] = useState(true);
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

  const validateAndAddFiles = async (files: FileList | File[]) => {
    const added: File[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const lower = (file.name || '').toLowerCase();
      const type = (file.type || '').toLowerCase();

      // Check extension or MIME type (with mobile-friendly permissive validation)
      const isKnownExt =
        lower.endsWith('.xlsx') ||
        lower.endsWith('.xls') ||
        lower.endsWith('.csv') ||
        lower.endsWith('.txt') ||
        lower.endsWith('.tsv');

      const isKnownMime =
        type.includes('spreadsheet') ||
        type.includes('excel') ||
        type.includes('csv') ||
        type.startsWith('text/') ||
        type === 'application/octet-stream';

      // Block obvious non-document media
      const isBlocked =
        lower.endsWith('.exe') ||
        lower.endsWith('.pdf') ||
        lower.endsWith('.jpg') ||
        lower.endsWith('.png') ||
        lower.endsWith('.mp4') ||
        lower.endsWith('.zip');

      if (isBlocked) {
        showToast(`Skipped "${file.name}": Please select .xlsx, .xls, .csv, or .txt files`, 'warning');
        continue;
      }

      if (!isKnownExt && !isKnownMime && lower.includes('.')) {
        showToast(`Skipped "${file.name}": Only spreadsheet and text files are supported`, 'warning');
        continue;
      }

      if (file.size > 100 * 1024 * 1024) {
        showToast(`Skipped "${file.name}": File size exceeds 100MB limit`, 'error');
        continue;
      }

      added.push(file);
    }

    if (added.length > 0) {
      if (autoProcessOnSelect) {
        // Automatically start processing immediately for mobile convenience!
        showToast(`Processing ${added.length} file(s)...`, 'info');
        await processFiles(added);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        setActiveTab('numbers');
      } else {
        setSelectedFiles((prev) => [...prev, ...added]);
        showToast(`Added ${added.length} file(s) to processing queue`, 'success');
      }
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
    setActiveTab('numbers');
  };

  // Direct paste text handler (Great for mobile users copying from Telegram / WhatsApp)
  const handlePasteFromClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setPastedText(text);
          showToast('Pasted text from clipboard', 'info');
          return;
        }
      }
      showToast('Please tap and hold in the box and tap "Paste"', 'info');
    } catch {
      showToast('Please tap and hold in the box and tap "Paste"', 'info');
    }
  };

  const handleExtractPastedText = async () => {
    const trimmed = pastedText.trim();
    if (!trimmed) {
      showToast('Please paste some text, SMS report, or numbers first', 'warning');
      return;
    }
    const virtualFile = new File(
      [trimmed],
      `Pasted_Report_${new Date().toISOString().slice(0, 10)}.txt`,
      { type: 'text/plain' }
    );
    showToast('Extracting numbers from pasted text...', 'info');
    await processFiles([virtualFile]);
    setPastedText('');
    setActiveTab('numbers');
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <UploadCloud className="w-6 h-6 sm:w-7 sm:h-7 text-blue-400" />
            <span>File Extractor & Processor</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            পিসি ও মোবাইল যেকোনো ডিভাইস থেকে এক্সেল, সিএসভি বা টেক্সট ফাইল আপলোড করে এক ক্লিকে নাম্বার এক্সট্রাক্ট করুন।
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={downloadSampleFlexSmsExcel}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            title="Download sample Excel file"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Sample Excel</span>
          </button>

          <button
            type="button"
            onClick={loadSampleData}
            disabled={isProcessing}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 border border-blue-500/30 transition-colors"
            title="Load sample Flex SMS dataset"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Demo Report</span>
          </button>
        </div>
      </div>

      {/* Mode Switcher: File Upload vs Direct Text Paste */}
      <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-slate-900/80 border border-slate-800 max-w-md mx-auto sm:mx-0">
        <button
          type="button"
          onClick={() => setExtractionMode('upload')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-xs transition-all ${
            extractionMode === 'upload'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <UploadCloud className="w-4 h-4" />
          <span>📁 ফাইল আপলোড (File)</span>
        </button>

        <button
          type="button"
          onClick={() => setExtractionMode('paste')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-xs transition-all ${
            extractionMode === 'paste'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ClipboardPaste className="w-4 h-4" />
          <span>📋 সরাসরি পেস্ট (Paste)</span>
        </button>
      </div>

      {/* MODE 1: FILE UPLOAD ZONE (OPTIMIZED FOR MOBILE & DESKTOP) */}
      {extractionMode === 'upload' && (
        <div className="space-y-4">
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-3xl p-6 sm:p-12 text-center transition-all duration-200 overflow-hidden ${
              dragActive
                ? 'border-blue-500 bg-blue-500/10 scale-[1.01]'
                : 'border-slate-700/80 bg-slate-900/40 hover:border-slate-600 hover:bg-slate-900/70'
            }`}
          >
            {/* NATIVE INVISIBLE INPUT OVERLAY: Tapping ANYWHERE on mobile directly opens system file chooser! */}
            <input
              ref={fileInputRef}
              id="mobile-file-upload-input"
              type="file"
              multiple
              accept=".xlsx,.xls,.csv,.txt,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv,text/plain,application/csv,text/comma-separated-values,application/octet-stream,*/*"
              onChange={handleFileInputChange}
              onClick={(e) => {
                (e.target as HTMLInputElement).value = '';
              }}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
              aria-label="Upload files from computer or phone"
            />

            <div className="relative z-10 pointer-events-none">
              <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-blue-600/20 to-cyan-500/20 border border-blue-500/30 flex items-center justify-center mb-4 text-blue-400 shadow-lg shadow-blue-500/10">
                <UploadCloud className="w-8 h-8 sm:w-10 sm:h-10" />
              </div>

              <h3 className="text-base sm:text-xl font-bold text-white mb-1.5">
                <span className="hidden sm:inline">Drag & drop your files here, or tap to browse</span>
                <span className="sm:hidden">মোবাইল থেকে ফাইল সিলেক্ট করতে এখানে চাপ দিন</span>
              </h3>

              <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto mb-5 leading-relaxed">
                সাপোর্টেড ফরম্যাট: <strong className="text-slate-200">.XLSX, .XLS, .CSV</strong>, এবং <strong className="text-slate-200">.TXT</strong>
                <br className="hidden sm:inline" />
                <span className="text-[11px] text-slate-500 block sm:inline mt-1 sm:mt-0">
                  (Google Drive, WhatsApp Documents, Downloads ফোল্ডার থেকে ফাইল সিলেক্ট করুন)
                </span>
              </p>

              <div className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-blue-600/30 transition-all pointer-events-auto">
                <Smartphone className="w-4 h-4 sm:hidden" />
                <UploadCloud className="w-4 h-4 hidden sm:inline" />
                <span>মোবাইল বা পিসি থেকে ফাইল বেছে নিন</span>
              </div>

              <div className="mt-6 flex flex-wrap justify-center items-center gap-3 sm:gap-4 text-[11px] text-slate-400 font-medium">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Leading 0 সংরক্ষিত থাকবে
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> টেলিগ্রাম OTP ফিল্টার হবে
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> ১০০% লোকাল প্রসেসিং
                </span>
              </div>
            </div>
          </div>

          {/* Quick Auto-process Toggle for Mobile Convenience */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="font-semibold text-slate-200">
                ফাইল সিলেক্ট করার সাথে সাথেই প্রসেস শুরু করুন (Instant Process)
              </span>
            </div>
            <input
              type="checkbox"
              checked={autoProcessOnSelect}
              onChange={(e) => setAutoProcessOnSelect(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 bg-slate-800 border-slate-700 cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* MODE 2: DIRECT TEXT & SMS LOG PASTE (MOBILE FRIENDLY ALTERNATIVE) */}
      {extractionMode === 'paste' && (
        <div className="p-5 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ClipboardPaste className="w-5 h-5 text-emerald-400" />
                <span>সরাসরি টেক্সট বা এসএমএস রিপোর্ট পেস্ট করুন</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                টেলিগ্রাম, হোয়াটসঅ্যাপ বা এসএমএস প্যানেল থেকে কপি করা টেক্সট এখানে পেস্ট করে সরাসরি নাম্বার এক্সট্রাক্ট করুন
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePasteFromClipboard}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors"
              >
                <ClipboardPaste className="w-3.5 h-3.5 text-blue-400" />
                <span>Paste Clipboard</span>
              </button>

              {pastedText && (
                <button
                  type="button"
                  onClick={() => setPastedText('')}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-400 border border-slate-700 text-xs font-semibold transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <textarea
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            rows={8}
            placeholder={`এখানে আপনার টেক্সট বা এসএমএস রিপোর্ট পেস্ট করুন...
যেমন:
User: +96891234567 Failed to deliver
Login OTP: 83749 for +225070000000 (ওটিপি বাদ দিয়ে শুধু নাম্বার নেওয়া হবে)
+998901234567 Delivered
01712345678 (বাংলাদেশ)`}
            className="w-full p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs sm:text-sm text-white placeholder-slate-500 font-mono focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all leading-relaxed"
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="text-xs text-slate-400 font-mono">
              {pastedText ? `${pastedText.length.toLocaleString()} characters entered` : 'Zero characters entered'}
            </div>

            <button
              type="button"
              onClick={handleExtractPastedText}
              disabled={!pastedText.trim() || isProcessing}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-600/30 transition-all active:scale-95 disabled:opacity-50"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>নাম্বার বের করুন (Extract Numbers Now)</span>
            </button>
          </div>
        </div>
      )}

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

      {/* Selected Files Queue (If auto-process is disabled or manual batching) */}
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
      <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Settings2 className="w-5 h-5 text-blue-400" />
          <span>Extraction Parameters & Safety Filters</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 text-xs">
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
