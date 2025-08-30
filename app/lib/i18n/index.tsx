"use client";
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { en } from './locales/en';
import { de } from './locales/de';
import { LocalStorageManager } from '@/lib/storage/local-storage';

type LocaleCode = 'en' | 'de';

const locales = {
  en,
  de,
};

type Messages = typeof en;

interface I18nContextValue {
  lang: LocaleCode;
  setLang: (lang: LocaleCode) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  messages: Messages;
  available: { code: LocaleCode; label: string }[];
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

function get(obj: any, path: string) {
  return path.split('.').reduce((acc, k) => (acc && acc[k] !== undefined ? acc[k] : undefined), obj);
}

export const I18nProvider = ({ children }: { children: React.ReactNode }) => {
  const [lang, setLangState] = useState<LocaleCode>('en');

  useEffect(() => {
    // Load language from settings or browser
    try {
      const settings: any = LocalStorageManager.loadSettings();
      const saved = settings.language as LocaleCode | undefined;
      if (saved && (saved === 'en' || saved === 'de')) {
        setLangState(saved);
        return;
      }
      // Default: browser language
      if (typeof navigator !== 'undefined') {
        const nav = navigator.language.toLowerCase();
        if (nav.startsWith('de')) setLangState('de');
      }
    } catch {}
  }, []);

  const setLang = (code: LocaleCode) => {
    setLangState(code);
    try {
      LocalStorageManager.saveSettings({ language: code });
    } catch {}
  };

  const messages = useMemo(() => locales[lang], [lang]);

  const t = (key: string, vars?: Record<string, string | number>) => {
    const raw = get(messages, key) ?? get(locales.en, key) ?? key;
    if (typeof raw !== 'string') return key;
    if (!vars) return raw;
    return Object.keys(vars).reduce((s, k) => s.replace(new RegExp(`\\{${k}\\}`, 'g'), String(vars[k])), raw);
  };

  const value: I18nContextValue = {
    lang,
    setLang,
    t,
    messages,
    available: [
      { code: 'en', label: 'English' },
      { code: 'de', label: 'Deutsch' },
    ],
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
};

