import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCopiedRecipe } from './paste-recipe.js';
test('Albanian recipe paste separates title, ingredients, instructions and metadata',()=>{
 const result=parseCopiedRecipe('Receta: Supë me oriz\nPorcione: 4\nKoha: 30 minuta\nKategoria: Supa\nPërbërësit:\n• 200 g oriz\n- 1 l ujë\nUdhëzimet:\n1. Ziej ujin.\n2. Shto orizin.');
 assert.equal(result.complete,true);assert.equal(result.fields.title,'Supë me oriz');assert.equal(result.fields.servings,4);assert.equal(result.fields.minutes,30);assert.equal(result.fields.category,'Soups');assert.deepEqual(result.fields.ingredients,['200 g oriz','1 l ujë']);assert.deepEqual(result.fields.instructions,['Ziej ujin.','Shto orizin.']);
});
test('German copy handles diacritics, time totals, notes and per-serving nutrition',()=>{
 const result=parseCopiedRecipe('Rezept: Pasta\nFür 2 Personen\nVorbereitungszeit: 10 Minuten\nKochzeit: 20 Minuten\nZutaten:\n200 g Pasta\nZubereitung:\n1. Wasser kochen.\nDann salzen.\n2. Pasta garen.\nNährwerte pro Portion:\nKalorien: 420 kcal\nEiweiß: 12 g\nHinweise:\nNach Geschmack würzen.');
 assert.equal(result.fields.servings,2);assert.equal(result.fields.minutes,30);assert.equal(result.fields.calories,420);assert.equal(result.fields.protein,12);assert.deepEqual(result.fields.instructions,['Wasser kochen. Dann salzen.','Pasta garen.']);assert.deepEqual(result.unassigned,['Nach Geschmack würzen.']);
});
test('explicit total time takes precedence over separate prep and cook times',()=>{
 const {fields}=parseCopiedRecipe('Pasta\nPrep time: 10 minutes\nCook time: 20 minutes\nTotal time: 1 hour 5 minutes\nIngredients: 200 g pasta\nInstructions: Cook pasta.');assert.equal(fields.minutes,65);assert.equal(fields.title,'Pasta');assert.deepEqual(fields.ingredients,['200 g pasta']);
});
test('unlabelled quantities and numbered steps are separated without inventing nutrition',()=>{
 const result=parseCopiedRecipe('My pasta\n200 g pasta\n1 lemon\n1. Cook pasta.\n2. Add lemon.');assert.equal(result.complete,true);assert.equal(result.fields.ingredients.length,2);assert.equal(result.fields.instructions.length,2);assert.equal(result.fields.calories,undefined);
});
test('unclear nutrition totals are retained for review rather than treated as per serving',()=>{
 const result=parseCopiedRecipe('Rice\nIngredients:\n200 g rice\nInstructions:\nCook rice.\nNutrition:\nCalories: 500 kcal');assert.equal(result.fields.calories,undefined);assert.deepEqual(result.unassigned,['Calories: 500 kcal']);
});
test('incomplete and oversized texts cannot silently become complete recipes',()=>{
 assert.equal(parseCopiedRecipe('Just a title').complete,false);assert.throws(()=>parseCopiedRecipe('x'.repeat(20001)));assert.equal(parseCopiedRecipe('').complete,false);
});
test('markdown headings parse while incompatible nutrition units remain for review',()=>{
 const result=parseCopiedRecipe('**Rezept: Reis**\n### Zutaten\n200 g Reis\n### Zubereitung\n1. Kochen.\n### Nährwerte (pro Portion)\nKalorien: 800 kJ\nEiweiß: 500 mg');
 assert.equal(result.complete,true);assert.equal(result.fields.calories,undefined);assert.equal(result.fields.protein,undefined);assert.deepEqual(result.unassigned,['Kalorien: 800 kJ','Eiweiß: 500 mg']);
});
