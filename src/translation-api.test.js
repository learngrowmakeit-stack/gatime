import test from 'node:test';
import assert from 'node:assert/strict';
import { createTranslationHandler, validateTranslation } from '../api/translate.js';
const source={id:'recipe-1',title:'Rice',description:'Simple rice',ingredients:['200 g rice'],instructions:['Boil for 20 minutes.']};
const target={...source,title:'Oriz',description:'Oriz i thjeshtë',ingredients:['200 g oriz'],instructions:['Ziej për 20 minuta.']};
const env={GEMINI_API_KEY:'test-provider-key',VITE_SUPABASE_URL:'https://test.supabase.co',VITE_SUPABASE_PUBLISHABLE_KEY:'test-public-key'};
function response(){return {code:200,headers:{},setHeader(key,value){this.headers[key]=value;},status(code){this.code=code;return this;},json(value){this.body=value;return this;}};}
const request=(body={language:'sq',recipes:[source]})=>({method:'POST',headers:{authorization:'Bearer test-session'},body});
test('translation checks array shape, identity and numeric amounts',()=>{
 assert.deepEqual(validateTranslation([source],[target]),[target]);
 for(const value of [{...target,ingredients:['300 g oriz']},{...target,instructions:[]},{...target,id:'wrong'}])assert.throws(()=>validateTranslation([source],[value]));
});
test('missing provider configuration has a safe error with no leaked values',async()=>{
 const handler=createTranslationHandler({env:{},fetchImpl:()=>{throw new Error('Must not fetch');}}),res=response();await handler(request(),res);assert.equal(res.code,503);assert.deepEqual(res.body,{error:'NOT_CONFIGURED'});assert.equal(res.headers['Cache-Control'],'private, no-store');
});
test('unauthenticated requests never reach the translation provider',async()=>{
 let calls=0;const handler=createTranslationHandler({env,fetchImpl:async()=>{calls++;return new Response('{}',{status:401});}}),res=response();await handler(request(),res);assert.equal(res.code,401);assert.equal(calls,1);
});
test('valid requests verify the user and return only translated recipe fields',async()=>{
 const calls=[];const handler=createTranslationHandler({env,fetchImpl:async(url,options)=>{calls.push({url,options});return new Response(JSON.stringify(calls.length===1?{id:'user-1'}:{candidates:[{content:{parts:[{text:JSON.stringify({recipes:[target]})}]}}]}));}}),res=response();await handler(request(),res);assert.equal(res.code,200);assert.deepEqual(res.body,{recipes:[target]});assert.equal(calls[1].options.headers['x-goog-api-key'],env.GEMINI_API_KEY);assert.ok(!calls[1].url.includes(env.GEMINI_API_KEY));assert.ok(!JSON.stringify(res.body).includes(env.GEMINI_API_KEY));
});
test('invalid, oversized and numeric-changing responses preserve the original',async()=>{
 const handler=createTranslationHandler({env,fetchImpl:async(url)=>new Response(JSON.stringify(url.includes('/auth/')?{id:'user-1'}:{candidates:[{content:{parts:[{text:JSON.stringify({recipes:[{...target,ingredients:['400 g oriz']}]})}]}}]}))}),res=response();await handler(request(),res);assert.equal(res.code,502);assert.equal(res.body.error,'INVALID_TRANSLATION');
 for(const language of ['fr','__proto__','constructor']){const invalid=response();await handler(request({language,recipes:[source]}),invalid);assert.equal(invalid.code,400);}
 const large=response();await handler(request({language:'sq',recipes:[{...source,description:'x'.repeat(15000)}]}),large);assert.equal(large.code,400);
});
