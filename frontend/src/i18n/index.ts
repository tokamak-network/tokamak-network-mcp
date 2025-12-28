import { createContext, useContext } from 'react';
import { translations, type Language, type TranslationKey } from './translations';

export interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

export const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  setLang: () => {},
  t: (key) => key,
});

export const useLanguage = () => useContext(LanguageContext);

export const createTranslator = (lang: Language) => (key: TranslationKey): string => {
  return translations[lang][key] || translations.en[key] || key;
};

export { translations, type Language, type TranslationKey };
