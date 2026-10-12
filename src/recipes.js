import { safeRecipeImage } from './photos.js';
export const CATEGORIES = ['Main dish', 'Seafood', 'Desserts', 'Pasta', 'Breakfast', 'Salads', 'Soups'];
export const STORAGE_KEY = 'gatime.recipes.v1';
export const NUTRIENTS = ['calories', 'protein', 'carbs', 'fat'];
export function validateRecipe(recipe) {
  if (!recipe.title?.trim()) return 'Give your recipe a name.';
  if (!CATEGORIES.includes(recipe.category)) return 'Choose a category.';
  if (!Number.isInteger(Number(recipe.servings)) || Number(recipe.servings) < 1) return 'Servings must be a whole number of at least 1.';
  if (!recipe.ingredients?.some(line => line.trim())) return 'Add at least one ingredient.';
  if (!recipe.instructions?.some(line => line.trim())) return 'Add at least one instruction.';
  for (const key of ['minutes', ...NUTRIENTS]) {
    const value = recipe[key];
    if (value !== '' && value != null && (!Number.isFinite(Number(value)) || Number(value) < 0)) return 'Time and nutrition must be positive numbers or zero.';
  }
  return '';
}
export function normalizeRecipe(recipe) {
  const result = { ...recipe, title: recipe.title.trim(), description: recipe.description.trim(), servings: Number(recipe.servings), ingredients: recipe.ingredients.map(x => x.trim()).filter(Boolean), instructions: recipe.instructions.map(x => x.trim()).filter(Boolean) };
  for (const key of ['minutes', ...NUTRIENTS]) result[key] = recipe[key] === '' || recipe[key] == null ? null : Number(recipe[key]);
  return result;
}
export function parseRecipes(text) {
  const data = JSON.parse(text);
  if (!Array.isArray(data) || data.length > 5000) throw new Error('Choose a Gatime recipe backup containing up to 5,000 recipes.');
  return data.map(recipe => {
    if (!recipe || typeof recipe !== 'object' || typeof recipe.title !== 'string' || typeof recipe.description !== 'string' || !Array.isArray(recipe.ingredients) || !recipe.ingredients.every(x => typeof x === 'string') || !Array.isArray(recipe.instructions) || !recipe.instructions.every(x => typeof x === 'string') || typeof recipe.id !== 'string' || typeof recipe.favorite !== 'boolean') throw new Error('This file contains an invalid recipe.');
    const error = validateRecipe(recipe);
    if (error) throw new Error(error);
    return normalizeRecipe({ ...recipe, image: safeRecipeImage(recipe.image) });
  });
}
export const DEMO_RECIPES = [
  { id: 'demo-pasta', title: 'Creamy lemon & spinach pasta', description: 'A little sunshine in a bowl. Silky lemon sauce, fresh greens, and a generous sprinkle of parmesan.', category: 'Pasta', minutes: 25, servings: 2, calories: 520, protein: 18, carbs: 68, fat: 20, favorite: true, image: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=900&q=85', ingredients: ['200 g pasta', '100 g baby spinach', '100 ml cream', '1 lemon, zest and juice', '30 g parmesan, grated', '1 tbsp olive oil', 'Salt and pepper, to taste'], instructions: ['Bring a pot of salted water to a boil. Cook the pasta according to the packet instructions, reserving a cup of cooking water.', 'Warm the olive oil in a pan. Add spinach and stir until wilted.', 'Add the cream and lemon zest. Simmer gently for 2 minutes.', 'Toss in the pasta, parmesan, and a squeeze of lemon juice. Loosen with a little cooking water, season, and serve.'] },
  { id: 'demo-salmon', title: 'Herb-roasted salmon bowl', description: 'Tender salmon, fluffy grains, and crisp greens with a fresh lemon dressing.', category: 'Seafood', minutes: 30, servings: 2, calories: 610, protein: 42, carbs: 48, fat: 28, favorite: false, image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=900&q=85', ingredients: ['2 salmon fillets, 150 g each', '120 g dry quinoa', '1 cucumber, sliced', '100 g mixed greens', '2 tbsp olive oil', '1 lemon', 'Fresh dill, salt, and pepper'], instructions: ['Heat the oven to 200°C. Place the salmon on a lined tray, season, and drizzle with half the oil.', 'Roast for 12–15 minutes until cooked through.', 'Cook the quinoa according to the packet instructions.', 'Divide quinoa, greens, and cucumber between two bowls. Top with salmon, dill, remaining oil, and lemon juice.'] },
  { id: 'demo-pancakes', title: 'Sunday blueberry pancakes', description: 'Fluffy, golden pancakes for slow mornings. Best shared with someone you love.', category: 'Breakfast', minutes: 20, servings: 4, calories: 340, protein: 9, carbs: 52, fat: 11, favorite: false, image: 'https://images.unsplash.com/photo-1528207776546-365bb710ee93?auto=format&fit=crop&w=900&q=85', ingredients: ['200 g plain flour', '2 tsp baking powder', '2 tbsp sugar', '250 ml milk', '1 egg', '25 g melted butter', '150 g blueberries'], instructions: ['Mix flour, baking powder, and sugar in a bowl.', 'Whisk milk, egg, and melted butter together, then stir into the dry ingredients. Fold in blueberries.', 'Heat a nonstick pan over medium heat. Add small scoops of batter.', 'Cook until bubbles appear, flip, and cook until golden. Serve warm.'] },
  { id: 'demo-salad', title: 'Garden-fresh Greek salad', description: 'Crunchy vegetables, creamy feta, and a simple dressing. Freshness in every forkful.', category: 'Salads', minutes: 15, servings: 2, calories: 290, protein: 10, carbs: 16, fat: 22, favorite: true, image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=85', ingredients: ['2 tomatoes, chopped', '1 cucumber, chopped', '½ red onion, sliced', '100 g feta', '40 g olives', '2 tbsp olive oil', '1 tbsp red wine vinegar', '1 tsp dried oregano'], instructions: ['Combine tomatoes, cucumber, onion, and olives in a bowl.', 'Whisk olive oil, vinegar, and oregano together.', 'Pour over the vegetables, gently toss, and top with crumbled feta.'] },
  { id: 'demo-chicken', title: 'One-pan rosemary chicken', description: 'A comforting dinner with golden potatoes and fragrant rosemary. Less washing up, more enjoying.', category: 'Main dish', minutes: 50, servings: 4, calories: 480, protein: 36, carbs: 34, fat: 22, favorite: false, image: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=900&q=85', ingredients: ['4 chicken thighs', '600 g potatoes, chopped', '2 tbsp olive oil', '3 sprigs rosemary', '4 garlic cloves', '1 lemon, sliced', 'Salt and pepper'], instructions: ['Heat the oven to 200°C.', 'Place potatoes, garlic, rosemary, and chicken in a roasting tray.', 'Drizzle with olive oil, season, and add lemon slices.', 'Roast for 40–45 minutes, until potatoes are tender and chicken reaches 74°C at its thickest point.'] },
  { id: 'demo-dessert', title: 'Dark chocolate brownies', description: 'Rich, fudgy, and just the right amount of indulgent. Your new go-to sweet treat.', category: 'Desserts', minutes: 40, servings: 9, calories: 260, protein: 4, carbs: 30, fat: 14, favorite: false, image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=900&q=85', ingredients: ['150 g dark chocolate', '100 g butter', '150 g sugar', '2 eggs', '80 g plain flour', '20 g cocoa powder', 'A pinch of salt'], instructions: ['Heat the oven to 180°C. Line a 20 cm square baking tin.', 'Melt chocolate and butter gently. Let cool slightly.', 'Whisk in sugar and eggs. Fold in flour, cocoa, and salt.', 'Pour into the tin and bake for 22–25 minutes. Cool before cutting into 9 pieces.'] }
];
