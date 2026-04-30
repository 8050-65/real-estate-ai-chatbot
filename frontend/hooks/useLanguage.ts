import { useState, useCallback } from 'react';

const LANGUAGE_CODES: Record<string, string> = {
  en: 'English',
  hi: 'Hindi',
  kn: 'Kannada',
  ta: 'Tamil',
  te: 'Telugu',
  bn: 'Bengali',
  ur: 'Urdu',
  fr: 'French',
  es: 'Spanish',
  pt: 'Portuguese',
  de: 'German',
  zh: 'Chinese',
  ja: 'Japanese',
  ar: 'Arabic',
};

export function useLanguage() {
  const [language, setLanguage] = useState<string>(() => {
    // Initialize from localStorage if available (SSR safe)
    if (typeof window !== 'undefined') {
      return localStorage.getItem('bot_language') || 'en';
    }
    return 'en';
  });

  // Save language to localStorage when it changes
  const updateLanguage = useCallback((newLanguage: string) => {
    if (newLanguage && LANGUAGE_CODES[newLanguage]) {
      setLanguage(newLanguage);
      if (typeof window !== 'undefined') {
        localStorage.setItem('bot_language', newLanguage);
        // Dispatch custom event so other components know language changed
        window.dispatchEvent(new CustomEvent('languageChanged', { detail: newLanguage }));
        console.log('[useLanguage] Language updated to:', newLanguage);
      }
    }
  }, []);

  // Get language name from code
  const getLanguageName = (code: string = language) => {
    return LANGUAGE_CODES[code] || 'English';
  };

  // Get language flag
  const getLanguageFlag = (code: string = language) => {
    const flags: Record<string, string> = {
      en: '🇬🇧',
      hi: '🇮🇳',
      kn: '🇮🇳',
      ta: '🇮🇳',
      te: '🇮🇳',
      bn: '🇧🇩',
      ur: '🇵🇰',
      fr: '🇫🇷',
      es: '🇪🇸',
      pt: '🇵🇹',
      de: '🇩🇪',
      zh: '🇨🇳',
      ja: '🇯🇵',
      ar: '🇸🇦',
    };
    return flags[code] || '🌐';
  };

  return {
    language,
    updateLanguage,
    getLanguageName,
    getLanguageFlag,
    allLanguages: LANGUAGE_CODES,
  };
}
