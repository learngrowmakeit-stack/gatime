import test from 'node:test';
import assert from 'node:assert/strict';
import { buildShoppingList, parseIngredient, shoppingText } from './shopping.js';
const recipe=(id,ingredients)=>({id,title:`Recipe ${id}`,ingredients});
test('selected recipe ingredients form one list with summed compatible quantities',()=>{
 const rows=buildShoppingList([recipe('a',['200 g pasta','1 tbsp oil']),recipe('b',['300 g Pasta','2 tbsp oil'])]);
 assert.deepEqual(rows.map(r=>r.label),['500 g pasta','3 tbsp oil']);assert.equal(rows[0].recipes.length,2);
});
test('compatible metric units combine while weight, volume and spoon types stay separate',()=>{
 const rows=buildShoppingList([recipe('a',['1 kg flour','250 g flour','1 l milk','250 ml milk','1 tbsp sugar','2 tsp sugar','100 g milk'])]);
 assert.deepEqual(rows.map(r=>r.label),['1250 g flour','1250 ml milk','1 tbsp sugar','2 tsp sugar','100 g milk']);
});
test('fractional quantities and case-insensitive units are combined accurately',()=>{
 assert.equal(parseIngredient('1 1/2 cups flour').amount,1.5);assert.equal(parseIngredient('1½ cups flour').amount,1.5);
 const rows=buildShoppingList([recipe('a',['½ cup rice','1/4 CUP rice'])]);assert.equal(rows[0].label,'0.75 cups rice');
});
test('unquantified and ambiguous ingredients retain original text and multiplicity',()=>{
 const rows=buildShoppingList([recipe('a',['Salt to taste','1–2 lemons','1/0 cup water','1 to 2 cups flour']),recipe('b',['Salt to taste','1–2 lemons'])]);
 assert.deepEqual(rows.map(r=>r.label),['2 × Salt to taste','2 × 1–2 lemons','1/0 cup water','1 to 2 cups flour']);
});
test('preparation descriptions remain separate rather than guessing equivalence',()=>{
 const rows=buildShoppingList([recipe('a',['1 lemon, sliced','1 lemon, zest and juice'])]);assert.equal(rows.length,2);
});
test('changing recipes or quantity invalidates the purchased item identity',()=>{
 const before=buildShoppingList([recipe('a',['200 g pasta'])]);const after=buildShoppingList([recipe('a',['200 g pasta']),recipe('b',['300 g pasta'])]);assert.notEqual(before[0].checkKey,after[0].checkKey);
});
test('a shopping text export lists selected recipes and purchased markers',()=>{
 const recipes=[recipe('a',['200 g pasta','Salt to taste'])],rows=buildShoppingList(recipes);const text=shoppingText(recipes,rows,[rows[0].checkKey]);
 assert.match(text,/Recipe a/);assert.match(text,/\[x\] 200 g pasta/);assert.match(text,/\[ \] Salt to taste/);
 assert.equal(buildShoppingList([]).length,0);
});
