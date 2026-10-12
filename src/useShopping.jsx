import { useEffect, useState } from 'react';
const empty = { selected: [], checked: [] };
function load(key) {
  try {
    const raw=localStorage.getItem(key);if(raw===null)return {...empty,key};
    const value=JSON.parse(raw);
    if(!value || !Array.isArray(value.selected) || !value.selected.every(id=>typeof id==='string') || !Array.isArray(value.checked) || !value.checked.every(id=>typeof id==='string'))throw new Error('Invalid list');
    return {...value,key};
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
    try {localStorage.setItem(key,JSON.stringify(next));setStored({...next,key});}
    catch {onNotice('Could not save the shopping list. Check browser storage and try again.');}
  }
  return {...state,
    toggleRecipe:id=>{const latest=load(key);save({selected:latest.selected.includes(id)?latest.selected.filter(x=>x!==id):[...latest.selected,id],checked:latest.checked});},
    toggleItem:id=>{const latest=load(key);save({selected:latest.selected,checked:latest.checked.includes(id)?latest.checked.filter(x=>x!==id):[...latest.checked,id]});},
    clear:()=>save(empty),uncheck:()=>save({selected:state.selected,checked:[]}),
  };
}
