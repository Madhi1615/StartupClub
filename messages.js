const { $,esc,getSupabase,requireUser,touchLastSeen }=Common;
let me,members=[],messages=[],active=null,supa=null;
async function load(){
  supa=await getSupabase();me=await requireUser();if(!me)return;
  await touchLastSeen(supa,me.id);
  let r=await supa.from('profiles').select('id,full_name,username,avatar_url,status').eq('status','active').order('full_name');
  if(r.error)throw r.error;members=r.data||[];
  r=await supa.from('messages').select('*').order('created_at',{ascending:true});
  if(r.error)throw r.error;messages=r.data||[];
  supa.channel('dm').on('postgres_changes',{event:'INSERT',schema:'public',table:'messages'},payload=>{
    const m=payload.new;if(m.sender_id!==me.id&&m.recipient_id!==me.id)return;
    if(!messages.some(x=>x.id===m.id))messages.push(m);
    renderThreads();if(active&&[m.sender_id,m.recipient_id].includes(active))renderChat();
  }).subscribe();
  active=new URLSearchParams(location.search).get('to')||threadIds()[0]||members.find(x=>x.id!==me.id)?.id;
  renderThreads();renderChat();
}
function threadIds(){const ids=[];messages.forEach(m=>{if(m.sender_id===me.id&&!ids.includes(m.recipient_id))ids.push(m.recipient_id);if(m.recipient_id===me.id&&!ids.includes(m.sender_id))ids.push(m.sender_id)});return ids}
function renderThreads(){
  const ids=[...new Set([...(active?[active]:[]),...threadIds()])];
  $('#threads').innerHTML='<div class="eyebrow" style="padding:8px">Messages</div>'+ids.map(id=>{const p=members.find(x=>x.id===id);if(!p)return'';const last=messages.filter(m=>[m.sender_id,m.recipient_id].includes(me.id)&&[m.sender_id,m.recipient_id].includes(id)).at(-1);return`<div class="thread ${id===active?'active':''}" data-id="${esc(id)}"><b>${esc(p.full_name)}</b><div class="muted" style="font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(last?.body||'Start a conversation')}</div></div>`}).join('')||'<div class="muted" style="padding:14px">Start from the member directory.</div>';
  document.querySelectorAll('.thread').forEach(x=>x.onclick=()=>{active=x.dataset.id;renderThreads();renderChat()});
}
function renderChat(){
  const p=members.find(x=>x.id===active);if(!p){$('#chatHead').textContent='Select a conversation';$('#chatBody').innerHTML='';return}
  $('#chatHead').textContent=p.full_name;
  const msgs=messages.filter(m=>(m.sender_id===me.id&&m.recipient_id===active)||(m.sender_id===active&&m.recipient_id===me.id));
  $('#chatBody').innerHTML=msgs.map(m=>`<div class="bubble ${m.sender_id===me.id?'me':''}">${esc(m.body)}<div class="muted" style="font-size:10px;margin-top:5px">${new Date(m.created_at).toLocaleString()}</div></div>`).join('')||'<div class="muted">No messages yet. Say hello.</div>';
  $('#chatBody').scrollTop=$('#chatBody').scrollHeight;
}
$('#compose').addEventListener('submit',async e=>{
  e.preventDefault();const body=$('#msg').value.trim();if(!body||!active)return;
  const {data,error}=await supa.from('messages').insert({sender_id:me.id,recipient_id:active,body}).select().single();
  if(error)throw error;if(data&&!messages.some(x=>x.id===data.id))messages.push(data);
  $('#msg').value='';renderThreads();renderChat();
});
load().catch(e=>alert(e.message));
