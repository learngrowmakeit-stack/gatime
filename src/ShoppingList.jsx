import { useLanguage } from './Language';
import React, { useState } from 'react';
import { ShoppingBasket, Copy, Download, X, RotateCcw, BookOpen } from 'lucide-react';
import { buildShoppingList, shoppingText } from './shopping';
export default function ShoppingList({
  recipes,
  shopping,
  onBrowse,
  onNotice
}) {
  const {
    t
  } = useLanguage();
  const [copyHelp, setCopyHelp] = useState(false);
  const rows = buildShoppingList(recipes);
  const bought = rows.filter(row => shopping.checked.includes(row.checkKey)).length;
  const text = shoppingText(recipes, rows, shopping.checked, t);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopyHelp(false);
      onNotice('Shopping list copied. Paste it into a message or your notes.');
    } catch {
      setCopyHelp(true);
    }
  }
  function download() {
    const url = URL.createObjectURL(new Blob([text], {
      type: 'text/plain;charset=utf-8'
    }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'gatime-shopping-list.txt';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <section className="shopping-page" aria-label={t("Shopping list")}>
    {shopping.error && <p className="storage-error" role="alert">{t(shopping.error)}</p>}
    {!recipes.length ? <div className="empty-state shopping-empty"><ShoppingBasket size={42} /><h3>{t("Your shopping list starts with a recipe.")}</h3><p>{t("Select the shopping checkbox on any recipe. Its ingredients will appear here.")}</p><button className="primary-button" onClick={onBrowse}><BookOpen size={16} />{t("Choose recipes")}</button></div> : <>
      <div className="shopping-summary"><div><p className="eyebrow">{t("A LITTLE PLANNING. A DELICIOUS WEEK.")}</p><h2>{t(rows.length === 1 ? '{count} ingredient, one easy list.' : '{count} ingredients, one easy list.', {count: rows.length})}</h2><p>{t(recipes.length === 1 ? 'For the full recipe quantities · {count} selected recipe' : 'For the full recipe quantities · {count} selected recipes', {count: recipes.length})}</p></div><ShoppingBasket size={45} /></div>
      <div className="shopping-recipes">{recipes.map(recipe => <span key={recipe.id}>{recipe.title}<button aria-label={t("Remove {p0} from shopping list", {
            p0: recipe.title
          })} onClick={() => shopping.toggleRecipe(recipe.id)}><X size={14} /></button></span>)}</div>
      <div className="shopping-toolbar"><span>{bought}{" " + t("of") + " "}{rows.length}{" " + t("bought")}</span><div><button className="secondary-button" onClick={copy}><Copy size={15} />{t("Copy list")}</button><button className="secondary-button" onClick={download}><Download size={15} />{t("Download")}</button></div></div>
      {copyHelp && <label className="shopping-copy-help">{t("Copy this text into your notes or a message:")}<textarea readOnly value={text} rows={8} onFocus={event => event.target.select()} autoFocus /></label>}
      <div className="shopping-items">{rows.map(row => <label className={`shopping-item ${shopping.checked.includes(row.checkKey) ? 'bought' : ''}`} key={row.key}><input type="checkbox" checked={shopping.checked.includes(row.checkKey)} onChange={() => shopping.toggleItem(row.checkKey)} /><div><strong>{row.label}</strong><small>{row.recipes.map(recipe => recipe.title).join(' · ')}</small></div></label>)}</div>
      <p className="shopping-note">{t("Matching ingredients with the same units are added together. Different descriptions stay separate so you can check them before shopping. This list is saved on this device and works offline.")}</p>
      <div className="shopping-bottom"><button className="secondary-button" onClick={shopping.uncheck} disabled={!bought}><RotateCcw size={14} />{t("Uncheck all")}</button><button className="delete-button" onClick={shopping.clear}>{t("Clear shopping list")}</button></div>
    </>}
  </section>;
}
