import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import type { ExtractedNumber, AppSettings } from '../types';

/**
 * Format a number according to the chosen setting format
 */
export function formatPhoneNumberBySetting(
  item: ExtractedNumber,
  format: AppSettings['numberFormat']
): string {
  switch (format) {
    case 'international':
      return item.internationalFormat || item.normalized;
    case 'national':
      return item.nationalFormat || item.normalized;
    case 'digitsOnly':
      return item.digitsOnly || item.normalized.replace(/\D/g, '');
    case 'e164':
    default:
      return item.normalized;
  }
}

/**
 * Download pure TXT file with one phone number per line.
 * By default, deduplicates so each number appears exactly ONCE.
 */
export function exportToTxt(
  numbers: ExtractedNumber[],
  filename: string,
  format: AppSettings['numberFormat'] = 'e164',
  deduplicate: boolean = true
): void {
  let target = numbers;
  if (deduplicate) {
    const seen = new Set<string>();
    target = numbers.filter((item) => {
      if (seen.has(item.normalized)) return false;
      seen.add(item.normalized);
      return true;
    });
  }

  const content = target
    .map((item) => formatPhoneNumberBySetting(item, format))
    .join('\r\n');

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const cleanName = filename.endsWith('.txt') ? filename : `${filename}.txt`;
  saveAs(blob, cleanName);
}

/**
 * Download CSV file
 */
export function exportToCsv(numbers: ExtractedNumber[], filename: string): void {
  const headers = [
    'Phone Number',
    'Country',
    'Country Code',
    'Dial Code',
    'Status',
    'Type',
    'Lead History',
    'Is Duplicate',
    'Source File',
    'Source Row',
  ];

  const rows = numbers.map((item) => [
    `"${item.normalized}"`,
    `"${item.countryName}"`,
    `"${item.countryCode}"`,
    `"${item.dialCode}"`,
    `"${item.status}"`,
    `"${item.numberType}"`,
    `"${item.isPreviouslyCopied ? 'Already Copied' : 'Fresh Lead'}"`,
    `"${item.isDuplicate ? 'Yes' : 'No'}"`,
    `"${item.sourceFile}"`,
    `"${item.sourceRow}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const cleanName = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  saveAs(blob, cleanName);
}

/**
 * Download Excel (.xlsx) file with phone numbers preserved as string cells (t: 's')
 */
export function exportToExcel(numbers: ExtractedNumber[], filename: string): void {
  const data = [
    [
      'Phone Number',
      'Country',
      'Country Code',
      'Dial Code',
      'Validation Status',
      'Number Type',
      'Lead History',
      'Is Duplicate',
      'Source File',
      'Source Row',
    ],
    ...numbers.map((item) => [
      item.normalized, // E.164 text
      item.countryName,
      item.countryCode,
      item.dialCode,
      item.status,
      item.numberType,
      item.isPreviouslyCopied ? 'Already Copied' : 'Fresh Lead',
      item.isDuplicate ? 'Duplicate' : 'Unique',
      item.sourceFile,
      item.sourceRow,
    ]),
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(data);

  // Guarantee every cell in the Phone Number column (Col 0) is typed as string ('s')
  // to prevent Excel from converting to scientific notation or removing leading zeros!
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:J1');
  for (let r = 1; r <= range.e.r; r++) {
    const cellAddress = XLSX.utils.encode_cell({ r, c: 0 });
    const cell = worksheet[cellAddress];
    if (cell) {
      cell.t = 's';
      cell.z = '@';
    }
  }

  // Set column widths
  worksheet['!cols'] = [
    { wch: 20 }, // Phone
    { wch: 18 }, // Country
    { wch: 14 }, // Code
    { wch: 12 }, // Dial
    { wch: 16 }, // Status
    { wch: 14 }, // Type
    { wch: 16 }, // Lead History
    { wch: 14 }, // Duplicate
    { wch: 24 }, // Source File
    { wch: 12 }, // Row
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Phone Numbers');

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const cleanName = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  saveAs(blob, cleanName);
}

/**
 * Export Country-Wise ZIP Package:
 * Creates a .zip file containing a dedicated .txt file for each country,
 * plus a summary CSV report!
 */
export async function exportCountryWiseZip(
  numbers: ExtractedNumber[],
  zipFilename: string = 'Number_Extractor_Country_Package.zip',
  format: AppSettings['numberFormat'] = 'e164',
  uniqueOnly: boolean = false
): Promise<void> {
  const zip = new JSZip();

  const dataset = uniqueOnly ? numbers.filter((n) => !n.isDuplicate) : numbers;

  // Group by country
  const countryMap = new Map<string, ExtractedNumber[]>();
  for (const item of dataset) {
    const key = item.countryName || 'Other_Countries';
    if (!countryMap.has(key)) {
      countryMap.set(key, []);
    }
    countryMap.get(key)!.push(item);
  }

  const folder = zip.folder('Countries');

  // Summary lines
  const summaryRows: string[] = ['Country,Dial Code,Total Numbers,Unique Numbers,Duplicates'];

  for (const [countryName, countryNumbers] of countryMap.entries()) {
    const dialCode = countryNumbers[0]?.dialCode || '';
    const safeName = countryName.replace(/[^a-zA-Z0-9_\-\s]/g, '').trim();
    const fileName = `${safeName} (${dialCode}) - ${countryNumbers.length} numbers.txt`;

    const txtContent = countryNumbers
      .map((n) => formatPhoneNumberBySetting(n, format))
      .join('\r\n');

    folder?.file(fileName, txtContent);

    const uniqueInCountry = new Set(countryNumbers.map((n) => n.normalized)).size;
    const dupsInCountry = countryNumbers.length - uniqueInCountry;
    summaryRows.push(
      `"${countryName}","${dialCode}",${countryNumbers.length},${uniqueInCountry},${dupsInCountry}`
    );
  }

  // Add Summary Report CSV
  zip.file('Summary_Report.csv', summaryRows.join('\r\n'));

  // If there are duplicates, also add a dedicated duplicates.txt
  const duplicates = numbers.filter((n) => n.isDuplicate);
  if (duplicates.length > 0) {
    const dupsContent = duplicates
      .map((n) => formatPhoneNumberBySetting(n, format))
      .join('\r\n');
    zip.file('Duplicates_List.txt', dupsContent);
  }

  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, zipFilename);
}

/**
 * Copy numbers to clipboard with one number per line.
 * By default, deduplicates so each number appears exactly ONCE.
 */
export async function copyNumbersToClipboard(
  numbers: ExtractedNumber[],
  format: AppSettings['numberFormat'] = 'e164',
  deduplicate: boolean = true
): Promise<boolean> {
  if (!numbers || numbers.length === 0) return false;

  let target = numbers;
  if (deduplicate) {
    const seen = new Set<string>();
    target = numbers.filter((item) => {
      if (seen.has(item.normalized)) return false;
      seen.add(item.normalized);
      return true;
    });
  }

  const text = target
    .map((item) => formatPhoneNumberBySetting(item, format))
    .join('\n');

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  }
}
