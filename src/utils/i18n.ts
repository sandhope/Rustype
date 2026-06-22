/**
 * Lightweight i18n module for Rustype.
 *
 * - JSON-based translation files in src/locales/
 * - Dot-path key resolution with {param} interpolation
 * - React hook (useI18n) for reactive language switching
 * - English as fallback language
 */

import { useState, useEffect, useCallback } from 'react';

type TranslationData = Record<string, unknown>;

let currentLanguage = 'zh-CN';
let translations: TranslationData = {};
let fallbackTranslations: TranslationData = {};
const listeners = new Set<() => void>();

// ── Translation loaders (static imports for Vite bundling) ──────────────

import enData from '../locales/en.json';
import zhCNData from '../locales/zh-CN.json';
import zhTWData from '../locales/zh-TW.json';
import jaData from '../locales/ja.json';
import koData from '../locales/ko.json';
import frData from '../locales/fr.json';
import deData from '../locales/de.json';
import esData from '../locales/es.json';
import ptData from '../locales/pt.json';

const localeMap: Record<string, TranslationData> = {
  'en': enData,
  'zh-CN': zhCNData,
  'zh-TW': zhTWData,
  'ja': jaData,
  'ko': koData,
  'fr': frData,
  'de': deData,
  'es': esData,
  'pt': ptData,
};

// ── Core functions ──────────────────────────────────────────────────────

/**
 * Resolve a dot-separated key path against a nested object.
 * e.g. resolve('menu.file.newTab', { menu: { file: { newTab: 'New Tab' } } }) => 'New Tab'
 */
function resolve(data: TranslationData, key: string): string | undefined {
  const parts = key.split('.');
  let current: unknown = data;
  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === 'string' ? current : undefined;
}

/**
 * Translate a key with optional parameter interpolation.
 * Falls back to English if the key is missing in the current language.
 * Returns the key itself if not found in any language.
 *
 * @example
 * t('menu.file.newTab')                    // => "新建标签页"
 * t('messages.updateAvailable', { version: '1.0' })  // => "发现新版本 1.0"
 */
export function t(key: string, params?: Record<string, string | number>): string {
  let result = resolve(translations, key);
  if (result === undefined) {
    result = resolve(fallbackTranslations, key);
  }
  if (result === undefined) {
    return key;
  }
  if (params) {
    for (const [param, replacement] of Object.entries(params)) {
      result = result.replace(new RegExp(`\\{${param}\\}`, 'g'), String(replacement));
    }
  }
  return result;
}

/**
 * Set the active language. Loads translations and notifies listeners.
 */
export function setLanguage(lang: string): void {
  currentLanguage = lang;
  translations = (localeMap[lang] || localeMap['zh-CN'] || {}) as TranslationData;
  fallbackTranslations = localeMap['en'] as TranslationData;
  listeners.forEach(fn => fn());
}

/**
 * Get the current language code.
 */
export function getLanguage(): string {
  return currentLanguage;
}

/**
 * Get the list of supported language codes.
 */
export function getSupportedLanguages(): string[] {
  return Object.keys(localeMap);
}

// ── React hook ──────────────────────────────────────────────────────────

/**
 * React hook for using translations in components.
 * Re-renders the component when the language changes.
 *
 * @example
 * function MenuBar() {
 *   const { t } = useI18n();
 *   return <span>{t('menu.file.title')}</span>;
 * }
 */
export function useI18n(): { t: typeof t; language: string; setLanguage: typeof setLanguage } {
  const [, setTick] = useState(0);

  useEffect(() => {
    const listener = () => setTick(n => n + 1);
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, []);

  const boundSetLanguage = useCallback((lang: string) => {
    setLanguage(lang);
  }, []);

  return { t, language: currentLanguage, setLanguage: boundSetLanguage };
}
