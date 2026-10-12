export const MAX_PHOTO_LENGTH = 60000;
export function safeRecipeImage(value) {
  if (typeof value !== 'string') return '';
  if (value.startsWith('https://')) return value;
  return value.length <= MAX_PHOTO_LENGTH && /^data:image\/jpeg;base64,\/9j\/[A-Za-z0-9+/]*={0,2}$/.test(value) ? value : '';
}
export async function preparePhoto(file) {
  if (!file || !/^image\/(jpeg|png|webp|gif|avif)$/i.test(file.type)) throw new Error('Choose a JPG, PNG, WebP, GIF or AVIF photo. If your phone uses HEIC, export the photo as JPG first.');
  if(file.size > 20 * 1024 * 1024) throw new Error('Choose a photo smaller than 20 MB.');
  let bitmap;
  try { bitmap = await createImageBitmap(file); }
  catch { throw new Error('This photo could not be opened. Try a different photo or save it as JPG.'); }
  try {
    for(const maxSize of [768,600,450,320]) {
      const scale=Math.min(1,maxSize/Math.max(bitmap.width,bitmap.height));
      const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
      const ctx=canvas.getContext('2d');ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
      for(const quality of [.82,.7,.55,.4]) {
        const data=canvas.toDataURL('image/jpeg',quality);
        if(safeRecipeImage(data)) return data;
      }
    }
    throw new Error('This photo could not be made small enough. Try another photo.');
  } finally { bitmap.close(); }
}
