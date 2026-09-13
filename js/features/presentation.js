/* Progressive disclosure and shared Vault presentation. */
document.querySelectorAll('[data-form-extra]').forEach(button=>button.onclick=()=>{const panel=$(button.dataset.formExtra),willOpen=panel.classList.contains('hidden');panel.classList.toggle('hidden',!willOpen);button.classList.toggle('open',willOpen);button.setAttribute('aria-expanded',String(willOpen))});
function setFormExtra(id,open){const panel=$(id),button=document.querySelector(`[data-form-extra="${id}"]`);panel.classList.toggle('hidden',!open);button.classList.toggle('open',open);button.setAttribute('aria-expanded',String(open))}

document.querySelector('[data-wishlist-unified="done"]').onclick=()=>{wishlistFilter='bought';purchaseFilter='all';document.querySelectorAll('#purchaseTypeFilters button').forEach(button=>button.classList.toggle('selected',button.dataset.wishlistUnified==='done'));renderWishlist()};
document.querySelectorAll('#purchaseTypeFilters [data-purchase-filter]').forEach(button=>button.addEventListener('click',()=>{wishlistFilter='open';document.querySelectorAll('#purchaseTypeFilters button').forEach(other=>other.classList.toggle('selected',other===button));renderWishlist()}));

const vaultIcons={masterlistModule:'stack',wishlistModule:'shopping-bag',listsModule:'list-checks',ideasModule:'lightbulb',bucketlistModule:'star',choresModule:'broom'};Object.entries(vaultIcons).forEach(([id,icon])=>{const card=$(id);card.querySelector('.vault-icon')?.remove();const holder=document.createElement('span');holder.className='vault-icon';holder.innerHTML=`<i class="ph ph-${icon}" aria-hidden="true"></i>`;card.prepend(holder)});
document.querySelectorAll('.modal-close').forEach(button=>{if(!button.classList.contains('capture-save'))button.textContent=''});



/* Ambient Lumi motion: soft, sporadic four-point sparkles near the active header. */
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
    timer=setTimeout(()=>{spawn();schedule()},4300+Math.random()*5200);
  };
  const spawn=()=>{
    if(reduced()||document.hidden) return;
    const active=document.querySelector('.screen.active');
    if(!active || active.id==='homeScreen') return;
    const rect=active.getBoundingClientRect();
    const star=document.createElement('i');
    const size=8+Math.random()*10;
    const palette=['101,179,184','184,112,112','123,88,160','255,179,71'];
    const top=Math.max(32,rect.top+28+Math.random()*Math.min(150,Math.max(72,rect.height*.18)));
    const left=Math.max(24,Math.min(window.innerWidth-24,rect.left+28+Math.random()*Math.max(56,rect.width-56)));
    star.className='lumie';
    star.style.setProperty('--lumie-size',`${size}px`);
    star.style.setProperty('--lumie-rgb',palette[Math.floor(Math.random()*palette.length)]);
    star.style.left=`${left}px`;
    star.style.top=`${top}px`;
    star.innerHTML='<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false"><path d="M50 2 C46 26 27 46 2 50 C27 54 46 74 50 98 C54 74 73 54 98 50 C73 46 54 26 50 2 Z"/></svg>';
    layer.append(star);
    star.addEventListener('animationend',()=>star.remove(),{once:true});
  };
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule()});
  setTimeout(spawn,1400);
  schedule();
})();
