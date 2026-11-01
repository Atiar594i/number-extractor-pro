import {
  parsePhoneNumber,
  type CountryCode,
  PhoneNumber,
} from 'libphonenumber-js';
import type { ExtractedNumber, AppSettings, NumberValidationStatus, NumberType } from '../types';
import { getCountryFlag, getCountryName, getCountryDialCode } from '../constants/countries';
import { isNumberPreviouslyCopied, getCopiedRecord } from './copiedMemory';

// Regex patterns to detect OTP, verification codes, and demo message noise
const OTP_CONTEXT_REGEX = /(?:code|otp|pin|verification|verify|login|telegram|whatsapp|sms|passcode|token|key|secret|auth|password|contraseña|código|код|parol|codice)\s*[:=\-–—]?\s*(?:is\s*)?([0-9]{4,8})/gi;
const DEMO_TELEGRAM_REGEX = /telegram(?:\s+\w+)?\s+code\s*[:=\-–—]?\s*(\d{4,8})/gi;
const STANDALONE_OTP_REGEX = /^\s*(?:\d{4,6}|\d{3}[-\s]\d{3})\s*$/;
const TIMESTAMP_REGEX = /^(?:1[5-9]\d{8}|1[5-9]\d{11}|20\d{10})$/; // Unix epoch seconds or ms (approx 2017-2035)
const REPEATED_DIGITS_REGEX = /^(\d)\1{6,}$/; // e.g. 0000000, 1111111
const SEQUENTIAL_REGEX = /^(?:0123456|1234567|2345678|3456789|9876543|8765432|7654321)$/;

export interface ExtractionContext {
  fileName: string;
  sheetName?: string;
  rowIndex: number;
  columnName?: string;
  settings: AppSettings;
  existingMap: Map<string, ExtractedNumber>;
}

/**
 * Check if a text is an OTP or verification code that must be excluded
 */
export function isOtpOrVerificationCode(text: string): boolean {
  if (!text) return false;
  const clean = text.trim();

  // Standalone 4 to 6 digits are OTPs, not real phone numbers
  if (STANDALONE_OTP_REGEX.test(clean)) {
    return true;
  }

  // Telegram demo or verification text without valid phone context
  if (/telegram.*code/i.test(clean) && !/\+\d{8,}/.test(clean)) {
    return true;
  }

  return false;
}

/**
 * Check if a number is a timestamp, sequential dummy, or message ID
 */
export function isTimestampOrNoise(cleanDigits: string): boolean {
  if (TIMESTAMP_REGEX.test(cleanDigits)) return true;
  if (REPEATED_DIGITS_REGEX.test(cleanDigits)) return true;
  if (SEQUENTIAL_REGEX.test(cleanDigits)) return true;
  return false;
}

/**
 * Strip OTP patterns from text so that message contents like
 * "Telegram code: 12345" do not get picked up as phone numbers.
 */
export function sanitizeTextContent(text: string): { cleaned: string; bannedCodes: Set<string> } {
  const bannedCodes = new Set<string>();

  // Extract all OTP codes from contextual phrases
  let match: RegExpExecArray | null;
  const otpRegex = new RegExp(OTP_CONTEXT_REGEX.source, 'gi');
  while ((match = otpRegex.exec(text)) !== null) {
    if (match[1]) {
      bannedCodes.add(match[1].trim());
    }
  }

  const telegramRegex = new RegExp(DEMO_TELEGRAM_REGEX.source, 'gi');
  while ((match = telegramRegex.exec(text)) !== null) {
    if (match[1]) {
      bannedCodes.add(match[1].trim());
    }
  }

  // Remove known OTP phrases from the text
  let cleaned = text
    .replace(OTP_CONTEXT_REGEX, ' [OTP_FILTERED] ')
    .replace(DEMO_TELEGRAM_REGEX, ' [OTP_FILTERED] ');

  return { cleaned, bannedCodes };
}

/**
 * Parse and validate a candidate string into an ExtractedNumber if valid/possible
 */
export function parseCandidateNumber(
  candidate: string,
  context: ExtractionContext,
  bannedCodes: Set<string>
): ExtractedNumber | null {
  if (!candidate) return null;

  // Clean candidate: remove spaces, dashes, brackets, dots, slashes
  const trimmed = candidate.trim();
  const digitsOnly = trimmed.replace(/\D/g, '');

  // 1. Length checks based on settings
  const minLen = context.settings.minPhoneLength || 7;
  const maxLen = context.settings.maxPhoneLength || 16;
  if (digitsOnly.length < minLen || digitsOnly.length > maxLen) {
    return null;
  }

  // 2. Filter out known OTP codes
  if (bannedCodes.has(digitsOnly) || isOtpOrVerificationCode(trimmed)) {
    return null;
  }

  // 3. Filter out timestamps and sequential noise
  if (isTimestampOrNoise(digitsOnly)) {
    return null;
  }

  let phoneNumber: PhoneNumber | undefined;
  let detectedCountry: string = '';
  let validationStatus: NumberValidationStatus = 'INVALID';
  let isValid = false;
  let isPossible = false;
  let confidence: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
  let reviewReason: string | undefined;

  // Standardize prefix
  let testNumber = trimmed;
  if (testNumber.startsWith('00')) {
    testNumber = '+' + testNumber.slice(2);
  }

  // Try parsing directly if has '+'
  if (testNumber.startsWith('+')) {
    try {
      phoneNumber = parsePhoneNumber(testNumber);
      if (phoneNumber) {
        isValid = phoneNumber.isValid();
        isPossible = phoneNumber.isPossible();
        detectedCountry = phoneNumber.country || '';
      }
    } catch {
      // Invalid format
    }
  }

  // If not parsed yet and does not have '+', test prepending '+'
  // Real SMS panel reports like Flex SMS often output numbers without '+' like '96891234567' or '2250708091011'
  if (!phoneNumber) {
    try {
      const testWithPlus = '+' + digitsOnly;
      const testPn = parsePhoneNumber(testWithPlus);
      if (testPn && (testPn.isValid() || testPn.isPossible())) {
        phoneNumber = testPn;
        isValid = testPn.isValid();
        isPossible = testPn.isPossible();
        detectedCountry = testPn.country || '';
      }
    } catch {
      // Not a valid international number with dial code
    }
  }

  // If still not parsed, and user configured a default fallback country (e.g. 'OM' or 'US')
  if (!phoneNumber && context.settings.defaultFallbackCountry) {
    try {
      const testPn = parsePhoneNumber(trimmed, context.settings.defaultFallbackCountry as CountryCode);
      if (testPn && (testPn.isValid() || testPn.isPossible())) {
        phoneNumber = testPn;
        isValid = testPn.isValid();
        isPossible = testPn.isPossible();
        detectedCountry = testPn.country || context.settings.defaultFallbackCountry;
      }
    } catch {
      // Fallback failed
    }
  }

  // Determine status and confidence
  if (phoneNumber && isValid) {
    validationStatus = 'VALID';
    confidence = 'HIGH';
  } else if (phoneNumber && isPossible) {
    validationStatus = 'POSSIBLE';
    confidence = 'MEDIUM';
  } else if (phoneNumber) {
    validationStatus = 'REVIEW';
    confidence = 'LOW';
    reviewReason = 'Possible number but failed strict carrier validation';
  } else if (digitsOnly.length >= 8 && digitsOnly.length <= 15) {
    // Ambiguous number (e.g. national number without international dial code)
    if (!context.settings.enableReviewBucket) {
      return null;
    }
    validationStatus = 'REVIEW';
    confidence = 'LOW';
    reviewReason = 'Unrecognized country dial code or missing country prefix';
  } else {
    // Unusable / non-phone
    return null;
  }

  // Format representations
  const normalized = phoneNumber ? phoneNumber.number : `+${digitsOnly}`;
  const nationalFormat = phoneNumber ? phoneNumber.formatNational() : digitsOnly;
  const internationalFormat = phoneNumber ? phoneNumber.formatInternational() : `+${digitsOnly}`;
  const countryCode = detectedCountry || (phoneNumber?.country || '');
  const countryName = getCountryName(countryCode);
  const dialCode = phoneNumber?.countryCallingCode ? `+${phoneNumber.countryCallingCode}` : getCountryDialCode(countryCode);
  const flag = getCountryFlag(countryCode);

  let numberType: NumberType = 'UNKNOWN';
  if (phoneNumber) {
    const rawType = phoneNumber.getType();
    if (rawType === 'MOBILE') numberType = 'MOBILE';
    else if (rawType === 'FIXED_LINE') numberType = 'FIXED_LINE';
    else if (rawType === 'VOIP') numberType = 'VOIP';
    else if (rawType === 'PAGER') numberType = 'PAGER';
    else if (rawType === 'TOLL_FREE') numberType = 'TOLL_FREE';
  }

  // Duplicate detection using E.164 normalized value
  let isDuplicate = false;
  let duplicateCount = 0;
  const existing = context.existingMap.get(normalized);
  if (existing) {
    isDuplicate = true;
    existing.duplicateCount += 1;
    duplicateCount = existing.duplicateCount;
  }

  // Check persistent copied numbers memory
  const copiedRecord = getCopiedRecord(normalized);
  const isPreviouslyCopied = isNumberPreviouslyCopied(normalized);
  const copiedAt = copiedRecord?.copiedAt;

  const extracted: ExtractedNumber = {
    id: `${context.fileName}_${context.rowIndex}_${normalized}_${Math.random().toString(36).slice(2, 7)}`,
    original: trimmed,
    normalized,
    nationalFormat,
    internationalFormat,
    digitsOnly,
    countryCode,
    countryName,
    dialCode,
    flag,
    status: validationStatus,
    isValid,
    isPossible,
    numberType,
    sourceFile: context.fileName,
    sourceSheet: context.sheetName,
    sourceRow: context.rowIndex,
    sourceColumn: context.columnName,
    isDuplicate,
    duplicateCount,
    isPreviouslyCopied,
    copiedAt,
    confidence,
    reviewReason,
  };

  if (!existing) {
    context.existingMap.set(normalized, extracted);
  }

  return extracted;
}

/**
 * Extract phone numbers from a cell value or text line
 */
export function extractNumbersFromCell(
  value: unknown,
  context: ExtractionContext
): ExtractedNumber[] {
  if (value === null || value === undefined) return [];

  // Convert numbers or booleans safely to string
  let strVal = String(value).trim();
  if (!strVal || strVal.length < 3) return [];

  // Ignore status labels or common spreadsheet headers
  const lower = strVal.toLowerCase();
  if (
    lower === 'failed' ||
    lower === 'undelivered' ||
    lower === 'delivered' ||
    lower === 'rejected' ||
    lower === 'expired' ||
    lower === 'sent' ||
    lower === 'status' ||
    lower === 'phone' ||
    lower === 'recipient' ||
    lower === 'destination' ||
    lower === 'msisdn' ||
    lower === 'number' ||
    lower === 'message' ||
    lower === 'content'
  ) {
    return [];
  }

  // Sanitize message body: strip demo OTP codes and Telegram codes
  const { cleaned, bannedCodes } = sanitizeTextContent(strVal);

  // If the cell is a single standalone phone number (most common in SMS panels)
  const isDirectCandidate = /^[\+]?[0-9\s\-\.\(\)]{7,22}$/.test(strVal);
  if (isDirectCandidate) {
    const single = parseCandidateNumber(strVal, context, bannedCodes);
    if (single) return [single];
  }

  // If cell is a mixed text (e.g. contains message, OTP, and recipient)
  // Search for international phone numbers inside the cleaned text
  const results: ExtractedNumber[] = [];
  
  // Match candidate phone strings (sequences of 7 to 18 digits or + followed by digits)
  const phonePattern = /(?:\+?[0-9]{1,4}[\s\-]?)?(?:\(?[0-9]{2,5}\)?[\s\-]?)?[0-9]{3,5}[\s\-]?[0-9]{3,6}/g;
  let match: RegExpExecArray | null;

  while ((match = phonePattern.exec(cleaned)) !== null) {
    const token = match[0].trim();
    // Exclude short OTP tokens (e.g. 5 digits)
    if (token.replace(/\D/g, '').length >= (context.settings.minPhoneLength || 7)) {
      const parsed = parseCandidateNumber(token, context, bannedCodes);
      if (parsed) {
        results.push(parsed);
      }
    }
  }

  return results;
}
