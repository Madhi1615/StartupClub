const { $,esc,initials,getSupabase,requireUser,touchLastSeen }=Common;
let members=[];
async function load(){
  const s=await getSupabase();
  const user=await requireUser(); if(!user)return;
  await touchLastSeen(s,user.id);
  const {data,error}=await s.from('profiles')
    .select('id,username,full_name,headline,company,location,bio,building,skills,can_help,looking_for,linkedin_url,website_url,avatar_url')
    .eq('status','active').order('full_name');
  if(error)throw error;
  members=data||[];
  const skills=[...new Set(members.flatMap(m=>m.skills||[]))].sort();
  skills.forEach(x=>$('#skill').insertAdjacentHTML('beforeend',`<option>${esc(x)}</option>`));
  [...new Set(members.map(m=>m.location).filter(Boolean))].sort().forEach(x=>$('#location').insertAdjacentHTML('beforeend',`<option>${esc(x)}</option>`));
  $('#memberCount').textContent=members.length;
  $('#skillCount').textContent=skills.length;
  $('#builderCount').textContent=members.filter(m=>m.building).length;
  render();
}
function render(){
  const q=$('#search').value.toLowerCase(),sk=$('#skill').value,loc=$('#location').value;
  const list=members.filter(m=>{
    const hay=[m.full_name,m.headline,m.company,m.location,m.bio,m.building,m.can_help,m.looking_for,...(m.skills||[])].join(' ').toLowerCase();
    return(!q||hay.includes(q))&&(!sk||(m.skills||[]).includes(sk))&&(!loc||m.location===loc)
  });
  $('#grid').innerHTML=list.map(m=>`<article class="card member"><div class="member-head"><div class="avatar">${m.avatar_url?`<img src="${esc(m.avatar_url)}" alt="">`:initials(m.full_name)}</div><div><h3>${esc(m.full_name)}</h3><div class="muted">${esc(m.location||m.company||'Community member')}</div></div></div><div class="headline">${esc(m.headline||'Open to meaningful connections in the community.')}</div>${m.building?`<div class="profile-snippet"><span class="mini-label">Building / exploring</span>${esc(m.building)}</div>`:''}${m.can_help?`<div class="profile-snippet"><span class="mini-label green">Can help</span>${esc(m.can_help)}</div>`:''}<div class="tags">${(m.skills||[]).slice(0,4).map(x=>`<span class="tag">${esc(x)}</span>`).join('')}</div><div class="member-actions"><a class="btn" href="profile.html?id=${encodeURIComponent(m.id)}">View profile</a><a class="btn primary" href="messages.html?to=${encodeURIComponent(m.id)}">Message</a></div></article>`).join('')||'<div class="muted">No matching members.</div>';
}
['search','skill','location'].forEach(id=>$('#'+id).addEventListener(id==='search'?'input':'change',render));
load().catch(e=>{console.error(e);alert(e.message)});
