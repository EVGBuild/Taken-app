/* Rollout 7: progressive disclosure and shared Vault presentation. */
const suggestionCardR7=suggestionCard;suggestionCard=function(item,secondary=false){const card=suggestionCardR7(item,secondary),projectLabel=card.querySelector('.suggestion-project');if(projectLabel)projectLabel.textContent=displayProjectName(projectLabel.textContent);card.querySelector('.recommendation-why')?.remove();const swap=card.querySelector('.swap-button');if(swap)swap.innerHTML='<span aria-hidden="true">⇄</span> Wissel taak';return card};

openTaskDetail=function(item){$('taskDetailTitle').textContent=item.title;const project=projects.find(entry=>entry.id===item.projectId),projectLabel=$('taskDetailProject');projectLabel.textContent=project?.title||'';projectLabel.classList.toggle('hidden',!project);$('taskDetailMeta').innerHTML='';$('taskDetailEditButton').onclick=()=>{close('taskDetailOverlay');openAction(item)};$('taskDetailDeleteButton').onclick=()=>{close('taskDetailOverlay');removeWithUndo(actions,item,saveActions,()=>showScreen(detailOrigin==='projectDetail'?'projectDetail':detailOrigin==='masterlist'?'masterlist':'home'),'Weet je zeker dat je deze taak wilt verwijderen?')};open('taskDetailOverlay')};

document.querySelectorAll('[data-form-extra]').forEach(button=>button.onclick=()=>{const panel=$(button.dataset.formExtra),willOpen=panel.classList.contains('hidden');panel.classList.toggle('hidden',!willOpen);button.classList.toggle('open',willOpen);button.setAttribute('aria-expanded',String(willOpen))});
function setFormExtra(id,open){const panel=$(id),button=document.querySelector(`[data-form-extra="${id}"]`);panel.classList.toggle('hidden',!open);button.classList.toggle('open',open);button.setAttribute('aria-expanded',String(open))}
const openDocumentR7=openDocument;openDocument=function(item=null){openDocumentR7(item);const hasExtra=!!item&&(!!item.category||!!item.date||!!item.party||item.amount!==''||item.tags?.length||!!item.note);setFormExtra('documentExtra',hasExtra)};

document.querySelector('[data-wishlist-unified="done"]').onclick=()=>{wishlistFilter='bought';purchaseFilter='all';document.querySelectorAll('#purchaseTypeFilters button').forEach(button=>button.classList.toggle('selected',button.dataset.wishlistUnified==='done'));renderWishlist()};
document.querySelectorAll('#purchaseTypeFilters [data-purchase-filter]').forEach(button=>button.addEventListener('click',()=>{wishlistFilter='open';document.querySelectorAll('#purchaseTypeFilters button').forEach(other=>other.classList.toggle('selected',other===button));renderWishlist()}));
const renderWishlistR7=renderWishlist;renderWishlist=function(){renderWishlistR7();$('purchaseTypeFilters').classList.remove('hidden');document.querySelectorAll('#purchaseTypeFilters button').forEach(button=>button.classList.toggle('selected',wishlistFilter==='bought'?button.dataset.wishlistUnified==='done':button.dataset.purchaseFilter===purchaseFilter))};

const vaultIcons={wishlistModule:'shopping-bag',listsModule:'list-checks',ideasModule:'lightbulb',inboxModule:'tray',financeModule:'wallet',documentsModule:'files',bucketlistModule:'star',choresModule:'broom'};Object.entries(vaultIcons).forEach(([id,icon])=>{const card=$(id);card.querySelector('.vault-icon')?.remove();const holder=document.createElement('span');holder.className='vault-icon';holder.innerHTML=`<i class="ph ph-${icon}" aria-hidden="true"></i>`;card.prepend(holder)});
document.querySelectorAll('.modal-close').forEach(button=>{if(!button.classList.contains('capture-save'))button.textContent=''});



/* Ambient Lumi motion: subtle, sporadic twinkles near the top of active screens. */
(function installLumies(){
  if(document.getElementById('lumiAmbientLayer')) return;
  const layer=document.createElement('div');
  layer.id='lumiAmbientLayer';
  layer.className='lumi-ambient-layer';
  layer.setAttribute('aria-hidden','true');
  document.body.append(layer);
  let timer=null;
  const reduced=()=>document.documentElement.classList.contains('reduce-motion')||document.body.classList.contains('reduce-motion')||window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const schedule=()=>{
    clearTimeout(timer);
    timer=setTimeout(()=>{spawn();schedule()},3200+Math.random()*6200);
  };
  const spawn=()=>{
    if(reduced()||document.hidden) return;
    const active=document.querySelector('.screen.active');
    if(!active) return;
    const rect=active.getBoundingClientRect();
    const dot=document.createElement('i');
    const size=3.5+Math.random()*7.5;
    const palette=['101,179,184','184,112,112','123,88,160','255,179,71'];
    const top=Math.max(32,rect.top+18+Math.random()*Math.min(165,Math.max(76,rect.height*.21)));
    const left=Math.max(18,Math.min(window.innerWidth-18,rect.left+22+Math.random()*Math.max(44,rect.width-44)));
    dot.className='lumie';
    dot.style.setProperty('--lumie-size',`${size}px`);
    dot.style.setProperty('--lumie-rgb',palette[Math.floor(Math.random()*palette.length)]);
    dot.style.left=`${left}px`;
    dot.style.top=`${top}px`;
    dot.style.animationDuration=`${1.65+Math.random()*1.45}s`;
    layer.append(dot);
    dot.addEventListener('animationend',()=>dot.remove(),{once:true});
  };
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule()});
  setTimeout(spawn,1100);
  schedule();
})();
