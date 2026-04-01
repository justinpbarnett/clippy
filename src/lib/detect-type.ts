import { ClipType } from './types';

const URL_REGEX = /^https?:\/\/[^\s]+$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[+]?\s*[(]?\d{1,4}[)]?[\s\-./()\d]{6,20}$/;
const JSON_START = /^\s*[[\{]/;

const CODE_INDICATORS = [
  /^(import|export|const|let|var|function|class|if|for|while|return)\s/m,
  /[{};]\s*$/m,
  /=>/,
  /\b(def|fn|func|pub|impl|struct|enum)\b/,
  /<\/?[a-zA-Z][^>]*>/,
  /^\s{2,}(return|print|console|throw|raise)\b/m,
];

function looksLikeCode(text: string): boolean {
  const matchCount = CODE_INDICATORS.filter((r) => r.test(text)).length;
  const lineCount = text.split('\n').length;
  return matchCount >= 2 || (lineCount >= 3 && matchCount >= 1);
}

export function detectType(content: string): ClipType {
  const trimmed = content.trim();

  if (URL_REGEX.test(trimmed)) return ClipType.URL;
  if (EMAIL_REGEX.test(trimmed)) return ClipType.Email;
  if (PHONE_REGEX.test(trimmed)) return ClipType.Phone;

  if (JSON_START.test(trimmed)) {
    try {
      JSON.parse(trimmed);
      return ClipType.JSON;
    } catch {
      // not valid JSON, continue
    }
  }

  if (looksLikeCode(trimmed)) return ClipType.Code;

  return ClipType.PlainText;
}
