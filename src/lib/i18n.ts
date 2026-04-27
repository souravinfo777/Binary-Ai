import type { Language } from './types';
import enMessages from '../../public/_locales/en/messages.json';
import bnMessages from '../../public/_locales/bn/messages.json';

type MessageKey = keyof typeof enMessages;
type Messages = Record<string, { message: string }>;

const messageMap: Record<Language, Messages> = {
  en: enMessages,
  bn: bnMessages,
};

let currentLanguage: Language = 'en';

export function setLanguage(lang: Language): void {
  currentLanguage = lang;
}

export function getLanguage(): Language {
  return currentLanguage;
}

export function t(key: MessageKey): string {
  const messages = messageMap[currentLanguage];
  const entry = messages[key];
  if (entry && entry.message) {
    return entry.message;
  }
  const fallback = messageMap.en[key];
  if (fallback && fallback.message) {
    return fallback.message;
  }
  return key;
}

export function formatDate(timestamp: number, lang: Language): string {
  const locale = lang === 'bn' ? 'bn-BD' : 'en-US';
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(timestamp));
}
