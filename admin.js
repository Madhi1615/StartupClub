const { C,$,esc,getSupabase,requireUser,touchLastSeen }=Common;
let members=[],report={},supa=null;
async function load(){
  supa=await getSupabase();const user=await requireUser();if(!user)return;
  const {data:p,error:pe}=await supa.from('profiles').select('role,status').eq('id',user.id).single();
  if(pe)throw pe;if(p?.role!=='admin'||p?.status!=='active')return location.href='members.html';
  await touchLastSeen(supa,user.id);
  const r=await supa.from('profiles').select('id,full_name,username,status,headline,bio,building,can_help,looking_for,skills,location,last_seen_at').order('full_name');
  if(r.error)throw r.error;members=r.data||[];report=await callAdmin('report_summary');renderStats();renderRows();
}
function completeness(m){return Math.round(([m.headline,m.bio,m.building,m.can_help,m.looking_for,(m.skills||[]).length].filter(Boolean).length/6)*100)}
function renderStats(){const items=[['Total members',report.total],['Active',report.active],['Blocked',report.blocked],['Messages · 7 days',report.messages_7d]];$('#stats').innerHTML=items.map(([a,b])=>`<div class="stat"><strong>${esc(b??0)}</strong><span>${esc(a)}</span></div>`).join('')}
function renderRows(){
  const q=$('#adminSearch').value.toLowerCase();
  const filtered=members.filter(m=>[m.full_name,m.username,m.location,...(m.skills||[])].join(' ').toLowerCase().includes(q));
  $('#rows').innerHTML=filtered.map(m=>`<tr data-id="${esc(m.id)}"><td><b>${esc(m.full_name)}</b></td><td>${esc(m.username)}</td><td><span class="status ${esc(m.status)}">${esc(m.status)}</span></td><td>${completeness(m)}%</td><td>${m.last_seen_at?new Date(m.last_seen_at).toLocaleDateString():'—'}</td><td><button class="btn block-btn">${m.status==='blocked'?'Unblock':'Block'}</button> <button class="btn reset-btn">Reset password</button></td></tr>`).join('');
  document.querySelectorAll('#rows tr').forEach(row=>{
    const id=row.dataset.id;row.querySelector('.block-btn').onclick=()=>toggleBlock(id);row.querySelector('.reset-btn').onclick=()=>resetPass(id);
  });
}
async function callAdmin(action,payload={}){
  const {data:{session}}=await supa.auth.getSession();if(!session)throw new Error('Session expired. Please sign in again.');
  const res=await fetch(`${C.SUPABASE_URL}/functions/v1/admin-user`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${session.access_token}`,'apikey':C.SUPABASE_PUBLISHABLE_KEY},body:JSON.stringify({action,...payload})});
  const out=await res.json();if(!res.ok)throw new Error(out.error||'Admin action failed');return out;
}
async function toggleBlock(id){const m=members.find(x=>x.id===id);if(!m)return;await callAdmin(m.status==='blocked'?'unblock_user':'block_user',{user_id:id});m.status=m.status==='blocked'?'active':'blocked';renderRows();report.active=members.filter(x=>x.status==='active').length;report.blocked=members.filter(x=>x.status==='blocked').length;renderStats()}
async function resetPass(id){const m=members.find(x=>x.id===id);if(!m)return;const out=await callAdmin('reset_password',{user_id:id});alert(`Temporary password for ${m.full_name}:\n\n${out.temporary_password}\n\nSend this privately. The user should change it after login.`)}
$('#adminSearch').addEventListener('input',renderRows);
$('#addUser').onclick=()=>alert('Add new members through the secure admin provisioning function. The public website never stores admin secrets.');
$('#exportReport').onclick=()=>{const cols=['Name','Username','Status','Profile completeness','Location','Topics','Last seen'];const rows=members.map(m=>[m.full_name,m.username,m.status,completeness(m)+'%',m.location||'',(m.skills||[]).join('; '),m.last_seen_at?new Date(m.last_seen_at).toISOString():'']);const csv=[cols,...rows].map(r=>r.map(v=>'"'+String(v??'').replaceAll('"','""')+'"').join(',')).join('\n');const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='SE_Connect_member_report.csv';a.click();URL.revokeObjectURL(a.href)};
load().catch(e=>alert(e.message));
