import React, { createContext, useContext, useState, useCallback } from 'react';
import { tr } from '../translations/tr';
import { en } from '../translations/en';

type Lang = 'tr' | 'en';
type Translations = typeof tr;

const translations: Record<Lang, Translations> = { tr, en };

interface I18nContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (path: string, fallback?: string) => string;
  toggleLang: () => void;
}

const I18nContext = createContext<I18nContextType>({
  lang: 'tr',
  setLang: () => {},
  t: (p: string) => p,
  toggleLang: () => {},
});

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Lang>(() => {
    return (localStorage.getItem('lang') as Lang) || 'tr';
  });

  const t = useCallback((path: string, fallback?: string): string => {
    const keys = path.split('.');
    let result: any = translations[lang];
    for (const key of keys) {
      if (result && typeof result === 'object' && key in result) {
        result = result[key];
      } else {
        return fallback || path;
      }
    }
    return typeof result === 'string' ? result : fallback || path;
  }, [lang]);

  const toggleLang = useCallback(() => {
    setLang((prev) => {
      const next = prev === 'tr' ? 'en' : 'tr';
      localStorage.setItem('lang', next);
      return next;
    });
  }, []);

  return (
    <I18nContext.Provider value={{ lang, setLang, t, toggleLang }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => useContext(I18nContext);
