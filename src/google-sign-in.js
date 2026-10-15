// OAuth credentials live in Google Cloud + Supabase, never in the frontend.
export async function startGoogleSignIn(client, origin) {
 const {error}=await client.auth.signInWithOAuth({
  provider:'google',
  options:{redirectTo:new URL('/?account=1',origin).href,queryParams:{prompt:'select_account'}},
 });
 if(error)throw error;
}
