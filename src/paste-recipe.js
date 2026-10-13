import { CATEGORIES } from './recipes.js';
const fold = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ß/g,'ss').toLowerCase().trim();
const sections = {
 ingredients:['ingredients','ingredient list','perberesit','perberes','zutaten','zutatenliste'],
 instructions:['instructions','method','directions','steps','udhezimet','udhezime','pergatitja','pergatitje','zubereitung','anleitung','zubereitungsschritte'],
 nutrition:['nutrition','nutritional information','nutrition per serving','nutrition facts','vlerat ushqyese','vlerat ushqyese per porcion','nahrwerte','nahrwerte pro portion'],
 notes:['notes','tips','shenime','keshilla','hinweise','tipps'],
};
const categories = {'main dish':'Main dish','pjate kryesore':'Main dish','hauptgericht':'Main dish','seafood':'Seafood','ushqim deti':'Seafood','fisch & meeresfruchte':'Seafood','dessert':'Desserts','desserts':'Desserts','embelsira':'Desserts','pasta':'Pasta','makarona':'Pasta','breakfast':'Breakfast','mengjes':'Breakfast','fruhstuck':'Breakfast','salads':'Salads','sallata':'Salads','salate':'Salads','soups':'Soups','supa':'Soups','suppen':'Soups'};
const clean = value => value.replace(/^\s*(?:[•*\-–]\s+|\d+[.)]\s+)/,'').trim();
function heading(line) {
 const parts=line.split(/:\s*/,2);const name=fold(parts[0].replace(/[:：]\s*$/,'').replace(/\s*\([^)]*\)\s*$/,''));
 for(const [section,names] of Object.entries(sections))if(names.includes(name))return {section,inline:parts.length>1?line.slice(line.indexOf(':')+1).trim():''};
 return null;
}
function duration(text) {
 const minutes=text.match(/(\d+)\s*(?:min(?:utes?|uten)?|minuta)/i), hours=text.match(/(\d+(?:[.,]\d+)?)\s*(?:h(?:ours?)?|ore|orë|stunden?)/i);
 if(!minutes&&!hours&&/^\d+$/.test(text.trim()))return Number(text);
 return minutes||hours ? Number(minutes?.[1]||0)+Number((hours?.[1]||'0').replace(',','.'))*60 : null;
}
export function parseCopiedRecipe(text) {
 if(typeof text!=='string'||text.length>20000)throw new Error('Paste up to 20,000 characters of recipe text.');
 const lines=text.replace(/\r\n?/g,'\n').split('\n').map(line=>line.trim().replace(/^#{1,6}\s*/,'').replace(/\*\*/g,'')).filter(Boolean);
 const fields={ingredients:[],instructions:[]},unassigned=[],intro=[];let section=null,hasTitle=false,nutritionPerServing=false,total=null,prep=null,cook=null,numberedSteps=false;
 for(const line of lines) {
  const head=heading(line);
  if(head){section=head.section;if(head.section==='nutrition')nutritionPerServing=/per serving|per porcion|pro portion/i.test(fold(line));if(!head.inline)continue;}
  const content=head?.inline||line;
  const title=content.match(/^(?:title|recipe|recipe name|titulli|receta|emri i recetes|rezept|rezeptname)\s*:\s*(.+)$/i);
  if(title){fields.title=title[1];hasTitle=true;continue;}
  const portions=fold(content).match(/^(?:servings?|portions?|porcione|porcione[t]?|portionen|fur)\s*:?\s*(\d+)(?:\s*(?:people|persons|personas|persona|personen))?\s*$/i);
  if(portions){if(Number(portions[1])>0)fields.servings=Number(portions[1]);else unassigned.push(content);continue;}
  const category=content.match(/^(?:category|kategoria|kategorie)\s*:\s*(.+)$/i);
  if(category){const value=categories[fold(category[1])];if(CATEGORIES.includes(value))fields.category=value;else unassigned.push(content);continue;}
  const timing=fold(content).match(/^(total time|time|koha totale|koha|gesamtzeit|zeit|prep time|preparation time|koha e pergatitjes|vorbereitungszeit|cook time|cooking time|koha e gatimit|kochzeit|backzeit)\s*:\s*(.+)$/);
  if(timing){const value=duration(timing[2]);if(value===null)unassigned.push(content);else if(/prep|pergatit|vorbereit/.test(timing[1]))prep=value;else if(/cook|gatimit|koch|back/.test(timing[1]))cook=value;else total=value;continue;}
  const nutrient=fold(content).match(/^(calories|kalori|kalorite|kalorien|protein|proteina|proteine|eiweiss|carbs|carbohydrates|karbohidrate|karbohidratet|kohlenhydrate|fat|yndyrna|yndyrnat|fett)\s*:\s*(\d+(?:[.,]\d+)?)/);
  if(nutrient){
   if(nutritionPerServing||/per serving|per porcion|pro portion/i.test(fold(content))){const name=nutrient[1];const key=/cal|kal/.test(name)?'calories':/protein|eiweiss/.test(name)?'protein':/carb|karbo|kohlen/.test(name)?'carbs':'fat';if((key==='calories'&&/\bkj\b/i.test(content))||(key!=='calories'&&/\b(?:mg|kg)\b|%/i.test(content)))unassigned.push(content);else fields[key]=Number(nutrient[2].replace(',','.'));}
   else unassigned.push(content);
   continue;
  }
  if(section==='nutrition'||section==='notes'){unassigned.push(content);continue;}
  if(section==='ingredients' && /^\d+[.)]\s+[A-Za-zÀ-ž]/.test(content)) {section='instructions';numberedSteps=true;fields.instructions.push(clean(content));continue;}
  if(section==='ingredients'){fields.ingredients.push(clean(content));continue;}
  if(section==='instructions'){
   const numbered=/^\d+[.)]\s+/.test(content);
   if(numbered){numberedSteps=true;fields.instructions.push(clean(content));}
   else if(numberedSteps&&fields.instructions.length)fields.instructions[fields.instructions.length-1]+=` ${content}`;
   else fields.instructions.push(clean(content));
   continue;
  }
  if(!hasTitle&&!/^\d|^[•*\-]|^https?:\/\//i.test(content)&&content.length<=150){fields.title=content;hasTitle=true;continue;}
  if(/^\d+[.)]\s+/.test(content)||/^(mix|cook|boil|whisk|bake|preheat|combine|stir|heat|shto|perziej|përziej|ziej|ngroh|piq|mische|verruhre|verrühre|koche|backe|erhitze)\b/i.test(content)){
   section='instructions';numberedSteps=/^\d+[.)]\s+/.test(content);fields.instructions.push(clean(content));continue;
  }
  if(/^(?:[•*\-]\s*)?(?:\d|[½¼¾⅓⅔⅛])/.test(content)){section='ingredients';fields.ingredients.push(clean(content));continue;}
  if(hasTitle&&!fields.ingredients.length&&!fields.instructions.length)intro.push(content);else unassigned.push(content);
 }
 if(intro.length)fields.description=intro.join('\n');
 const minutes=total??(prep!==null||cook!==null?(prep||0)+(cook||0):null);if(minutes!==null)fields.minutes=minutes;
 return {fields,unassigned,complete:!!fields.title&&fields.ingredients.length>0&&fields.instructions.length>0};
}
