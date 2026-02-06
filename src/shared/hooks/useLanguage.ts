import { useState, useEffect, useCallback } from 'react';

type Language = 'zh-CN' | 'en';

const LANGUAGE_KEY = 'growth-lab-language';

function getStoredLanguage(): Language {
  if (typeof window === 'undefined') return 'zh-CN';
  const stored = localStorage.getItem(LANGUAGE_KEY);
  return stored === 'en' ? 'en' : 'zh-CN';
}

export function useLanguage() {
  const [language, setLanguageState] = useState<Language>(getStoredLanguage);

  useEffect(() => {
    // Sync with localStorage on mount
    const stored = getStoredLanguage();
    if (stored !== language) {
      setLanguageState(stored);
    }
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(LANGUAGE_KEY, lang);
  }, []);

  const toggleLanguage = useCallback(() => {
    const newLang = language === 'zh-CN' ? 'en' : 'zh-CN';
    setLanguage(newLang);
  }, [language, setLanguage]);

  const t = useCallback((zh: string, en: string): string => {
    return language === 'zh-CN' ? zh : en;
  }, [language]);

  return { language, setLanguage, toggleLanguage, t };
}

// Export for initializing AppProvider with stored language
export function getInitialLanguage(): Language {
  return getStoredLanguage();
}
