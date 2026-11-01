export type NumberValidationStatus = 'VALID' | 'POSSIBLE' | 'INVALID' | 'REVIEW';

export type NumberType = 'MOBILE' | 'FIXED_LINE' | 'VOIP' | 'PAGER' | 'TOLL_FREE' | 'UNKNOWN';

export interface ExtractedNumber {
  id: string;
  original: string;
  normalized: string; // E.164 (+96891234567)
  nationalFormat: string; // (9123 4567)
  internationalFormat: string; // (+968 9123 4567)
  digitsOnly: string; // (96891234567)
  countryCode: string; // ISO 2-letter (e.g. 'OM', 'CI', 'UZ')
  countryName: string; // (e.g. 'Oman', 'Ivory Coast')
  dialCode: string; // (e.g. '+968', '+225')
  flag: string; // Flag emoji or symbol (e.g. '🇴🇲')
  status: NumberValidationStatus;
  isValid: boolean;
  isPossible: boolean;
  numberType: NumberType;
  sourceFile: string;
  sourceSheet?: string;
  sourceRow: number;
  sourceColumn?: string;
  isDuplicate: boolean;
  duplicateCount: number;
  isPreviouslyCopied: boolean; // TRUE if this number was copied/used in any previous or current session
  copiedAt?: number; // Timestamp when copied
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  reviewReason?: string;
}

export interface CountrySummary {
  countryCode: string;
  countryName: string;
  dialCode: string;
  flag: string;
  totalCount: number;
  uniqueCount: number;
  duplicateCount: number;
  previouslyCopiedCount: number;
  freshCount: number;
  validCount: number;
  invalidCount: number;
  numbers: ExtractedNumber[];
}

export interface ProcessedFile {
  id: string;
  name: string;
  size: number;
  type: 'xlsx' | 'xls' | 'csv' | 'txt';
  rowCount: number;
  extractedCount: number;
  uniqueCount: number;
  duplicateCount: number;
  previouslyCopiedCount: number;
  uploadedAt: number;
}

export interface ExtractionStats {
  totalFiles: number;
  totalNumbers: number;
  uniqueNumbers: number;
  duplicateNumbers: number;
  previouslyCopiedNumbers: number;
  freshNumbers: number;
  invalidNumbers: number;
  reviewNumbers: number;
  countriesCount: number;
  exportedCount: number;
}

export interface AppSettings {
  theme: 'dark' | 'light';
  defaultExportFormat: 'txt' | 'csv' | 'xlsx';
  autoDeduplicate: boolean;
  autoExcludeCopiedOnExport: boolean; // If true, copying/exporting automatically ignores already-copied numbers
  hidePreviouslyCopied: boolean; // If true, hides previously copied numbers from the table
  numberFormat: 'e164' | 'international' | 'national' | 'digitsOnly';
  minPhoneLength: number;
  maxPhoneLength: number;
  strictOtpFiltering: boolean;
  includeCountryCodeOnCopy: boolean;
  enableReviewBucket: boolean;
  defaultFallbackCountry: string; // Default to 'OM' or ''
}

export interface CopiedRecord {
  normalized: string;
  countryName: string;
  dialCode: string;
  copiedAt: number;
  sourceFile?: string;
}

export interface ProcessingSession {
  id: string;
  timestamp: number;
  files: { name: string; size: number }[];
  totalNumbers: number;
  uniqueNumbers: number;
  duplicateNumbers: number;
  countries: string[];
  numbers: ExtractedNumber[];
}

export type ActiveTab = 
  | 'dashboard'
  | 'extractor'
  | 'numbers'
  | 'countries'
  | 'duplicates'
  | 'copied'
  | 'review'
  | 'history'
  | 'settings';
