const fractions = { '½': 0.5, '¼': 0.25, '¾': 0.75, '⅓': 1/3, '⅔': 2/3, '⅛': 0.125, '⅜': 0.375, '⅝': 0.625, '⅞': 0.875 };
const units = new Map([
  ['g', ['g',1]], ['gram', ['g',1]], ['grams', ['g',1]], ['kg', ['g',1000]],
  ['ml', ['ml',1]], ['l', ['ml',1000]], ['liter', ['ml',1000]], ['liters', ['ml',1000]], ['litre', ['ml',1000]],
  ['tbsp', ['tbsp',1]], ['tablespoon', ['tbsp',1]], ['tablespoons', ['tbsp',1]],
  ['tsp', ['tsp',1]], ['teaspoon', ['tsp',1]], ['teaspoons', ['tsp',1]],
  ['cup', ['cups',1]], ['cups', ['cups',1]], ['oz', ['oz',1]], ['lb', ['lb',1]],
]);
const normalize = text => text.trim().toLowerCase().replace(/\s+/g,' ');
function parseAmount(value) {
  if(fractions[value] !== undefined) return fractions[value];
  if(value.includes('/')) { const [a,b] = value.split('/').map(Number); return b ? a/b : NaN; }
  return Number(value.replace(',','.'));
}
export function parseIngredient(line) {
  const original = line.trim();
  const match = original.match(/^(\d+\s+\d+\/\d+|\d+[½¼¾⅓⅔⅛⅜⅝⅞]|\d+\/\d+|\d+(?:[.,]\d+)?|[½¼¾⅓⅔⅛⅜⅝⅞])\s+(.+)$/);
  if (!match) return { name: original, amount: null, unit: '', key: `text:${normalize(original)}` };
  const token=match[1];let amount;
  if(/\s/.test(token)) { const [whole,fraction]=token.split(/\s+/);amount=Number(whole)+parseAmount(fraction); }
  else if(fractions[token.at(-1)] && token.length>1) amount=Number(token.slice(0,-1))+fractions[token.at(-1)];
  else amount=parseAmount(token);
  let name=match[2], unit=''; const words=name.split(/\s+/);const found=units.get(words[0].toLowerCase().replace(/\.$/,''));
  if(found) { unit=found[0];amount*=found[1];name=words.slice(1).join(' '); }
  // Do not guess conversions for ranges, ambiguous amounts or preparation notes.
  if(!name || !Number.isFinite(amount) || amount<=0 || /^(?:[–—-]|(?:to|or)\s+\d)/i.test(name)) return {name:original,amount:null,unit:'',key:`text:${normalize(original)}`};
  return {name,amount,unit,key:`amount:${unit}:${normalize(name)}`};
}
export function formatAmount(amount) { return String(Number(amount.toFixed(3))); }
export function buildShoppingList(recipes) {
  const groups=new Map();
  for(const recipe of recipes) for(const line of recipe.ingredients) {
    const parsed=parseIngredient(line);
    if(!groups.has(parsed.key)) groups.set(parsed.key,{...parsed,occurrences:0,recipes:[]});
    const row=groups.get(parsed.key);if(row.occurrences && parsed.amount!==null) row.amount+=parsed.amount;
    row.occurrences++;
    if(!row.recipes.some(source=>source.id===recipe.id))row.recipes.push({id:recipe.id,title:recipe.title});
  }
  return [...groups.values()].map(row=>{
    const label=row.amount===null ? `${row.occurrences>1 ? `${row.occurrences} × ` : ''}${row.name}` : `${formatAmount(row.amount)}${row.unit ? ` ${row.unit}` : ''} ${row.name}`;
    return {...row,label,checkKey:JSON.stringify([row.key,label,row.recipes.map(r=>r.id).sort()])};
  });
}
export function shoppingText(recipes, rows, checked, t = (text,values={}) => text.replace(/\{(\w+)\}/g,(token,key)=>values[key]===undefined?token:String(values[key]))) {
  return `${t('Gatime shopping list')}\n\n${t('Recipes:')}\n${recipes.map(r=>`• ${r.title}${r.baseServings!==undefined ? ` (${t('{count} servings',{count:r.servings})})` : ''}`).join('\n')}\n\n${t('Ingredients:')}\n${rows.map(row=>`${checked.includes(row.checkKey)?'[x]':'[ ]'} ${row.label}`).join('\n')}`;
}
