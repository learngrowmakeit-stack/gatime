import React, { createContext, useContext, useEffect, useState } from 'react';
import { Globe } from 'lucide-react';
import { LANGUAGE_KEY, validLanguage, translate } from './i18n';
const LanguageContext = createContext(null);
function readLanguage() {
  try { const saved = localStorage.getItem(LANGUAGE_KEY); return validLanguage(saved) ? saved : 'sq'; }
  catch { return 'sq'; }
}
export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(readLanguage);
  const t = (text, values) => translate(text, language, values);
  function setLanguage(value) {
    if (!validLanguage(value)) return;
    try { localStorage.setItem(LANGUAGE_KEY, value); } catch { /* Keep the choice for this visit when storage is unavailable. */ }
    setLanguageState(value);
  }
  useEffect(() => { document.documentElement.lang = language; document.title = translate('Gatime — Your personal recipe book', language); }, [language]);
  useEffect(() => { const changed = event => { if (event.key === LANGUAGE_KEY) setLanguageState(readLanguage()); }; window.addEventListener('storage', changed); return () => window.removeEventListener('storage', changed); }, []);
  return <LanguageContext.Provider value={{ language, setLanguage, t }}>{children}</LanguageContext.Provider>;
}
export const useLanguage = () => useContext(LanguageContext);
export function LanguageSelect() {
  const { language, setLanguage, t } = useLanguage();
  return <label className="language-select"><Globe size={16}/><select aria-label="Gjuha / Sprache / Language" title={t('Language')} value={language} onChange={event => setLanguage(event.target.value)}><option value="sq">Shqip</option><option value="de">Deutsch</option><option value="en">English</option></select></label>;
}
