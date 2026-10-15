import { useEffect, useRef, useState } from 'react';
import { useLanguage } from './Language';
import { cloud } from './cloud';
const extract = recipe => ({id:recipe.id,title:recipe.title,description:recipe.description,ingredients:recipe.ingredients,instructions:recipe.instructions});
const sourceKey = recipe => JSON.stringify(extract(recipe));
const cacheKey = userId => `gatime.translated.v1:${userId}`;
function readCache(userId){try{const value=JSON.parse(localStorage.getItem(cacheKey(userId))||'{}');return value&&typeof value==='object'&&!Array.isArray(value)?value:{};}catch{return {};}}
function validResult(source,value){return value&&value.id===source.id&&typeof value.title==='string'&&typeof value.description==='string'&&['ingredients','instructions'].every(key=>Array.isArray(value[key])&&value[key].length===source[key].length&&value[key].every(line=>typeof line==='string'));}
export default function useTranslatedRecipes(recipes,user) {
 const {language}=useLanguage();const [enabled,setEnabled]=useState(false);const [retry,setRetry]=useState(0);const [stored,setStored]=useState({owner:null,entries:{}});const [status,setStatus]=useState('');const [error,setError]=useState('');const generation=useRef(0);
 const signature=JSON.stringify(recipes.map(sourceKey));
 useEffect(()=>{
  const run=++generation.current;const controller=new AbortController();setError('');setStatus('');
  const entries=readCache(user?.id||'guest');setStored({owner:user?.id||'guest',entries});
  if(!enabled||!recipes.length)return()=>controller.abort();
  const missing=recipes.filter(recipe=>!validResult(recipe,entries[`${language}:${recipe.id}`]?.value)||entries[`${language}:${recipe.id}`]?.source!==sourceKey(recipe));
  if(!missing.length){setStatus('translated');return()=>controller.abort();}
  if(!user||!cloud){setError('Sign in to translate recipe content. Original recipes are still available.');return()=>controller.abort();}
  if(!navigator.onLine){setError('You are offline. Previously translated recipes remain available; other recipes use the original text.');return()=>controller.abort();}
  setStatus('loading');
  (async()=>{
   try{
    const {data:{session}}=await cloud.auth.getSession();if(!session)throw new Error('SIGN_IN');
    const batches=[];let group=[];
    for(const recipe of missing){if(group.length&&(group.length===5||JSON.stringify([...group,recipe].map(extract)).length>13500)){batches.push(group);group=[];}group.push(recipe);}if(group.length)batches.push(group);
    for(const batch of batches){
     const response=await fetch('/api/translate',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${session.access_token}`},body:JSON.stringify({language,recipes:batch.map(extract)}),signal:controller.signal});
     const result=await response.json();if(!response.ok)throw new Error(result.error||'PROVIDER');
     if(!Array.isArray(result.recipes)||result.recipes.length!==batch.length)throw new Error('INVALID_TRANSLATION');
     for(const source of batch){const value=result.recipes.find(recipe=>recipe.id===source.id);if(!validResult(source,value))throw new Error('INVALID_TRANSLATION');delete entries[`${language}:${source.id}`];entries[`${language}:${source.id}`]={source:sourceKey(source),value};}
     if(run!==generation.current)return;
     // Cache source text and translations separately from originals; photos and credentials are excluded.
     const savedEntries=Object.fromEntries(Object.entries(entries).slice(-60));
     try{localStorage.setItem(cacheKey(user.id),JSON.stringify(savedEntries));}catch{/* Translations remain usable for this visit. */}
     setStored({owner:user.id,entries:{...entries}});
    }
    if(run===generation.current)setStatus('translated');
   }catch(reason){
    if(run!==generation.current||controller.signal.aborted)return;
    const messages={NOT_CONFIGURED:'Recipe translation needs a Gemini API key in Vercel.',SIGN_IN:'Sign in to translate recipe content. Original recipes are still available.',RATE_LIMIT:'Translation limit reached. Try again later. Original recipes are still available.',INVALID_INPUT:'This recipe is too long to translate automatically. Original text is kept.',INVALID_TRANSLATION:'The translation could not be verified. Original recipe text has been kept.'};
    setError(messages[reason.message]||'Could not translate recipes. Try again later. Original recipes are still available.');setStatus('');
   }
  })();
  return()=>{controller.abort();};
 },[signature,user?.id,language,enabled,retry]);
 useEffect(()=>{const online=()=>setRetry(value=>value+1);window.addEventListener('online',online);return()=>window.removeEventListener('online',online);},[]);
 const translated=recipe=>{if(!enabled||stored.owner!==(user?.id||'guest'))return recipe;const entry=stored.entries[`${language}:${recipe.id}`];return entry?.source===sourceKey(recipe)&&validResult(recipe,entry.value)?{...recipe,...entry.value}:recipe;};
 return {translated,enabled,setEnabled,status,error,retry:()=>setRetry(value=>value+1)};
}
