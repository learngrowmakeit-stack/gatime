import test from 'node:test';
import assert from 'node:assert/strict';
import { RecipeSync, accountStorageKey, readAccount } from './sync-core.js';
import { DEMO_RECIPES } from './recipes.js';
const sample = {...DEMO_RECIPES[0], id:'test-recipe', title:'My recipe'};
function storage() { const values = new Map(); return {getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)}; }
function server() {
  const accounts=new Map(), acknowledgements=new Map();
  return user => {
    if(!accounts.has(user)) accounts.set(user,new Map()); const rows=accounts.get(user);
    return {
      async list(){return structuredClone([...rows.values()]);},
      async save(op){
        const key=`${user}:${op.mutationId}`;
        if(acknowledgements.has(key)) return structuredClone(acknowledgements.get(key));
        const before=rows.get(op.id);
        if((before?.version??0)!==op.baseVersion) return {status:'conflict',row:structuredClone(before)};
        const row={recipe_id:op.id,data:op.data,version:(before?.version??0)+1,deleted:op.data===null};
        rows.set(op.id,structuredClone(row));const response={status:'applied',row};acknowledgements.set(key,structuredClone(response));return response;
      }
    };
  };
}
let sequence=0;
const create=(userId,local,api,other={})=>new RecipeSync({userId,storage:local,api,uuid:()=>`mutation-${++sequence}`, ...other});
test('offline additions survive restart and appear on another device after sync',async()=>{
  const backend=server(),local=storage();let online=false;
  const first=create('alice',local,backend('alice'),{online:()=>online});await first.commit([sample]);await first.flush();assert.equal(first.snapshot().status,'offline');
  const restarted=create('alice',local,backend('alice'));await restarted.flush();assert.equal(restarted.snapshot().pending,0);
  const phone=create('alice',storage(),backend('alice'));await phone.flush();assert.equal(phone.snapshot().recipes[0].title,'My recipe');
});
test('sync writes only changed recipes and never removes another device’s addition',async()=>{
  const backend=server();const a=create('alice',storage(),backend('alice')),b=create('alice',storage(),backend('alice'));
  await a.commit([sample]);await a.flush();await b.flush();
  await a.commit([...a.snapshot().recipes,{...sample,id:'new-on-a'}]);await a.flush();
  await b.commit([{...sample,title:'Edited on B'}]);await b.flush();
  assert.equal(b.snapshot().recipes.length,2);await a.flush();assert.equal(a.snapshot().recipes.find(r=>r.id===sample.id).title,'Edited on B');
});
test('simultaneous edits keep the local draft and ask for a conflict choice',async()=>{
  const backend=server(),a=create('alice',storage(),backend('alice')),b=create('alice',storage(),backend('alice'));
  await a.commit([sample]);await a.flush();await b.flush();
  await a.commit([{...sample,title:'A edit'}]);await b.commit([{...sample,title:'B edit'}]);await a.flush();await b.flush();
  assert.equal(b.snapshot().status,'conflict');assert.equal(b.snapshot().recipes[0].title,'B edit');
  await b.resolve(sample.id,'cloud');assert.equal(b.snapshot().recipes[0].title,'A edit');
  await a.commit([{...sample,title:'A again'}]);await b.commit([{...sample,title:'B again'}]);await a.flush();await b.flush();await b.resolve(sample.id,'device');await b.flush();await a.flush();assert.equal(a.snapshot().recipes[0].title,'B again');
});
test('remote deletes do not silently resurrect from an offline edit',async()=>{
  const backend=server(),a=create('alice',storage(),backend('alice')),b=create('alice',storage(),backend('alice'));
  await a.commit([sample]);await a.flush();await b.flush();await a.commit([]);await a.flush();
  await b.commit([{...sample,title:'Offline edit'}]);await b.flush();assert.equal(b.snapshot().conflicts[0].conflict.deleted,true);
  await b.resolve(sample.id,'cloud');assert.equal(b.snapshot().recipes.length,0);
});
test('account caches are isolated and sign-out does not discard pending edits',async()=>{
  const local=storage(),backend=server();const alice=create('alice',local,backend('alice'));await alice.commit([sample]);alice.stop();
  const bob=create('bob',local,backend('bob'));assert.equal(bob.snapshot().recipes.length,0);
  const resumed=create('alice',local,backend('alice'));assert.equal(resumed.snapshot().pending,1);assert.equal(resumed.snapshot().recipes[0].id,sample.id);
});
test('retry after a lost acknowledgement applies an edit only once',async()=>{
  const backend=server()('alice');let fail=true;
  const client=create('alice',storage(),{list:backend.list,save:async op=>{const value=await backend.save(op);if(fail){fail=false;throw new Error('Lost response');}return value;}});
  await client.commit([sample]);await client.flush();assert.equal(client.snapshot().pending,1);await client.flush();assert.equal(client.snapshot().pending,0);assert.equal(client.revision(sample.id),1);
});
test('an edit queued during a request is kept and uses the acknowledged version',async()=>{
  const backend=server()('alice');let release,started;const wait=new Promise(r=>release=r),entered=new Promise(r=>started=r);
  const client=create('alice',storage(),{list:backend.list,save:async op=>{started();await wait;return backend.save(op);}});
  await client.commit([sample]);const running=client.flush();await entered;await client.commit([{...sample,title:'Newer edit'}]);release();await running;
  assert.equal(client.snapshot().pending,1);assert.equal(client.snapshot().recipes[0].title,'Newer edit');await client.flush();assert.equal(client.snapshot().pending,0);assert.equal(client.revision(sample.id),2);
});
test('a form opened at an older revision cannot silently overwrite a newer remote edit',async()=>{
  const backend=server(),a=create('alice',storage(),backend('alice')),b=create('alice',storage(),backend('alice'));
  await a.commit([sample]);await a.flush();await b.flush();const formVersion=b.revision(sample.id);
  await a.commit([{...sample,title:'New remote edit'}]);await a.flush();await b.flush();
  await b.commit([{...sample,title:'Old form edit'}],{[sample.id]:formVersion});await b.flush();assert.equal(b.snapshot().status,'conflict');
});
test('migration is explicit, retains existing cloud recipes, and does not duplicate imports',async()=>{
  const backend=server(),client=create('alice',storage(),backend('alice'));assert.equal(client.snapshot().recipes.length,0);
  assert.equal(await client.addDeviceRecipes([sample]),1);await client.flush();assert.equal(await client.addDeviceRecipes([sample]),0);assert.equal(client.snapshot().recipes.length,1);
});
test('storage failures preserve the last safe state and invalid caches are not overwritten',async()=>{
  const local=storage(),client=create('alice',local,server()('alice'));await client.commit([sample]);const before=client.snapshot();local.setItem=()=>{throw new Error('Full');};
  await assert.rejects(()=>client.commit([]));assert.deepEqual(client.snapshot(),before);
  const bad=storage();bad.setItem(accountStorageKey('alice'),'{bad');assert.throws(()=>readAccount(bad,'alice'));assert.equal(bad.getItem(accountStorageKey('alice')),'{bad');
});
test('stopping during an in-flight request prevents old account updates',async()=>{
  const backend=server()('alice');let release,started;const wait=new Promise(r=>release=r),entered=new Promise(r=>started=r);let emits=0;
  const client=create('alice',storage(),{list:backend.list,save:async op=>{started();await wait;return backend.save(op);}},{onChange:()=>emits++});await client.commit([sample]);const running=client.flush();await entered;client.stop();const before=emits;release();await running;assert.equal(emits,before);assert.equal(client.snapshot().pending,1);
});
test('two browser windows preserve distinct pending changes with a shared storage lock',async()=>{
  const backend=server(),local=storage();let chain=Promise.resolve();
  const exclusive=fn=>{const operation=chain.then(fn);chain=operation.catch(()=>{});return operation;};
  const a=create('alice',local,backend('alice'),{exclusive}),b=create('alice',local,backend('alice'),{exclusive});
  await Promise.all([a.commit([sample]),b.commit([{...sample,id:'second-recipe'}])]);
  await a.refresh();assert.equal(a.snapshot().pending,2);await Promise.all([a.flush(),b.flush()]);await a.refresh();assert.equal(a.snapshot().recipes.length,2);assert.equal(a.snapshot().pending,0);
});
