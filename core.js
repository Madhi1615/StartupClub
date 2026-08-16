const C = window.APP_CONFIG;
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
function esc(v=''){return String(v).replace(/[&<>'"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[m]))}
function initials(n=''){return n.split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase()||'?'}
function slugify(n=''){return n.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'.').replace(/^\.|\.$/g,'')}
function setBrand(){$$('[data-brand]').forEach(x=>x.textContent=C.COMMUNITY_NAME);$$('[data-tagline]').forEach(x=>x.textContent=C.TAGLINE)}
let client=null;
async function getSupabase(){
  if(!window.supabase)throw new Error('Supabase client not loaded');
  if(!client)client=window.supabase.createClient(C.SUPABASE_URL,C.SUPABASE_PUBLISHABLE_KEY);
  return client;
}
async function requireUser(){
  const s=await getSupabase();
  const {data:{user},error}=await s.auth.getUser();
  if(error||!user){location.href='index.html';return null}
  return user;
}
async function touchLastSeen(s,userId){
  try{await s.from('profiles').update({last_seen_at:new Date().toISOString()}).eq('id',userId)}catch(e){console.warn('Could not update last seen',e)}
}
async function signOut(){const s=await getSupabase();await s.auth.signOut();location.href='index.html'}
window.Common={C,$,$$,esc,initials,slugify,setBrand,getSupabase,requireUser,touchLastSeen,signOut};
document.addEventListener('DOMContentLoaded',setBrand);
