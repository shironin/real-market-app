import React, { createContext, useContext, useState } from 'react';
import { Language, TranslationKey, translate } from './translations';

export const LANGUAGE_OPTIONS = [
  { label: 'RO', value: 'ro' as Language },
  { label: 'RU', value: 'ru' as Language },
];

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('ro');

  const t = (key: TranslationKey) => translate(language, key);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside LanguageProvider');
  return ctx;
}
