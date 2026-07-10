// useTranslate.js — Hook de tradução

import { useLanguage } from '../context/LanguageContext';
import { getTranslation, formatTranslation } from '../utils/translations';

export const useTranslate = () => {
  const { language } = useLanguage();

  const t = (key, vars = null) => {
    if (vars) {
      return formatTranslation(language, key, vars);
    }
    return getTranslation(language, key);
  };

  return { t, language };
};