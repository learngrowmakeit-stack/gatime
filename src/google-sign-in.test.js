import test from 'node:test';import assert from 'node:assert/strict';
import {startGoogleSignIn} from './google-sign-in.js';
test('Google OAuth returns to this app origin and requests explicit account selection',async()=>{let request;await startGoogleSignIn({auth:{signInWithOAuth:async options=>{request=options;return {error:null};}}},'https://gatime-beryl.vercel.app');assert.deepEqual(request,{provider:'google',options:{redirectTo:'https://gatime-beryl.vercel.app/?account=1',queryParams:{prompt:'select_account'}}});});
test('Google provider errors reach the UI instead of appearing as a successful sign-in',async()=>{const error=new Error('disabled provider');await assert.rejects(()=>startGoogleSignIn({auth:{signInWithOAuth:async()=>({error})}},'https://gatime-beryl.vercel.app'),error);});
