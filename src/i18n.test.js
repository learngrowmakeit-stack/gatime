import test from 'node:test';
import assert from 'node:assert/strict';
import { translate, validLanguage } from './i18n.js';
import { messages } from './translations.js';
import { buildShoppingList, shoppingText } from './shopping.js';
test('Albanian, German and English UI labels use the correct language',()=>{
 assert.equal(translate('Add recipe','sq'),'Shto recetë');assert.equal(translate('Add recipe','de'),'Rezept hinzufügen');assert.equal(translate('Add recipe','en'),'Add recipe');assert.equal(validLanguage('fr'),false);assert.equal(translate('Add recipe','fr'),'Shto recetë');
});
test('both translations retain every interpolation parameter',()=>{
 const parameters=text=>[...text.matchAll(/\{(\w+)\}/g)].map(m=>m[1]).sort();
 for(const [key,translations] of Object.entries(messages))for(const text of translations){assert.ok(text.trim());assert.deepEqual(parameters(text),parameters(key),key);}
});
test('dynamic status messages translate without changing inserted recipe names',()=>{
 assert.equal(translate('Imported 3 recipes. Your existing recipes were kept.','de'),'3 Rezepte importiert. Vorhandene Rezepte wurden beibehalten.');
 assert.equal(translate('Open {p0}','sq',{p0:'My original recipe'}),'Hap My original recipe');
 assert.equal(translate('Could not import: This file contains an invalid recipe.','sq'),'Importimi dështoi: Ky skedar përmban një recetë të pavlefshme.');
});
test('shopping exports translate their headings while recipe text remains intact',()=>{
 const recipes=[{id:'test',title:'Receta ime',ingredients:['200 g oriz']}];const text=shoppingText(recipes,buildShoppingList(recipes),[],key=>translate(key,'de'));
 assert.match(text,/Gatime-Einkaufsliste/);assert.match(text,/Zutaten:/);assert.match(text,/Receta ime/);assert.match(text,/200 g oriz/);
});
