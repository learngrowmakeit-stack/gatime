import { useEffect, useState } from 'react';
import { validServings } from './servings';
const empty = { selected: [], checked: [], servings: {} };
function load(key) {
  try {
    const raw=localStorage.getItem(key);if(raw===null)return {...empty,key};
    const value=JSON.parse(raw);
    if(!value || !Array.isArray(value.selected) || !value.selected.every(id=>typeof id==='string') || !Array.isArray(value.checked) || !value.checked.every(id=>typeof id==='string'))throw new Error('Invalid list');
    const servings = Object.fromEntries(Object.entries(value.servings&&typeof value.servings==='object'&&!Array.isArray(value.servings)?value.servings:{}).filter(([id,count])=>validServings(count)).map(([id,count])=>[id,Number(count)]));
    return {...value,servings,key};
  } catch { return {...empty,key,error:'Your previous shopping list could not be read. Select recipes to create a new list.'}; }
}
export default function useShopping(userId,onNotice) {
  const key=`gatime.shopping.v1:${userId || 'guest'}`;
  const [stored,setStored]=useState(()=>load(key));
  const state=stored.key===key ? stored : load(key);
  useEffect(()=>{
    setStored(load(key));
    const changed=event=>{if(event.key===key)setStored(load(key));};window.addEventListener('storage',changed);return()=>window.removeEventListener('storage',changed);
  },[key]);
  function save(next) {
    try {localStorage.setItem(key,JSON.stringify(next));setStored({...next,key});return true;}
    catch {onNotice('Could not save the shopping list. Check browser storage and try again.');return false;}
  }
  return {...state,
    fromPlan:totals=>{if(Object.values(totals).some(count=>!validServings(count))){onNotice('Choose a whole number of portions between 1 and 1,000.');return false;}return save({...load(key),selected:Object.keys(totals),checked:[],servings:{...load(key).servings,...totals}});},
    toggleRecipe:id=>{const latest=load(key);save({...latest,selected:latest.selected.includes(id)?latest.selected.filter(x=>x!==id):[...latest.selected,id],checked:latest.checked});},
    toggleItem:id=>{const latest=load(key);save({...latest,selected:latest.selected,checked:latest.checked.includes(id)?latest.checked.filter(x=>x!==id):[...latest.checked,id]});},
    setServings:(id,count)=>{if(!validServings(count))return;const latest=load(key);if(latest.servings[id]===Number(count))return;const checked=latest.checked.filter(item=>{try{const [group,,ids]=JSON.parse(item);return !(typeof group==='string'&&group.startsWith('amount:')&&Array.isArray(ids)&&ids.includes(id));}catch{return true;}});save({...latest,checked,servings:{...latest.servings,[id]:Number(count)}});},
    clear:()=>{const latest=load(key);save({...latest,selected:[],checked:[]});},uncheck:()=>save({...load(key),checked:[]}),
  };
}
