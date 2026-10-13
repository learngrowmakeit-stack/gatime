import { messages } from './translations.js';
export const LANGUAGES = ['sq', 'de', 'en'];
export const LANGUAGE_KEY = 'gatime.language.v1';
export const validLanguage = value => LANGUAGES.includes(value);
const escape = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const templates = Object.keys(messages).filter(key => key.includes('{')).map(key => {
  const names = [...key.matchAll(/\{(\w+)\}/g)].map(match => match[1]);
  const pattern = key.split(/\{\w+\}/).map(escape).join('(.*?)');
  return { key, names, regex: new RegExp(`^${pattern}$`, 's') };
});
export function translate(text, language = 'sq', values = {}) {
  if (typeof text !== 'string') return text;
  const selected = validLanguage(language) ? language : 'sq';
  let key = text, params = values;
  if (!messages[key]) {
    for (const template of templates) {
      const match = text.match(template.regex);
      if (match) { key = template.key; params = Object.fromEntries(template.names.map((name, index) => [name, match[index + 1]])); break; }
    }
  }
  const translated = selected === 'en' ? key : messages[key]?.[selected === 'sq' ? 0 : 1] ?? key;
  return translated.replace(/\{(\w+)\}/g, (token, name) => {
    const value = params[name];
    if (value === undefined) return token;
    return key === 'Could not import: {p0}' ? translate(String(value), selected) : String(value);
  });
}
