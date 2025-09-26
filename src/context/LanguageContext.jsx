import React, { createContext, useContext, useEffect, useState } from 'react';
import { translations } from '../i18n/translations.js';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};

// Funkce pro detekci jazyka prohlížeče
const detectBrowserLanguage = () => {
  // Získání jazyka prohlížeče
  const browserLang = navigator.language || navigator.userLanguage;
  const langCode = browserLang.toLowerCase();
  
  // Mapování jazyků prohlížeče na naše kódy
  if (langCode.startsWith('cs') || langCode.startsWith('cz')) return 'cz';
  if (langCode.startsWith('sk')) return 'sk';
  if (langCode.startsWith('en')) return 'en';
  
  // Fallback na češtinu
  return 'en';
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    // 1. Zkus načíst z localStorage
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage && ['cz', 'sk', 'en'].includes(savedLanguage)) {
      return savedLanguage;
    }
    
    // 2. Pokud není uložený, detekuj z prohlížeče
    return detectBrowserLanguage();
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const t = (key, params = {}) => {
    let text = translations[language]?.[key] || translations.cz[key] || key;
    
    // Interpolace parametrů {param}
    if (params && typeof params === 'object') {
      Object.keys(params).forEach(param => {
        text = text.replace(new RegExp(`\\{${param}\\}`, 'g'), params[param]);
      });
    }
    
    return text;
  };

  const changeLanguage = (newLanguage) => {
    setLanguage(newLanguage);
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};