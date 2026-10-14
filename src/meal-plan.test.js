import test from 'node:test';
import assert from 'node:assert/strict';
import {weekDays,dateKey,planTotals} from './meal-plan.js';
test('weeks start Monday and cross month/year boundaries using local dates',()=>{assert.deepEqual(weekDays(new Date(2026,0,1)).map(dateKey),['2025-12-29','2025-12-30','2025-12-31','2026-01-01','2026-01-02','2026-01-03','2026-01-04']);assert.equal(dateKey(weekDays(new Date(2026,0,4))[0]),'2025-12-29');});
test('weekly shopping totals include repeated meals but exclude other weeks and missing recipes',()=>{const entries={'2026-10-12:Breakfast':{recipeId:'a',servings:2},'2026-10-13:Dinner':{recipeId:'a',servings:4},'2026-10-14:Lunch':{recipeId:'b',servings:3},'2026-10-19:Lunch':{recipeId:'a',servings:5},'2026-10-15:Lunch':{recipeId:'deleted',servings:2}};assert.deepEqual(planTotals(entries,weekDays(new Date(2026,9,14)),[{id:'a'},{id:'b'}]),{a:6,b:3});assert.equal(entries['2026-10-13:Dinner'].servings,4);});
