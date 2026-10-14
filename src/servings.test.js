import test from 'node:test';
import assert from 'node:assert/strict';
import { scaleIngredient, scaleRecipe, targetServings, validServings } from './servings.js';
import { buildShoppingList, shoppingText } from './shopping.js';
const recipe={id:'a',title:'Pasta',servings:2,ingredients:['200 g pasta','½ cup cream','1 lemon','Salt to taste'],instructions:['Boil for 10 minutes.'],minutes:20,calories:520};
test('changing portions scales quantities and fractions without altering the saved recipe',()=>{
 const value=scaleRecipe(recipe,4);assert.deepEqual(value.ingredients,['400 g pasta','1 cup cream','2 lemon','Salt to taste']);assert.equal(value.servings,4);assert.equal(value.baseServings,2);assert.equal(recipe.servings,2);assert.equal(recipe.ingredients[0],'200 g pasta');assert.equal(value.calories,520);assert.deepEqual(value.instructions,recipe.instructions);assert.equal(value.minutes,20);
});
test('scaling keeps units and package sizes; uncertain quantities are not guessed',()=>{
 assert.equal(scaleIngredient('1 kg flour',2),'2 kg flour');assert.equal(scaleIngredient('1 1/2 cups rice',2),'3 cups rice');assert.equal(scaleIngredient('1½ cups rice',2),'3 cups rice');assert.equal(scaleIngredient('2 packets (200 g each)',2),'4 packets (200 g each)');assert.equal(scaleIngredient('1–2 lemons',2),'1–2 lemons');assert.equal(scaleIngredient('1 to 2 cups rice',2),'1 to 2 cups rice');
});
test('repeated adjustments always use the original quantities rather than compounding',()=>{
 assert.equal(scaleRecipe(recipe,6).ingredients[0],'600 g pasta');assert.equal(scaleRecipe(recipe,1).ingredients[0],'100 g pasta');assert.deepEqual(scaleRecipe(recipe,2).ingredients,recipe.ingredients);
});
test('shopping totals combine separately scaled recipes and invalidate bought quantities',()=>{
 const other={...recipe,id:'b',servings:4,ingredients:['300 g pasta']};const before=buildShoppingList([recipe,other]);const after=buildShoppingList([scaleRecipe(recipe,4),scaleRecipe(other,2)]);
 assert.equal(after[0].label,'550 g pasta');assert.notEqual(before[0].checkKey,after[0].checkKey);assert.match(shoppingText([scaleRecipe(recipe,4)],after,[],(key,params)=>key.replace('{count}',params?.count)),/4 servings/);
});
test('invalid portion choices leave the original intact and default to original servings',()=>{
 for(const count of [0,-1,1.5,1001,'abc','']){assert.equal(validServings(count),false);assert.deepEqual(scaleRecipe(recipe,count),recipe);}
 assert.equal(targetServings(recipe,{}),2);assert.equal(targetServings(recipe,{a:4}),4);assert.equal(targetServings(recipe,{a:0}),2);
});
