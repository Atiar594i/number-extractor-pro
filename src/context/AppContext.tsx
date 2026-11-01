import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import confetti from 'canvas-confetti';
import type {
  ExtractedNumber,
  ProcessedFile,
  ExtractionStats,
  AppSettings,
  CountrySummary,
  ActiveTab,
  ProcessingSession,
  CopiedRecord,
} from '../types';
import { parseFile, type ParseProgress } from '../utils/fileParser';
import { saveSession } from '../utils/historyStorage';
import { createSampleFlexSmsFile } from '../utils/sampleData';
import {
  initCopiedMemory,
  persistCopiedNumbers,
  clearAllCopiedMemory,
  getAllCopiedRecords,
  removeNumbersFromCopiedMemory,
} from '../utils/copiedMemory';

interface ToastState {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

interface AppContextType {
  files: ProcessedFile[];
  numbers: ExtractedNumber[];
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  selectedCountryFilter: string | null;
  setSelectedCountryFilter: (code: string | null) => void;
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  stats: ExtractionStats;
  countrySummaries: CountrySummary[];
  duplicateNumbers: ExtractedNumber[];
  uniqueNumbers: ExtractedNumber[];
  freshNumbers: ExtractedNumber[];
  previouslyCopiedNumbers: ExtractedNumber[];
  reviewNumbers: ExtractedNumber[];
  isProcessing: boolean;
  progress: ParseProgress | null;
  processFiles: (fileList: File[]) => Promise<void>;
  loadSampleData: () => Promise<void>;
  removeFile: (fileId: string) => void;
  clearAllData: () => void;
  deleteNumbers: (ids: string[]) => void;
  loadSession: (session: ProcessingSession) => void;
  markNumbersAsCopied: (numbersToMark: ExtractedNumber[]) => Promise<void>;
  clearCopiedMemory: () => Promise<void>;
  getAllCopiedMemory: () => Promise<CopiedRecord[]>;
  removeNumbersFromMemory: (normalizedList: string[]) => Promise<void>;
  toast: ToastState | null;
  showToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  dismissToast: () => void;
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  defaultExportFormat: 'txt',
  autoDeduplicate: false,
  autoExcludeCopiedOnExport: true,
  hidePreviouslyCopied: false,
  numberFormat: 'e164',
  minPhoneLength: 7,
  maxPhoneLength: 16,
  strictOtpFiltering: true,
  includeCountryCodeOnCopy: true,
  enableReviewBucket: true,
  defaultFallbackCountry: '',
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('NumberExtractorPro_Settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [files, setFiles] = useState<ProcessedFile[]>([]);
  const [numbers, setNumbers] = useState<ExtractedNumber[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [selectedCountryFilter, setSelectedCountryFilter] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ParseProgress | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  // Initialize copied numbers memory from IndexedDB on startup
  useEffect(() => {
    initCopiedMemory();
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    localStorage.setItem('NumberExtractorPro_Settings', JSON.stringify(settings));
  }, [settings]);

  const showToast = useCallback(
    (message: string, type: 'success' | 'info' | 'warning' | 'error' = 'info') => {
      const id = Math.random().toString(36).slice(2, 9);
      setToast({ id, message, type });
      setTimeout(() => {
        setToast((current) => (current?.id === id ? null : current));
      }, 4000);
    },
    []
  );

  const dismissToast = useCallback(() => {
    setToast(null);
  }, []);

  const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  }, []);

  // Filter lists
  const uniqueNumbers = useMemo(() => {
    return numbers.filter((n) => !n.isDuplicate && n.status !== 'REVIEW');
  }, [numbers]);

  const duplicateNumbers = useMemo(() => {
    return numbers.filter((n) => n.isDuplicate);
  }, [numbers]);

  const reviewNumbers = useMemo(() => {
    return numbers.filter((n) => n.status === 'REVIEW');
  }, [numbers]);

  // Numbers that were copied in this or previous sessions
  const previouslyCopiedNumbers = useMemo(() => {
    return numbers.filter((n) => n.isPreviouslyCopied);
  }, [numbers]);

  // 100% Fresh Leads (Never copied before, unique, valid/possible)
  const freshNumbers = useMemo(() => {
    return numbers.filter((n) => !n.isPreviouslyCopied && !n.isDuplicate && n.status !== 'REVIEW');
  }, [numbers]);

  const countrySummaries = useMemo<CountrySummary[]>(() => {
    const map = new Map<string, CountrySummary>();

    for (const item of numbers) {
      if (item.status === 'REVIEW') continue;

      const code = item.countryCode || 'OTHER';
      if (!map.has(code)) {
        map.set(code, {
          countryCode: code,
          countryName: item.countryName || 'Other / Unknown',
          dialCode: item.dialCode || '',
          flag: item.flag || '🌐',
          totalCount: 0,
          uniqueCount: 0,
          duplicateCount: 0,
          previouslyCopiedCount: 0,
          freshCount: 0,
          validCount: 0,
          invalidCount: 0,
          numbers: [],
        });
      }

      const summary = map.get(code)!;
      summary.totalCount += 1;
      summary.numbers.push(item);

      if (item.isDuplicate) {
        summary.duplicateCount += 1;
      } else {
        summary.uniqueCount += 1;
      }

      if (item.isPreviouslyCopied) {
        summary.previouslyCopiedCount += 1;
      } else if (!item.isDuplicate) {
        summary.freshCount += 1;
      }

      if (item.isValid) {
        summary.validCount += 1;
      } else {
        summary.invalidCount += 1;
      }
    }

    return Array.from(map.values()).sort((a, b) => b.totalCount - a.totalCount);
  }, [numbers]);

  const stats = useMemo<ExtractionStats>(() => {
    const totalFiles = files.length;
    const totalNumbers = numbers.length;
    const uniqueCount = uniqueNumbers.length;
    const duplicateCount = duplicateNumbers.length;
    const previouslyCopiedCount = previouslyCopiedNumbers.length;
    const freshCount = freshNumbers.length;
    const invalidCount = numbers.filter((n) => !n.isValid && n.status !== 'REVIEW').length;
    const reviewCount = reviewNumbers.length;
    const countriesCount = countrySummaries.length;

    return {
      totalFiles,
      totalNumbers,
      uniqueNumbers: uniqueCount,
      duplicateNumbers: duplicateCount,
      previouslyCopiedNumbers: previouslyCopiedCount,
      freshNumbers: freshCount,
      invalidNumbers: invalidCount,
      reviewNumbers: reviewCount,
      countriesCount,
      exportedCount: 0,
    };
  }, [files, numbers, uniqueNumbers, duplicateNumbers, previouslyCopiedNumbers, freshNumbers, reviewNumbers, countrySummaries]);

  // Mark numbers as copied and persist to storage
  const markNumbersAsCopied = useCallback(async (numbersToMark: ExtractedNumber[]) => {
    if (!numbersToMark || numbersToMark.length === 0) return;

    await persistCopiedNumbers(numbersToMark);

    const markSet = new Set(numbersToMark.map((n) => n.normalized));
    const now = Date.now();

    setNumbers((prev) =>
      prev.map((item) => {
        if (markSet.has(item.normalized) && !item.isPreviouslyCopied) {
          return { ...item, isPreviouslyCopied: true, copiedAt: now };
        }
        return item;
      })
    );
  }, []);

  const clearCopiedMemory = useCallback(async () => {
    await clearAllCopiedMemory();
    setNumbers((prev) =>
      prev.map((item) => ({ ...item, isPreviouslyCopied: false, copiedAt: undefined }))
    );
    showToast('Copied numbers memory cleared! All numbers are now marked as fresh.', 'success');
  }, [showToast]);

  const getAllCopiedMemory = useCallback(async () => {
    return await getAllCopiedRecords();
  }, []);

  const removeNumbersFromMemory = useCallback(
    async (normalizedList: string[]) => {
      await removeNumbersFromCopiedMemory(normalizedList);
      const rmSet = new Set(normalizedList);
      setNumbers((prev) =>
        prev.map((item) => {
          if (rmSet.has(item.normalized)) {
            return { ...item, isPreviouslyCopied: false, copiedAt: undefined };
          }
          return item;
        })
      );
      showToast(`Removed ${normalizedList.length} numbers from copied memory`, 'info');
    },
    [showToast]
  );

  const processFiles = useCallback(
    async (fileList: File[]) => {
      if (!fileList || fileList.length === 0) return;

      setIsProcessing(true);
      const existingMap = new Map<string, ExtractedNumber>();

      for (const n of numbers) {
        existingMap.set(n.normalized, n);
      }

      const newProcessedFiles: ProcessedFile[] = [];
      const newExtractedNumbers: ExtractedNumber[] = [];

      try {
        for (let i = 0; i < fileList.length; i++) {
          const file = fileList[i];
          const result = await parseFile(file, settings, existingMap, (p) => {
            setProgress(p);
          });

          newProcessedFiles.push(result.fileInfo);
          newExtractedNumbers.push(...result.numbers);
        }

        const combinedNumbers = [...numbers, ...newExtractedNumbers];
        setFiles((prev) => [...prev, ...newProcessedFiles]);
        setNumbers(combinedNumbers);

        const sessionCountries = Array.from(
          new Set(newExtractedNumbers.map((n) => n.countryName).filter(Boolean))
        );
        const uniqueInBatch = new Set(newExtractedNumbers.map((n) => n.normalized)).size;
        const alreadyCopiedInBatch = newExtractedNumbers.filter((n) => n.isPreviouslyCopied).length;

        await saveSession({
          id: `session_${Date.now()}`,
          timestamp: Date.now(),
          files: fileList.map((f) => ({ name: f.name, size: f.size })),
          totalNumbers: newExtractedNumbers.length,
          uniqueNumbers: uniqueInBatch,
          duplicateNumbers: newExtractedNumbers.length - uniqueInBatch,
          countries: sessionCountries,
          numbers: newExtractedNumbers,
        });

        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });

        if (alreadyCopiedInBatch > 0) {
          showToast(
            `Processed ${fileList.length} file(s)! Found ${newExtractedNumbers.length} numbers. Notice: ${alreadyCopiedInBatch} number(s) were previously copied before!`,
            'warning'
          );
        } else {
          showToast(
            `Successfully processed ${fileList.length} file(s)! Found ${newExtractedNumbers.length} numbers across ${sessionCountries.length} countries.`,
            'success'
          );
        }

        setActiveTab('numbers');
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown file parsing error';
        showToast(`Processing failed: ${errorMsg}`, 'error');
      } finally {
        setIsProcessing(false);
        setProgress(null);
      }
    },
    [numbers, settings, showToast]
  );

  const loadSampleData = useCallback(async () => {
    const sampleFile = createSampleFlexSmsFile();
    await processFiles([sampleFile]);
  }, [processFiles]);

  const removeFile = useCallback((fileId: string) => {
    setFiles((prev) => {
      const target = prev.find((f) => f.id === fileId);
      if (!target) return prev;
      setNumbers((numPrev) => numPrev.filter((n) => n.sourceFile !== target.name));
      return prev.filter((f) => f.id !== fileId);
    });
    showToast('File and its associated numbers removed', 'info');
  }, [showToast]);

  const clearAllData = useCallback(() => {
    setFiles([]);
    setNumbers([]);
    setSelectedCountryFilter(null);
    showToast('All extracted data cleared from session', 'info');
  }, [showToast]);

  const deleteNumbers = useCallback((ids: string[]) => {
    const idSet = new Set(ids);
    setNumbers((prev) => prev.filter((n) => !idSet.has(n.id)));
    showToast(`Removed ${ids.length} number(s)`, 'info');
  }, [showToast]);

  const loadSession = useCallback((session: ProcessingSession) => {
    setNumbers(session.numbers || []);
    setFiles(
      session.files.map((f, i) => ({
        id: `hist_${session.id}_${i}`,
        name: f.name,
        size: f.size,
        type: (f.name.split('.').pop() as any) || 'xlsx',
        rowCount: session.totalNumbers,
        extractedCount: session.totalNumbers,
        uniqueCount: session.uniqueNumbers,
        duplicateCount: session.duplicateNumbers,
        previouslyCopiedCount: session.numbers?.filter((n) => n.isPreviouslyCopied).length || 0,
        uploadedAt: session.timestamp,
      }))
    );
    setActiveTab('numbers');
    showToast(`Restored session from ${new Date(session.timestamp).toLocaleDateString()}`, 'success');
  }, [showToast]);

  return (
    <AppContext.Provider
      value={{
        files,
        numbers,
        activeTab,
        setActiveTab,
        selectedCountryFilter,
        setSelectedCountryFilter,
        settings,
        updateSettings,
        stats,
        countrySummaries,
        duplicateNumbers,
        uniqueNumbers,
        freshNumbers,
        previouslyCopiedNumbers,
        reviewNumbers,
        isProcessing,
        progress,
        processFiles,
        loadSampleData,
        removeFile,
        clearAllData,
        deleteNumbers,
        loadSession,
        markNumbersAsCopied,
        clearCopiedMemory,
        getAllCopiedMemory,
        removeNumbersFromMemory,
        toast,
        showToast,
        dismissToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
