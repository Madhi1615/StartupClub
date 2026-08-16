/**
 * Provisions SE Connect member accounts in Supabase.
 * Uses data/members.csv and, optionally, a private credentials CSV.
 *
 * Environment:
 *   SUPABASE_URL=https://xxx.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY=...
 *   MEMBER_EMAIL_DOMAIN=members.example.com
 *
 * Usage with pre-generated credentials supplied separately:
 *   node scripts/provision-members.mjs data/members.csv /path/to/SE_member_login_credentials.csv
 *
 * Usage without credentials file (generates new passwords):
 *   node scripts/provision-members.mjs data/members.csv
 *   -> outputs member_credentials.csv (KEEP PRIVATE)
 */
import fs from 'node:fs';
const source=process.argv[2]||'data/members.csv';
const credentialsPath=process.argv[3]||'';
const base=process.env.SUPABASE_URL, key=process.env.SUPABASE_SERVICE_ROLE_KEY, domain=process.env.MEMBER_EMAIL_DOMAIN||'members.example.com';
if(!base||!key)throw new Error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first.');
function parseCSV(text){const out=[];let row=[],cell='',q=false;for(let i=0;i<text.length;i++){const c=text[i],n=text[i+1];if(c==='"'&&q&&n==='"'){cell+='"';i++}else if(c==='"'){q=!q}else if(c===','&&!q){row.push(cell);cell=''}else if((c==='\n'||c==='\r')&&!q){if(c==='\r'&&n==='\n')i++;row.push(cell);cell='';if(row.some(x=>x.trim()))out.push(row);row=[]}else cell+=c}if(cell||row.length){row.push(cell);out.push(row)}return out}
function objects(text){const rows=parseCSV(text);const h=rows.shift().map(x=>x.trim());return rows.map(r=>Object.fromEntries(h.map((k,i)=>[k,r[i]||''])))}
function pwd(){const chars='ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';let s='';for(let i=0;i<16;i++)s+=chars[Math.floor(Math.random()*chars.length)];return s}
async function api(path,opt={}){const r=await fetch(base+'/auth/v1'+path,{...opt,headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json',...(opt.headers||{})}});const t=await r.text();if(!r.ok)throw new Error(`${r.status} ${t}`);return t?JSON.parse(t):{}}
async function rest(path,opt={}){const r=await fetch(base+'/rest/v1/'+path,{...opt,headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json',Prefer:'return=representation',...(opt.headers||{})}});const t=await r.text();if(!r.ok)throw new Error(`${r.status} ${t}`);return t?JSON.parse(t):{}}
const members=objects(fs.readFileSync(source,'utf8'));
let supplied=new Map();
if(credentialsPath){for(const r of objects(fs.readFileSync(credentialsPath,'utf8')))supplied.set(r.Username,{name:r.Name,password:r['Temporary Password']})}
const generated=[['Name','Username','Temporary Password']];
for(const row of members){
  const username=row.username.trim(); if(!username)continue;
  const password=supplied.get(username)?.password||pwd();
  const email=`${username}@${domain}`;
  const u=await api('/admin/users',{method:'POST',body:JSON.stringify({email,password,email_confirm:true})});
  const skills=(row.skills||'').split(/[;,]/).map(x=>x.trim()).filter(Boolean);
  const profile={id:u.id,username,full_name:row.full_name,headline:row.headline||'',company:'',location:row.location||'',bio:row.bio||'',building:row.building||'',skills,can_help:row.can_help||'',looking_for:row.looking_for||'',linkedin_url:row.linkedin_url||'',website_url:row.website_url||''};
  await rest('profiles',{method:'POST',body:JSON.stringify(profile)});
  generated.push([row.full_name,username,password]);
  console.log('Created',row.full_name,username);
}
if(!credentialsPath){const csvOut=generated.map(r=>r.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(',')).join('\n');fs.writeFileSync('member_credentials.csv',csvOut);console.log(`\nCreated ${generated.length-1} accounts. Credentials: member_credentials.csv`)}
else console.log(`\nCreated ${members.length} accounts using the supplied private credentials file.`);
