// The service-role key is server-only. Target identity always comes from Supabase,
// never from a caller-supplied user ID. Deleting auth.users cascades recipe rows.
export function createDeleteAccountHandler({env=process.env,fetchImpl=fetch}={}) {
 return async function handler(req,res) {
  res.setHeader('Cache-Control','private, no-store');
  const fail=(status,error)=>res.status(status).json({error});
  if(req.method!=='POST'){res.setHeader('Allow','POST');return fail(405,'METHOD');}
  if(!env.VITE_SUPABASE_URL||!env.VITE_SUPABASE_PUBLISHABLE_KEY||!env.SUPABASE_SERVICE_ROLE_KEY)return fail(503,'NOT_CONFIGURED');
  const authorization=req.headers.authorization;
  if(typeof authorization!=='string'||!authorization.startsWith('Bearer '))return fail(401,'SIGN_IN');
  let body;try{body=typeof req.body==='string'?JSON.parse(req.body):req.body;}catch{return fail(400,'INVALID_INPUT');}
  if(body?.confirm!=='DELETE_MY_ACCOUNT'||typeof body.email!=='string'||body.email.length>320)return fail(400,'INVALID_INPUT');
  const url=env.VITE_SUPABASE_URL.replace(/\/$/,'');
  try{
   const response=await fetchImpl(`${url}/auth/v1/user`,{headers:{apikey:env.VITE_SUPABASE_PUBLISHABLE_KEY,Authorization:authorization},signal:AbortSignal.timeout(8000)});
   if(!response.ok)return fail(401,'SIGN_IN');
   const user=await response.json();
   if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id||'')||!user.email)return fail(401,'SIGN_IN');
   if(user.email.toLowerCase()!==body.email.trim().toLowerCase())return fail(400,'CONFIRM_EMAIL');
   const deleted=await fetchImpl(`${url}/auth/v1/admin/users/${user.id}`,{method:'DELETE',headers:{apikey:env.SUPABASE_SERVICE_ROLE_KEY,Authorization:`Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({should_soft_delete:false}),signal:AbortSignal.timeout(15000)});
   if(!deleted.ok)return fail(502,'DELETE_FAILED');
   return res.status(200).json({deleted:true});
  }catch{return fail(502,'DELETE_FAILED');}
 };
}
export default createDeleteAccountHandler();
