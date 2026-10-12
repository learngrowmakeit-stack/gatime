import React, { useEffect, useRef, useState } from 'react';
import { ImagePlus, Trash2 } from 'lucide-react';
import { preparePhoto } from './photos';
export default function PhotoPicker({value,onChange,onBusy}) {
  const input=useRef();const generation=useRef(0);const [busy,setBusy]=useState(false);const [error,setError]=useState('');
  useEffect(()=>()=>{generation.current++;},[]);
  async function choose(event) {
    const file=event.target.files?.[0];event.target.value='';if(!file)return;
    const run=++generation.current;setBusy(true);onBusy(true);setError('');
    try {const photo=await preparePhoto(file);if(run===generation.current)onChange(photo);}
    catch(e){if(run===generation.current)setError(e.message);}
    finally{if(run===generation.current){setBusy(false);onBusy(false);}}
  }
  return <section className="photo-picker"><h3>Recipe photo</h3><p>Choose a photo from your gallery. It is saved with the recipe, including when you sync.</p>{value && <img className="photo-preview" src={value} alt="Recipe photo preview"/>}<input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" hidden aria-label="Choose recipe photo" onChange={choose}/><div><button type="button" className="secondary-button" disabled={busy} onClick={()=>input.current.click()}><ImagePlus size={16}/>{busy?'Preparing photo…':value?'Change photo':'Choose from gallery'}</button>{value && <button type="button" className="delete-button" disabled={busy} onClick={()=>{onChange('');setError('');}}><Trash2 size={15}/>Remove photo</button>}</div>{error && <p className="form-error" role="alert">{error}</p>}</section>;
}
