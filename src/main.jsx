import { LanguageProvider, LanguageSelect, useLanguage } from './Language';
import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BookOpen, Heart, Search, Plus, Clock, ArrowUpRight, X, Utensils, Leaf, Flame, ChevronRight, Download, Upload, Pencil, Trash2, ChefHat, Menu, Check, ShoppingBasket } from 'lucide-react';
import { CATEGORIES, validateRecipe, normalizeRecipe, parseRecipes } from './recipes';
import './styles.css';
import InstallApp from './InstallApp';
import useRecipes from './useRecipes';
import AccountPanel from './AccountPanel';
import useShopping from './useShopping';
import ShoppingList from './ShoppingList';
import MealPlan from './MealPlan';
import PhotoPicker from './PhotoPicker';
import RecipePaste from './RecipePaste';
import useTranslatedRecipes from './useTranslatedRecipes';
import { scaleRecipe, targetServings } from './servings';
import ServingControl from './ServingControl';
const blankRecipe = () => ({
  title: '',
  description: '',
  category: 'Main dish',
  minutes: '',
  servings: 2,
  calories: '',
  protein: '',
  carbs: '',
  fat: '',
  ingredients: [],
  instructions: [],
  image: '',
  favorite: false
});
const artwork = {
  'Pasta': 'pasta',
  'Seafood': 'salmon',
  'Breakfast': 'pancakes',
  'Salads': 'salad',
  'Main dish': 'chicken',
  'Desserts': 'brownies',
  'Soups': 'salad'
};
function fallbackImage(e, category = 'Salads') {
  const img = e.currentTarget;
  img.onerror = null;
  img.src = `/illustrations/${artwork[category] || 'salad'}.svg`;
}
const nutritionLabels = {
  calories: 'Calories',
  protein: 'Protein',
  carbs: 'Carbs',
  fat: 'Fat'
};
function App() {
  const {
    t
  } = useLanguage();
  const account = useRecipes();
  const {
    recipes,
    persist,
    storageError
  } = account;
  const recipeTranslation = useTranslatedRecipes(recipes, account.user);
  const [view, setView] = useState('all');
  const [category, setCategory] = useState('All recipes');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('recent');
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null);
  const [notice, setNotice] = useState('');
  const shopping = useShopping(account.user?.id, setNotice);
  const shoppingRecipes = recipes.filter(recipe => shopping.selected.includes(recipe.id)).map(recipeTranslation.translated).map(recipe => scaleRecipe(recipe, targetServings(recipe, shopping.servings)));
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteVersion, setDeleteVersion] = useState(0);
  const recipesRef = useRef(recipes);
  recipesRef.current = recipes;
  const importRef = useRef();
  useEffect(() => {
    setSelected(null);
    setEditing(null);
    setDeleteId(null);
  }, [account.user?.id]);
  function openEditor(recipe) {
    setEditing({
      ...recipe,
      _baseVersion: recipe.id ? account.revision(recipe.id) : 0
    });
  }
  const active = recipes.find(r => r.id === selected);
  const activeCount = active ? targetServings(active, shopping.servings) : 0;
  const displayActive = active ? scaleRecipe(recipeTranslation.translated(active), activeCount) : null;
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(''), 5000);
    return () => clearTimeout(timer);
  }, [notice]);
  const visible = recipes.map(recipeTranslation.translated).filter(r => (view !== 'favorites' || r.favorite) && (category === 'All recipes' || r.category === category) && `${r.title} ${r.description} ${r.ingredients.join(' ')}`.toLowerCase().includes(query.toLowerCase())).sort((a, b) => sort === 'az' ? a.title.localeCompare(b.title) : sort === 'quick' ? (a.minutes ?? Infinity) - (b.minutes ?? Infinity) : 0);
  const favoriteCount = recipes.filter(r => r.favorite).length;
  function navigate(nextView) {
    setView(nextView);
    setCategory('All recipes');
    setSidebarOpen(false);
  }
  function toggleFavorite(recipe) {
    persist(recipes.map(r => r.id === recipe.id ? {
      ...r,
      favorite: !r.favorite
    } : r));
  }
  async function saveRecipe(value) {
    const {
      _baseVersion,
      ...data
    } = value;
    const recipe = normalizeRecipe({
      ...data,
      id: value.id || crypto.randomUUID()
    });
    const next = recipes.some(r => r.id === recipe.id) ? recipes.map(r => r.id === recipe.id ? recipe : r) : [recipe, ...recipes];
    if (await persist(next, {
      [recipe.id]: _baseVersion
    })) {
      setEditing(null);
      setSelected(recipe.id);
      setNotice(account.user ? 'Recipe saved. It will sync when online.' : 'Recipe saved to your collection.');
    }
  }
  function exportRecipes() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(recipes, null, 2)], {
      type: 'application/json'
    }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'gatime-recipes.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice('Your recipe backup has been downloaded.');
  }
  async function importRecipes(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setNotice('Please choose a backup smaller than 5 MB.');
      return;
    }
    try {
      const incoming = parseRecipes(await file.text()).map(r => ({
        ...r,
        id: crypto.randomUUID()
      }));
      if (await persist([...incoming, ...recipesRef.current])) setNotice(`Imported ${incoming.length} recipes. Your existing recipes were kept.`);
    } catch (error) {
      setNotice(`Could not import: ${error.message}`);
    }
  }
  return <div className="app-shell">
    {sidebarOpen && <button className="sidebar-scrim" aria-label={t("Close navigation")} onClick={() => setSidebarOpen(false)} />}
    <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
      <a href="#" className="brand" onClick={e => {
        e.preventDefault();
        navigate('all');
      }}><span className="brand-mark"><Utensils size={22} /></span>gatime<span className="brand-dot">.</span></a>
      <p className="sidebar-caption">{t("YOUR PERSONAL RECIPE BOOK")}</p>
      <nav aria-label={t("Main navigation")}><button className={`nav-item ${view === 'all' ? 'active' : ''}`} onClick={() => navigate('all')}><BookOpen size={19} />{t("My recipes")}<span className="nav-count">{recipes.length}</span></button><button className={`nav-item ${view === 'favorites' ? 'active' : ''}`} onClick={() => navigate('favorites')}><Heart size={19} />{t("Favorites")}<span className="nav-count">{favoriteCount}</span></button><button className={`nav-item ${view === 'shopping' ? 'active' : ''}`} onClick={() => navigate('shopping')}><ShoppingBasket size={19} />{t("Shopping list")}<span className="nav-count">{shoppingRecipes.length}</span></button><button className={`nav-item ${view === 'plan' ? 'active' : ''}`} onClick={() => navigate('plan')}><Utensils size={19}/>{t('Weekly meal plan')}</button></nav>
      <div className="nav-divider" /><p className="section-label">{t("CATEGORIES")}</p>
      <nav className="category-nav" aria-label={t("Recipe categories")}>{CATEGORIES.map((c, i) => <button key={c} className={`category-link ${category === c ? 'selected' : ''}`} onClick={() => {
          setCategory(c);
          setView('all');
          setSidebarOpen(false);
        }}><span className={`category-dot dot-${i}`} />{t(c)}<span>{recipes.filter(r => r.category === c).length}</span></button>)}</nav>
      <div className="sidebar-bottom"><InstallApp /><div className="little-note"><Leaf size={22} /><strong>{t("A little inspiration,")}<br />{t("a lot of good food.")}</strong><p>{t("Your favorite flavors,")}<br />{t("all in one place.")}</p></div><div className="backup-tools"><button onClick={exportRecipes}><Download size={14} />{t("Export")}</button><button onClick={() => importRef.current.click()}><Upload size={14} />{t("Import")}</button></div><input ref={importRef} type="file" accept="application/json,.json" hidden onChange={importRecipes} /><AccountPanel account={account} onAccountChange={() => {
          setSelected(null);
          setEditing(null);
          setDeleteId(null);
        }} onNotice={setNotice} /></div>
    </aside>
    <main>
      <header className="topbar"><div className="breadcrumb"><button className="mobile-menu icon-button" aria-label={t("Open navigation")} onClick={() => setSidebarOpen(true)}><Menu size={22} /></button><span>{t("My kitchen")}</span><ChevronRight size={14} /><strong>{view === 'plan' ? t('Weekly meal plan') : view === 'shopping' ? t("Shopping list") : view === 'favorites' ? t("Favorites") : t("Recipe collection")}</strong></div><div className="topbar-actions"><LanguageSelect/><button className="topbar-shopping" onClick={() => navigate('shopping')}><ShoppingBasket size={17} /><span>{t("Shopping list")}</span><b>{shoppingRecipes.length}</b></button></div></header>
      <div className="main-content">
        <section className="page-heading"><div><p className="eyebrow">{t("GOOD FOOD. GREAT MEMORIES.")}</p><h1>{view === 'plan' ? t('Weekly meal plan') : view === 'shopping' ? t("Your shopping list") : view === 'favorites' ? t("Your favorite flavors") : t("Your recipe collection")}<span>.</span></h1><p>{view === 'shopping' ? t("All the ingredients you need, gathered from your selected recipes.") : t("A home for the recipes you love, and the ones you\u2019re about to.")}</p></div><button className="primary-button" onClick={() => view === 'shopping' ? navigate('all') : openEditor(blankRecipe())}>{view === 'shopping' ? <><Plus size={18} />{t("Choose recipes")}</> : <><Plus size={18} />{t("Add recipe")}</>}</button></section>
        <section className="translation-controls" aria-label={t('Recipe content language')}><label><input type="checkbox" checked={recipeTranslation.enabled} onChange={event => recipeTranslation.setEnabled(event.target.checked)}/>{t('Translate recipe content into the selected language')}</label>{recipeTranslation.status === 'loading' && <span role="status">{t('Translating recipes…')}</span>}{recipeTranslation.error && <div role="status"><span>{t(recipeTranslation.error)}</span><button onClick={recipeTranslation.retry}>{t('Try again')}</button></div>}</section>
        {storageError && <div className="storage-error" role="alert">{t(storageError)}</div>}
        {view === 'plan' ? <MealPlan recipes={recipes.map(recipeTranslation.translated)} userId={account.user?.id} onNotice={setNotice} onShopping={totals => {if(shopping.fromPlan(totals))navigate('shopping');}}/> : view === 'shopping' ? <ShoppingList recipes={shoppingRecipes} shopping={shopping} onBrowse={() => navigate('all')} onNotice={setNotice} /> : <>
        <section className="hero"><div className="hero-copy"><span className="hero-tag"><Leaf size={14} />{t("MADE FOR YOUR EVERYDAY")}</span><h2>{t("A pinch of inspiration.")}<br />{t("A plate full of possibility.")}</h2><p>{t("Keep your favorites close. Discover the joy of")}<br className="desktop-break" />{" " + t("cooking something worth remembering.")}</p><button onClick={() => openEditor(blankRecipe())}>{t("Add your own recipe")}<ArrowUpRight size={17} /></button></div><img src="https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=85" alt={t("Fresh colorful vegetables ready to enjoy")} onError={e => fallbackImage(e)} /><div className="hero-image-fade" /><div className="hero-badge"><span><BookOpen size={17} /></span><div><strong>{t("A collection that\u2019s yours")}</strong><small>{t("One delicious recipe at a time")}</small></div></div></section>
        <section className="collection" aria-label={t("Recipe collection")}><div className="collection-title"><h2>{category !== 'All recipes' ? t(category) : view === 'favorites' ? t("Favorite recipes") : t("All recipes")} <span>{visible.length}</span></h2><div className="search-sort"><label className="search-box"><Search size={17} /><input placeholder={t("Search your recipes\u2026")} aria-label={t("Search recipes")} value={query} onChange={e => setQuery(e.target.value)} />{query && <button className="icon-button" aria-label={t("Clear search")} onClick={() => setQuery('')}><X size={14} /></button>}</label><select aria-label={t("Sort recipes")} value={sort} onChange={e => setSort(e.target.value)}><option value="recent">{t("Recently added")}</option><option value="az">{t("Name: A\u2013Z")}</option><option value="quick">{t("Quickest first")}</option></select></div></div>
          <div className="filter-tabs" aria-label={t("Filter by category")}>{['All recipes', ...CATEGORIES].map(c => <button key={c} className={category === c ? 'active' : ''} onClick={() => setCategory(c)}>{t(c)}</button>)}</div>
<p className="selection-hint"><ShoppingBasket size={15} />{t("Select recipes below to build a shared shopping list.")}{shoppingRecipes.length > 0 && <button onClick={() => navigate('shopping')}>{t("View list (")}{shoppingRecipes.length})<ArrowUpRight size={14} /></button>}</p>
          <div className="recipe-grid">{visible.map(recipe => <article className="recipe-card" key={recipe.id}><div className="card-image"><button className="image-link" onClick={() => setSelected(recipe.id)} aria-label={t("Open {p0}", {
                    p0: recipe.title
                  })}>{recipe.image ? <img src={recipe.image} alt={recipe.title} loading="lazy" onError={e => fallbackImage(e, recipe.category)} /> : <div className="image-placeholder"><ChefHat size={46} /><span>{t("Made in your kitchen")}</span></div>}</button><span className="card-category">{t(recipe.category)}</span><button className={`favorite-button ${recipe.favorite ? 'is-favorite' : ''}`} aria-label={t(recipe.favorite ? 'Remove {name} from favorites' : 'Add {name} to favorites', {name: recipe.title})} aria-pressed={recipe.favorite} onClick={() => toggleFavorite(recipe)}><Heart size={18} fill={recipe.favorite ? 'currentColor' : 'none'} /></button></div><div className="card-body"><button className="card-title" onClick={() => setSelected(recipe.id)}>{recipe.title}</button><p>{recipe.description || t("A recipe from your personal kitchen.")}</p><div className="card-footer"><span><Clock size={14} />{recipe.minutes == null ? t("Time not set") : t("{p0} min", {
                        p0: recipe.minutes
                      })}</span><span><Flame size={14} />{recipe.calories == null ? t("Calories not set") : `${recipe.calories} kcal`}</span><button aria-label={t("View {p0}", {
                      p0: recipe.title
                    })} onClick={() => setSelected(recipe.id)}><ArrowUpRight size={17} /></button></div><label className="recipe-shopping-select"><input type="checkbox" checked={shopping.selected.includes(recipe.id)} onChange={() => shopping.toggleRecipe(recipe.id)} aria-label={t("Select {p0} for shopping list", {
                      p0: recipe.title
                    })} /><span>{shopping.selected.includes(recipe.id) ? t("In your shopping list") : t("Add to shopping list")}</span><ShoppingBasket size={14} /></label></div></article>)}</div>
          {!visible.length && <div className="empty-state"><BookOpen size={36} /><h3>{query ? t("No recipes found") : view === 'favorites' ? t("Keep your favorites close") : t("Your next favorite starts here")}</h3><p>{query ? t("Try a different name or ingredient, or choose another category.") : view === 'favorites' ? t("Tap the heart on a recipe to save it here.") : t("Add a recipe with the ingredients and flavors you love.")}</p>{!query && view !== 'favorites' && <button className="primary-button" onClick={() => openEditor({
                ...blankRecipe(),
                category: category === 'All recipes' ? 'Main dish' : category
              })}><Plus size={16} />{t("Add recipe")}</button>}</div>}
        </section></>}<footer className="page-footer"><span><Leaf size={14} />{t("Made for the love of food.")}</span><span>{t("Sample recipes included \xB7 Sample nutrition is approximate")}</span></footer>
      </div>
    </main>
    {active && !editing && <Modal title={displayActive.title} onClose={() => setSelected(null)}><div className="recipe-detail">{active.image && <img className="detail-image" src={active.image} alt={displayActive.title} onError={e => fallbackImage(e, active.category)} />}<div className="detail-heading"><span className="detail-category">{t(active.category)}</span><button className="icon-button" aria-label={t("Toggle favorite")} onClick={() => toggleFavorite(active)}><Heart size={21} fill={active.favorite ? 'currentColor' : 'none'} /></button></div><h2>{displayActive.title}</h2><p className="description">{displayActive.description}</p><div className="detail-meta"><span><Clock size={16} />{active.minutes == null ? t("Time not set") : t("{p0} minutes", {
              p0: active.minutes
            })}</span><span><Utensils size={16} />{t(active.servings === 1 ? '{count} serving' : '{count} servings', {count: active.servings})}</span></div><section className="portion-panel"><ServingControl value={activeCount} onChange={count => shopping.setServings(active.id, count)}/><p>{t('Original recipe: {count} portions. Your recipe stays unchanged.', {count: active.servings})}</p><small>{t('Ingredient amounts are adjusted. Review items without clear amounts and quantities mentioned in the instructions. Cooking times and nutrition per serving stay unchanged.')}</small></section><section className="nutrition-panel"><h3>{t("Nutrition") + " "}<span>{t("per serving")}</span></h3><div className="nutrition-grid">{Object.entries(nutritionLabels).map(([key, label]) => <div key={key}><strong>{active[key] ?? '—'}<small>{active[key] == null ? '' : key === 'calories' ? ' kcal' : ' g'}</small></strong><span>{t(label)}</span></div>)}</div><p>{active.id.startsWith('demo-') ? t("Approximate sample values, provided for inspiration.") : t("Values entered by you. Nutrition is not calculated automatically.")}</p></section><div className="recipe-columns"><section><h3>{t("Ingredients")}</h3>{displayActive.ingredients.map((line, i) => <label className="ingredient" key={`${active.id}-${i}`}><input type="checkbox" /><span>{line}</span></label>)}</section><section><h3>{t("Instructions")}</h3><ol className="instructions">{displayActive.instructions.map((line, i) => <li key={i}><span>{i + 1}</span><p>{line}</p></li>)}</ol></section></div><div className="detail-actions"><button className="secondary-button" onClick={() => openEditor(active)}><Pencil size={16} />{t("Edit recipe")}</button><button className="delete-button" onClick={() => {
            setDeleteId(active.id);
            setDeleteVersion(account.revision(active.id));
          }}><Trash2 size={16} />{t("Delete recipe")}</button></div></div></Modal>}
    {editing && <RecipeForm recipe={editing} onClose={() => setEditing(null)} onSave={saveRecipe} />}
    {deleteId && <Modal title={t("Delete recipe?")} onClose={() => setDeleteId(null)} compact><h2>{t("Delete this recipe?")}</h2><p>{account.user ? t("This deletes the recipe from your account and all synced devices when online.") : t("This removes the recipe from this device.")}{" " + t("Export a backup first if you want to keep a copy.")}</p><div className="confirm-actions"><button className="secondary-button" onClick={() => setDeleteId(null)}>{t("Keep recipe")}</button><button className="danger-button" onClick={async () => {
          if (await persist(recipes.filter(r => r.id !== deleteId), {
            [deleteId]: deleteVersion
          })) {
            setSelected(null);
            setDeleteId(null);
            setNotice('Recipe deleted.');
          }
        }}>{t("Delete recipe")}</button></div></Modal>}
    {notice && <div className="toast" role="status"><Check size={17} />{t(notice)}<button className="icon-button" onClick={() => setNotice('')} aria-label={t("Dismiss message")}><X size={15} /></button></div>}
  </div>;
}
function Modal({
  title,
  onClose,
  children,
  compact = false
}) {
  const {
    t
  } = useLanguage();
  const ref = useRef();
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const previous = document.activeElement;
    const priorOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    ref.current.focus();
    const key = e => {
      if (e.key === 'Escape') closeRef.current();
      if (e.key === 'Tab') {
        const items = [...ref.current.querySelectorAll('button, input, select, textarea, a[href]')].filter(el => !el.disabled);
        const first = items[0],
          last = items.at(-1);
        if (e.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener('keydown', key);
    return () => {
      document.body.style.overflow = priorOverflow;
      document.removeEventListener('keydown', key);
      previous?.focus();
    };
  }, []);
  return <div className="modal-overlay" onMouseDown={e => {
    if (e.target === e.currentTarget) onClose();
  }}><div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title} className={`modal ${compact ? 'compact' : ''}`}><button className="modal-close icon-button" aria-label={t("Close dialog")} onClick={onClose}><X size={22} /></button>{children}</div></div>;
}
function RecipeForm({
  recipe,
  onSave,
  onClose
}) {
  const {
    t
  } = useLanguage();
  const [draft, setDraft] = useState({
    ...recipe,
    minutes: recipe.minutes ?? '',
    ...Object.fromEntries(['calories', 'protein', 'carbs', 'fat'].map(k => [k, recipe[k] ?? '']))
  });
  const [ingredients, setIngredients] = useState(recipe.ingredients.join('\n'));
  const [instructions, setInstructions] = useState(recipe.instructions.join('\n'));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const update = e => setDraft({
    ...draft,
    [e.target.name]: e.target.value
  });
  async function submit(e) {
    e.preventDefault();
    if (saving || photoBusy) return;
    const value = {
      ...draft,
      ingredients: ingredients.split('\n'),
      instructions: instructions.split('\n')
    };
    const message = validateRecipe(value);
    if (message) {
      setError(message);
      return;
    }
    setSaving(true);
    try {
      await onSave(value);
    } finally {
      setSaving(false);
    }
  }
  return <Modal title={recipe.id ? t("Edit recipe") : t("Add recipe")} onClose={onClose}><form onSubmit={submit} className="recipe-form"><p className="eyebrow">{t("FROM YOUR KITCHEN")}</p><h2>{recipe.id ? t("Edit your recipe") : t("Something delicious starts here.")}</h2><p className="form-intro">{t("The ingredients, the little details, and all the steps to make it again.")}</p>{recipe.id && <p className="form-intro">{t("You are editing the original recipe. Translations do not replace it.")}</p>}<RecipePaste hasContent={!!(draft.title || ingredients || instructions)} onApply={fields => { const { ingredients: parsedIngredients, instructions: parsedInstructions, ...rest } = fields; setDraft(current => ({...current, ...rest})); if (parsedIngredients.length) setIngredients(parsedIngredients.join('\n')); if (parsedInstructions.length) setInstructions(parsedInstructions.join('\n')); }}/><PhotoPicker value={draft.image} onChange={image => setDraft(current => ({
        ...current,
        image
      }))} onBusy={setPhotoBusy} /><label>{t("Recipe name") + " "}<span>*</span><input name="title" value={draft.title} onChange={update} required maxLength={150} placeholder={t("e.g. Grandma\u2019s Sunday pasta")} autoFocus /></label><label>{t("A little about this recipe")}<textarea name="description" value={draft.description} onChange={update} rows={2} maxLength={1000} placeholder={t("What makes this one special?")} /></label><div className="form-row"><label>{t("Category")}<select aria-label={t("Category")} name="category" value={draft.category} onChange={update}>{CATEGORIES.map(c => <option key={c} value={c}>{t(c)}</option>)}</select></label><label>{t("Time (minutes)")}<input type="number" min="0" name="minutes" value={draft.minutes} onChange={update} placeholder="30" /></label><label>{t("Servings") + " "}<span>*</span><input type="number" min="1" step="1" required name="servings" value={draft.servings} onChange={update} /></label></div><label>{t("Ingredients") + " "}<span>*</span><small>{t("One ingredient per line, including the amount.")}</small><textarea value={ingredients} onChange={e => setIngredients(e.target.value)} rows={5} required placeholder={t("200 g pasta\n2 tbsp olive oil\n1 lemon")} /></label><label>{t("Instructions") + " "}<span>*</span><small>{t("One step per line.")}</small><textarea value={instructions} onChange={e => setInstructions(e.target.value)} rows={5} required placeholder={t("Bring a pot of salted water to a boil.\nCook the pasta until tender.")} /></label><div className="form-nutrition"><h3>{t("Nutrition per serving")}</h3><p>{t("Optional. Enter values from your ingredients\u2019 labels or a nutrition calculator. The app does not calculate them automatically.")}</p><div className="nutrition-inputs">{Object.entries(nutritionLabels).map(([key, label]) => <label key={key}>{t(label)} ({key === 'calories' ? 'kcal' : 'g'})<input type="number" min="0" step="any" name={key} value={draft[key]} onChange={update} placeholder="—" /></label>)}</div></div>{error && <p className="form-error" role="alert">{t(error)}</p>}<div className="form-actions"><button type="button" className="secondary-button" onClick={onClose}>{t("Cancel")}</button><button className="primary-button" type="submit" disabled={saving || photoBusy}><Check size={17} />{saving ? t("Saving\u2026") : t("Save recipe")}</button></div></form></Modal>;
}
createRoot(document.getElementById('root')).render(<LanguageProvider><App /></LanguageProvider>);
