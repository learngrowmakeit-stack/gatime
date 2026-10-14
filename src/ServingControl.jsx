import React, { useEffect, useId, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { useLanguage } from './Language';
import { validServings } from './servings';
export default function ServingControl({value,onChange,label}) {
 const {t}=useLanguage();const id=useId();const [draft,setDraft]=useState(String(value));
 useEffect(()=>setDraft(String(value)),[value]);
 const invalid=draft!==''&&!validServings(draft);
 function change(text){setDraft(text);if(validServings(text)&&Number(text)!==Number(value))onChange(Number(text));}
 return <div className="serving-control"><label htmlFor={id}>{label||t('Cooking portions')}</label><div><button type="button" aria-label={t('Decrease portions')} disabled={value<=1} onClick={()=>change(String(value-1))}><Minus size={15}/></button><input id={id} type="number" min="1" max="1000" step="1" value={draft} aria-invalid={invalid} onChange={event=>change(event.target.value)} onBlur={()=>{if(!validServings(draft))setDraft(String(value));}}/><button type="button" aria-label={t('Increase portions')} disabled={value>=1000} onClick={()=>change(String(value+1))}><Plus size={15}/></button></div>{invalid&&<small role="alert">{t('Choose a whole number of portions between 1 and 1,000.')}</small>}</div>;
}
