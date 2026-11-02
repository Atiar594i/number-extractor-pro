import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import type { ExtractedNumber, AppSettings, ProcessedFile } from '../types';
import { extractNumbersFromCell, type ExtractionContext } from './phoneExtractor';

export interface ParseProgress {
  currentFile: string;
  processedRows: number;
  totalRows: number;
  numbersDetected: number;
  percent: number;
}

export interface FileParseResult {
  fileInfo: ProcessedFile;
  numbers: ExtractedNumber[];
  previewRows?: string[][];
}

/**
 * Read a file as ArrayBuffer
 */
function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result instanceof ArrayBuffer) {
        resolve(e.target.result);
      } else {
        reject(new Error('Failed to read file as ArrayBuffer'));
      }
    };
    reader.onerror = () => reject(reader.error || new Error('FileReader error'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Read a file as text
 */
function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (typeof e.target?.result === 'string') {
        resolve(e.target.result);
      } else {
        reject(new Error('Failed to read file as text'));
      }
    };
    reader.onerror = () => reject(reader.error || new Error('FileReader error'));
    reader.readAsText(file);
  });
}

/**
 * Parse an Excel file (.xlsx, .xls) row by row with chunked async execution
 */
async function parseExcelFile(
  file: File,
  settings: AppSettings,
  existingMap: Map<string, ExtractedNumber>,
  onProgress?: (p: ParseProgress) => void
): Promise<FileParseResult> {
  const buffer = await readFileAsArrayBuffer(file);
  
  // SheetJS: raw: false ensures strings with leading zeros are kept intact!
  const workbook = XLSX.read(buffer, {
    type: 'array',
    raw: false,
    cellDates: false,
    cellText: true,
  });

  const extractedNumbers: ExtractedNumber[] = [];
  const previewRows: string[][] = [];
  let totalRows = 0;

  // Pre-calculate total rows across sheets
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet || !sheet['!ref']) continue;
    const range = XLSX.utils.decode_range(sheet['!ref']);
    totalRows += (range.e.r - range.s.r + 1);
  }

  if (totalRows === 0) totalRows = 1;
  let processedRowCount = 0;

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet || !sheet['!ref']) continue;

    const rows = XLSX.utils.sheet_to_json<string[]>(sheet, {
      header: 1,
      raw: false,
      defval: '',
      blankrows: false,
    });

    if (previewRows.length < 5) {
      previewRows.push(...rows.slice(0, 5 - previewRows.length));
    }

    const chunkSize = 400;
    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);

      for (let r = 0; r < chunk.length; r++) {
        const row = chunk[r];
        const rowIndex = i + r + 1;

        if (Array.isArray(row)) {
          for (let col = 0; col < row.length; col++) {
            const cellVal = row[col];
            if (cellVal) {
              const context: ExtractionContext = {
                fileName: file.name,
                sheetName,
                rowIndex,
                columnName: `Col ${col + 1}`,
                settings,
                existingMap,
              };

              const found = extractNumbersFromCell(cellVal, context);
              if (found.length > 0) {
                extractedNumbers.push(...found);
              }
            }
          }
        }
      }

      processedRowCount += chunk.length;
      if (onProgress) {
        onProgress({
          currentFile: file.name,
          processedRows: processedRowCount,
          totalRows,
          numbersDetected: extractedNumbers.length,
          percent: Math.min(100, Math.round((processedRowCount / totalRows) * 100)),
        });
      }

      // Yield event loop to keep UI 100% fluid
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  const uniqueCount = new Set(extractedNumbers.map((n) => n.normalized)).size;
  const duplicateCount = extractedNumbers.length - uniqueCount;
  const previouslyCopiedCount = extractedNumbers.filter((n) => n.isPreviouslyCopied).length;

  return {
    fileInfo: {
      id: `${file.name}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: file.name,
      size: file.size,
      type: file.name.endsWith('.xls') ? 'xls' : 'xlsx',
      rowCount: processedRowCount,
      extractedCount: extractedNumbers.length,
      uniqueCount,
      duplicateCount,
      previouslyCopiedCount,
      uploadedAt: Date.now(),
    },
    numbers: extractedNumbers,
    previewRows,
  };
}

/**
 * Parse a CSV file with automatic delimiter detection
 */
async function parseCsvFile(
  file: File,
  settings: AppSettings,
  existingMap: Map<string, ExtractedNumber>,
  onProgress?: (p: ParseProgress) => void
): Promise<FileParseResult> {
  const text = await readFileAsText(file);
  const parsed = Papa.parse<string[]>(text, {
    dynamicTyping: false,
    skipEmptyLines: true,
  });

  const rows = parsed.data;
  const totalRows = rows.length || 1;
  const extractedNumbers: ExtractedNumber[] = [];
  const previewRows = rows.slice(0, 5);
  let processedRowCount = 0;

  const chunkSize = 500;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);

    for (let r = 0; r < chunk.length; r++) {
      const row = chunk[r];
      const rowIndex = i + r + 1;

      if (Array.isArray(row)) {
        for (let col = 0; col < row.length; col++) {
          const cellVal = row[col];
          if (cellVal) {
            const context: ExtractionContext = {
              fileName: file.name,
              rowIndex,
              columnName: `Col ${col + 1}`,
              settings,
              existingMap,
            };

            const found = extractNumbersFromCell(cellVal, context);
            if (found.length > 0) {
              extractedNumbers.push(...found);
            }
          }
        }
      }
    }

    processedRowCount += chunk.length;
    if (onProgress) {
      onProgress({
        currentFile: file.name,
        processedRows: processedRowCount,
        totalRows,
        numbersDetected: extractedNumbers.length,
        percent: Math.min(100, Math.round((processedRowCount / totalRows) * 100)),
      });
    }

    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  const uniqueCount = new Set(extractedNumbers.map((n) => n.normalized)).size;
  const duplicateCount = extractedNumbers.length - uniqueCount;
  const previouslyCopiedCount = extractedNumbers.filter((n) => n.isPreviouslyCopied).length;

  return {
    fileInfo: {
      id: `${file.name}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: file.name,
      size: file.size,
      type: 'csv',
      rowCount: processedRowCount,
      extractedCount: extractedNumbers.length,
      uniqueCount,
      duplicateCount,
      previouslyCopiedCount,
      uploadedAt: Date.now(),
    },
    numbers: extractedNumbers,
    previewRows,
  };
}

/**
 * Parse a TXT file (supports 1 number per line, comma-separated, or mixed logs)
 */
async function parseTxtFile(
  file: File,
  settings: AppSettings,
  existingMap: Map<string, ExtractedNumber>,
  onProgress?: (p: ParseProgress) => void
): Promise<FileParseResult> {
  const text = await readFileAsText(file);
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const totalRows = lines.length || 1;
  const extractedNumbers: ExtractedNumber[] = [];
  const previewRows = lines.slice(0, 5).map((l) => [l]);
  let processedRowCount = 0;

  const chunkSize = 600;
  for (let i = 0; i < lines.length; i += chunkSize) {
    const chunk = lines.slice(i, i + chunkSize);

    for (let r = 0; r < chunk.length; r++) {
      const line = chunk[r];
      const rowIndex = i + r + 1;

      const context: ExtractionContext = {
        fileName: file.name,
        rowIndex,
        settings,
        existingMap,
      };

      const found = extractNumbersFromCell(line, context);
      if (found.length > 0) {
        extractedNumbers.push(...found);
      }
    }

    processedRowCount += chunk.length;
    if (onProgress) {
      onProgress({
        currentFile: file.name,
        processedRows: processedRowCount,
        totalRows,
        numbersDetected: extractedNumbers.length,
        percent: Math.min(100, Math.round((processedRowCount / totalRows) * 100)),
      });
    }

    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  const uniqueCount = new Set(extractedNumbers.map((n) => n.normalized)).size;
  const duplicateCount = extractedNumbers.length - uniqueCount;
  const previouslyCopiedCount = extractedNumbers.filter((n) => n.isPreviouslyCopied).length;

  return {
    fileInfo: {
      id: `${file.name}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: file.name,
      size: file.size,
      type: 'txt',
      rowCount: processedRowCount,
      extractedCount: extractedNumbers.length,
      uniqueCount,
      duplicateCount,
      previouslyCopiedCount,
      uploadedAt: Date.now(),
    },
    numbers: extractedNumbers,
    previewRows,
  };
}

/**
 * Master parser: determines file format and processes with real-time feedback.
 * Specially optimized for mobile file uploads (handles MIME types & non-standard extensions).
 */
export async function parseFile(
  file: File,
  settings: AppSettings,
  existingMap: Map<string, ExtractedNumber>,
  onProgress?: (p: ParseProgress) => void
): Promise<FileParseResult> {
  const name = (file.name || '').toLowerCase();
  const type = (file.type || '').toLowerCase();

  // 1. Explicit Excel extension or MIME
  if (
    name.endsWith('.xlsx') ||
    name.endsWith('.xls') ||
    type.includes('spreadsheet') ||
    type.includes('excel') ||
    type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    type === 'application/vnd.ms-excel'
  ) {
    return parseExcelFile(file, settings, existingMap, onProgress);
  }

  // 2. Explicit CSV extension or MIME
  if (
    name.endsWith('.csv') ||
    name.endsWith('.tsv') ||
    type === 'text/csv' ||
    type === 'application/csv' ||
    type === 'text/comma-separated-values'
  ) {
    return parseCsvFile(file, settings, existingMap, onProgress);
  }

  // 3. Plain text extension or MIME
  if (name.endsWith('.txt') || type.startsWith('text/')) {
    return parseTxtFile(file, settings, existingMap, onProgress);
  }

  // 4. Mobile fallback for generic files (e.g. application/octet-stream from Android Downloads)
  // Try Excel first via SheetJS binary reader, fallback to CSV/Text
  try {
    return await parseExcelFile(file, settings, existingMap, onProgress);
  } catch {
    try {
      return await parseCsvFile(file, settings, existingMap, onProgress);
    } catch {
      return await parseTxtFile(file, settings, existingMap, onProgress);
    }
  }
}
