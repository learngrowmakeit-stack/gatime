import test from 'node:test';
import assert from 'node:assert/strict';
import { DEMO_RECIPES, validateRecipe, normalizeRecipe, parseRecipes } from './recipes.js';
const recipe = { ...DEMO_RECIPES[0], id: 'test', title: '  My pasta  ', calories: '', protein: '12.5', carbs: '', fat: '', minutes: '20', servings: '2' };
test('sample recipes are valid and survive backup round trip', () => {
  assert.equal(parseRecipes(JSON.stringify(DEMO_RECIPES)).length, 6);
  for (const item of DEMO_RECIPES) assert.equal(validateRecipe(item), '');
});
test('normalizes values without turning unknown nutrition into zero', () => {
  const result = normalizeRecipe(recipe);
  assert.equal(result.title, 'My pasta'); assert.equal(result.calories, null); assert.equal(result.protein, 12.5); assert.equal(result.minutes, 20); assert.equal(result.servings, 2);
});
test('rejects invalid servings, negative nutrition and missing steps', () => {
  for(const servings of [0,-1,1.5,'abc']) assert.ok(validateRecipe({...recipe,servings}));
  assert.ok(validateRecipe({...recipe,calories:-20})); assert.ok(validateRecipe({...recipe,ingredients:[' ']})); assert.ok(validateRecipe({...recipe,instructions:[]}));
});
test('backup import rejects malformed or invalid recipe data', () => {
  for (const data of [{},[null],[{...recipe,ingredients:[2]}],[{...recipe,calories:-1}],[{...recipe,category:'unknown'}]]) assert.throws(() => parseRecipes(JSON.stringify(data)));
  assert.deepEqual(parseRecipes('[]'), []);
});
test('embedded JPEG photos survive backup and restore while unsafe image types are removed',()=>{
 const image='data:image/jpeg;base64,/9j/AAAA';
 assert.equal(parseRecipes(JSON.stringify([{...recipe,image}]))[0].image,image);
 for(const image of ['data:image/svg+xml;base64,AAAA','javascript:alert(1)','data:image/jpeg;base64,/9j/'+ 'A'.repeat(60000)])assert.equal(parseRecipes(JSON.stringify([{...recipe,image}]))[0].image,'');
});
