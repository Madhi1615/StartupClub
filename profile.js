const { $,esc,initials,getSupabase,requireUser,touchLastSeen }=Common;
let me=null,p=null,isOwn=false,supa=null;
async function load(){
  const id=new URLSearchParams(location.search).get('id');
  supa=await getSupabase();
  me=await requireUser(); if(!me)return;
  await touchLastSeen(supa,me.id);
  const pid=id||me.id;
  const {data,error}=await supa.from('profiles').select('*').eq('id',pid).single();
  if(error)throw error;
  p=data;isOwn=pid===me.id;render();
}
function render(){
  document.title=p.full_name+' · SE Connect';
  $('#profile').innerHTML=`<aside class="card sidebar"><div class="avatar" style="width:100px;height:100px;font-size:30px">${p.avatar_url?`<img src="${esc(p.avatar_url)}" alt="">`:initials(p.full_name)}</div><div class="profile-name">${esc(p.full_name)}</div><div class="muted">@${esc(p.username)}</div><p>${esc(p.headline||'')}</p><p class="muted">${esc(p.company||'')}${p.company&&p.location?' · ':''}${esc(p.location||'')}</p><div class="tags">${(p.skills||[]).map(s=>`<span class="tag">${esc(s)}</span>`).join('')}</div><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:20px">${isOwn?'<button class="btn primary" id="editBtn">Edit profile</button><button class="btn" id="passwordBtn">Change password</button>':`<a class="btn primary" href="messages.html?to=${encodeURIComponent(p.id)}">Message</a>`}${p.linkedin_url?`<a class="btn" target="_blank" rel="noopener noreferrer" href="${esc(p.linkedin_url)}">LinkedIn</a>`:''}</div></aside><main class="card content"><section class="section"><div class="eyebrow">Who I am</div><h2>${esc(p.headline||'Community member')}</h2><p class="profile-copy">${esc(p.bio||'This member has not added an introduction yet.')}</p></section><section class="section"><div class="eyebrow saffron">Building / exploring</div><h3>What I’m obsessed with</h3><p class="profile-copy">${esc(p.building||'Not specified yet.')}</p></section><section class="section two-col"><div><div class="eyebrow green-text">I can help with</div><p class="profile-copy">${esc(p.can_help||'Not specified yet.')}</p></div><div><div class="eyebrow">I’m looking for</div><p class="profile-copy">${esc(p.looking_for||'Not specified yet.')}</p></div></section><section class="section"><h3>Topics & expertise</h3><div class="tags">${(p.skills||[]).map(s=>`<span class="tag">${esc(s)}</span>`).join('')||'<span class="muted">No topics added yet.</span>'}</div></section></main>`;
  if(isOwn){
    $('#editBtn').onclick=openEdit;
    $('#passwordBtn').onclick=()=>{$('#passwordMessage').textContent='';$('#passwordForm').reset();$('#passwordModal').classList.add('open')};
  }
}
function openEdit(){
  $('#fHeadline').value=p.headline||'';$('#fCompany').value=p.company||'';$('#fLocation').value=p.location||'';$('#fLinkedin').value=p.linkedin_url||'';$('#fBio').value=p.bio||'';$('#fBuilding').value=p.building||'';$('#fSkills').value=(p.skills||[]).join(', ');$('#fHelp').value=p.can_help||'';$('#fLooking').value=p.looking_for||'';$('#editModal').classList.add('open');
}
$('#editForm').addEventListener('submit',async e=>{
  e.preventDefault();
  const patch={headline:$('#fHeadline').value,company:$('#fCompany').value,location:$('#fLocation').value,linkedin_url:$('#fLinkedin').value,bio:$('#fBio').value,building:$('#fBuilding').value,skills:$('#fSkills').value.split(',').map(x=>x.trim()).filter(Boolean),can_help:$('#fHelp').value,looking_for:$('#fLooking').value,updated_at:new Date().toISOString()};
  const {error}=await supa.from('profiles').update(patch).eq('id',me.id);if(error)throw error;
  Object.assign(p,patch);$('#editModal').classList.remove('open');render();
});
$('#passwordForm').addEventListener('submit',async e=>{
  e.preventDefault();const a=$('#newPassword').value,b=$('#confirmPassword').value;
  if(a!==b){$('#passwordMessage').textContent='Passwords do not match.';return}
  if(a.length<10){$('#passwordMessage').textContent='Use at least 10 characters.';return}
  const {error}=await supa.auth.updateUser({password:a});
  if(error){$('#passwordMessage').textContent=error.message;return}
  $('#passwordMessage').textContent='Password updated successfully.';
  setTimeout(()=>$('#passwordModal').classList.remove('open'),700);
});
load().catch(e=>alert(e.message));
