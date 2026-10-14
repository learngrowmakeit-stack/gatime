import { parseIngredient, formatAmount } from './shopping.js';
const fractions={'½':.5,'¼':.25,'¾':.75,'⅓':1/3,'⅔':2/3,'⅛':.125,'⅜':.375,'⅝':.625,'⅞':.875};
export const validServings = value => Number.isInteger(Number(value)) && Number(value)>=1 && Number(value)<=1000;
export function targetServings(recipe, choices={}) {return validServings(choices[recipe.id])?Number(choices[recipe.id]):Number(recipe.servings);}
export function scaleIngredient(line, ratio) {
 if(ratio===1)return line;
 if(!Number.isFinite(ratio)||ratio<=0||parseIngredient(line).amount===null)return line;
 const match=line.trim().match(/^(\d+\s+\d+\/\d+|\d+[½¼¾⅓⅔⅛⅜⅝⅞]|\d+\/\d+|\d+(?:[.,]\d+)?|[½¼¾⅓⅔⅛⅜⅝⅞])\s+(.+)$/);
 if(!match)return line;
 function number(text){if(fractions[text]!==undefined)return fractions[text];if(text.includes('/')){const[a,b]=text.split('/').map(Number);return b?a/b:NaN;}return Number(text.replace(',','.'));}
 const token=match[1];let amount;
 if(/\s/.test(token)){const[whole,fraction]=token.split(/\s+/);amount=Number(whole)+number(fraction);}
 else if(token.length>1&&fractions[token.at(-1)])amount=Number(token.slice(0,-1))+fractions[token.at(-1)];else amount=number(token);
 return Number.isFinite(amount)?`${formatAmount(amount*ratio)} ${match[2]}`:line;
}
export function scaleRecipe(recipe, count) {
 if(!validServings(count)||!Number.isFinite(Number(recipe.servings))||Number(recipe.servings)<=0)return recipe;
 return {...recipe,ingredients:recipe.ingredients.map(line=>scaleIngredient(line,Number(count)/Number(recipe.servings))),servings:Number(count),baseServings:recipe.servings};
}
