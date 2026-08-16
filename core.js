const C = window.APP_CONFIG;
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
function esc(v=''){return String(v).replace(/[&<>'"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[m]))}
function initials(n=''){return n.split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase()||'?'}
function slugify(n=''){return n.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'.').replace(/^\.|\.$/g,'')}
function setBrand(){$$('[data-brand]').forEach(x=>x.textContent=C.COMMUNITY_NAME);$$('[data-tagline]').forEach(x=>x.textContent=C.TAGLINE)}
function getDemoUser(){return JSON.parse(localStorage.getItem('demo_user')||'null')}
function requireDemo(){if(C.DEMO_MODE&&!getDemoUser()&&!location.pathname.endsWith('index.html'))location.href='index.html'}
async function getSupabase(){if(C.DEMO_MODE)return null;if(!window.supabase)throw new Error('Supabase client not loaded');return window.supabase.createClient(C.SUPABASE_URL,C.SUPABASE_ANON_KEY)}
async function signOut(){if(C.DEMO_MODE){localStorage.removeItem('demo_user')}else{const s=await getSupabase();await s.auth.signOut()}location.href='index.html'}
window.Common={C,$,$$,esc,initials,slugify,setBrand,getDemoUser,requireDemo,getSupabase,signOut};
document.addEventListener('DOMContentLoaded',setBrand);
