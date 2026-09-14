/* LumiVault consolidation: capture, collections, search, projects and purchases. */
(function consolidateLumiVault(){
  const iconNames=['house','car','map-pin','paw-print','package','suitcase-rolling','heart','wrench','plant','briefcase','storefront','currency-eur','file-text','star','confetti','airplane-tilt','bicycle','book-open','music-notes','camera','palette','graduation-cap','barbell','sparkle'];

  function makeSearch(id,placeholderKey){
    const wrap=document.createElement('div');wrap.className='search-wrap collection-search';
    wrap.innerHTML='<span class="search-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/></svg></span>';
    const input=document.createElement('input');input.id=id;input.type='search';input.placeholder=t(placeholderKey);input.setAttribute('aria-label',t(placeholderKey));wrap.append(input);return wrap;
  }

  function installNavigation(){
    document.querySelector('.nav-button[data-screen="projects"]')?.remove();
    const nav=document.querySelector('.bottom-nav');
    nav?.classList.add('consolidated-nav');
    $('globalAddButton').onclick=openUniversalCapture;
    syncVdsNavIcons();
  }

  function installVaultProjects(){
    if($('projectsModule'))return;
    const button=document.createElement('button');button.id='projectsModule';button.className='module-card module-projects';button.type='button';
    button.innerHTML=`<span class="vault-icon"><i class="ph ph-folder-star" aria-hidden="true"></i></span><strong>${t('vault.projects')}</strong>`;
    button.onclick=()=>showScreen('projects');document.querySelector('#vaultScreen .module-grid')?.append(button);
    const projectHeader=$('projectsScreen')?.querySelector('.simple-header');
    if(projectHeader&&!projectHeader.querySelector('.projects-vault-back')){const back=document.createElement('button');back.type='button';back.className='back-button projects-vault-back';back.setAttribute('aria-label','Vault');back.textContent='←';back.onclick=()=>showScreen('vault');projectHeader.prepend(back)}
    $('projectBackButton').onclick=()=>{currentProjectId=null;showScreen('projects')};
  }

  function installCaptureTypes(){
    const list=document.querySelector('.capture-type-list');
    const labels={wishlist:'capture.purchase',household:'capture.household',bucket:'capture.bucketItem'};
    const wishlistButton=list?.querySelector('[data-capture-type="wishlist"] strong');if(wishlistButton)wishlistButton.textContent=t(labels.wishlist);
    for(const type of ['household','bucket'])if(!list?.querySelector(`[data-capture-type="${type}"]`)){
      const button=document.createElement('button');button.type='button';button.dataset.captureType=type;button.innerHTML=`<strong>${t(labels[type])}</strong>`;list.append(button);
    }
    list?.querySelectorAll('[data-capture-type]').forEach(button=>button.onclick=()=>openCapturedType(button.dataset.captureType));
  }

  function syncFlowChrome(){
    const overlayOpen=!!document.querySelector('#universalCaptureOverlay:not(.hidden),#captureTypeOverlay:not(.hidden),#projectOverlay:not(.hidden),#wishlistOverlay:not(.hidden),#listOverlay:not(.hidden),#ideaOverlay:not(.hidden),#financeOverlay:not(.hidden),#documentOverlay:not(.hidden)');
    document.body.classList.toggle('creation-flow-open',currentScreen==='capture'||overlayOpen);
  }

  function installProjectIcons(){
    const colors=$('projectColorChoices');if(!colors||$('projectIconChoices'))return;
    const label=document.createElement('label');label.className='small-label';label.textContent=t('project.icon');
    const picker=document.createElement('div');picker.id='projectIconChoices';picker.className='project-icon-picker';
    iconNames.forEach(name=>{const button=document.createElement('button');button.type='button';button.dataset.projectIcon=name;button.setAttribute('aria-label',name);button.innerHTML=`<i class="ph ph-${name}"></i>`;button.onclick=()=>{selectedProjectIcon=name;picker.querySelectorAll('button').forEach(x=>x.classList.toggle('selected',x===button))};picker.append(button)});
    colors.before(label,picker);
  }

  function installProjectTabs(){
    const tabs=document.querySelectorAll('.project-tabs button');if(tabs.length<2)return;
    tabs[0].textContent=t('project.active');tabs[1].textContent=t('project.completed');tabs[1].disabled=false;
    tabs.forEach((button,index)=>button.onclick=()=>{projectView=index?'completed':'active';tabs.forEach(x=>x.classList.toggle('active',x===button));renderProjects()});
  }

  function installPurchaseSearch(){
    if($('purchaseSearch'))return;const search=makeSearch('purchaseSearch','purchase.search');document.querySelector('.purchase-tools')?.before(search);search.querySelector('input').oninput=e=>{purchaseQuery=e.target.value.trim().toLowerCase();if(purchaseQuery){purchaseFilter='all';wishlistFilter='open'}renderWishlist()};
    purchaseFilter='need';wishlistFilter='open';
    const filter=$('purchaseTypeFilters');const order=[filter.querySelector('[data-purchase-filter="need"]'),filter.querySelector('[data-purchase-filter="wish"]'),filter.querySelector('[data-purchase-filter="all"]'),filter.querySelector('[data-wishlist-unified="done"]')];order.forEach(b=>b&&filter.append(b));
    order[0].textContent=t('purchase.need');order[1].textContent=t('purchase.wishlist');order[2].textContent=t('purchase.all');order[3].textContent=t('purchase.done');
  }

  function installPurchaseForm(){
    const typeWish=document.querySelector('[data-purchase-type="wish"]');if(typeWish)typeWish.textContent=t('purchase.wishlist');
    const extra=document.querySelector('#wishlistOverlay .wishlist-options');if(extra&&!extra.previousElementSibling?.classList.contains('purchase-extra-heading')){const heading=document.createElement('button');heading.type='button';heading.className='purchase-extra-heading';heading.textContent=t('purchase.extraTitle');heading.setAttribute('aria-expanded','false');heading.onclick=()=>{const open=extra.classList.toggle('purchase-options-open');heading.setAttribute('aria-expanded',String(open))};extra.before(heading)}
    document.querySelectorAll('[data-purchase-type]').forEach(button=>button.addEventListener('click',()=>{selectedPurchaseType=button.dataset.purchaseType;syncPurchaseTiming()}));
    document.querySelectorAll('[data-purchase-importance]').forEach(button=>button.addEventListener('click',()=>{purchaseImportance=+button.dataset.purchaseImportance;if(purchaseImportance===4)toggleWishlistField('wishlistHasDeadline','wishlistDeadlineFields',true);else if(!$('wishlistDeadline').value)toggleWishlistField('wishlistHasDeadline','wishlistDeadlineFields',false)}));
  }

  window.addUrgentPurchaseToHome=function(){
    const today=todayKey(),days=date=>Math.ceil((new Date(date+'T12:00')-new Date(today+'T12:00'))/864e5);
    const urgent=wishlist.filter(w=>!w.bought&&((w.purchaseType==='need'&&w.importance>=3)||(w.deadline?.enabled&&days(w.deadline.date)<=3))).sort((a,b)=>(b.importance||0)-(a.importance||0))[0];
    if(!urgent||document.querySelector(`[data-purchase-suggestion="${urgent.id}"]`))return;
    const card=document.createElement('article');card.className='suggestion-card purchase-suggestion';card.dataset.purchaseSuggestion=urgent.id;card.innerHTML=`<span class="purchase-suggestion-icon"><i class="ph ph-shopping-bag"></i></span><div class="suggestion-content"><strong></strong><small>${t('vault.searchType.purchase')} · ${urgent.purchaseType==='need'?t('purchase.need'):t('purchase.wishlist')}</small></div>`;card.querySelector('strong').textContent=urgent.name;card.onclick=()=>openWishlistDetail(urgent);$('suggestionList')?.append(card);
  };

  function searchEntries(){
    const entries=[];const push=(title,meta,open,search=title)=>entries.push({title,meta,open,search:normalizeSearchText(search,meta)});
    actions.forEach(item=>push(item.title,isHouseholdTask(item)?t('vault.searchType.household'):t('vault.searchType.task'),()=>{showScreen(isHouseholdTask(item)?'chores':'masterlist');openTaskDetail(item)},`${item.title} ${item.note||''}`));
    wishlist.forEach(item=>push(item.name,`${t('vault.searchType.purchase')} · ${item.purchaseType==='need'?t('purchase.need'):t('purchase.wishlist')}`,()=>{showScreen('wishlist');openWishlistDetail(item)},`${item.name} ${item.note||''} ${item.link||''}`));
    ideas.forEach(item=>push(item.text,t('vault.searchType.idea'),()=>{showScreen('ideas');openIdea(item)},`${item.text} ${item.note||''}`));
    lists.forEach(list=>{push(list.name,t('vault.searchType.list'),()=>showListDetail(list.id));(list.items||[]).forEach(item=>push(item.text,`${t('vault.searchType.list')} · ${list.name}`,()=>showListDetail(list.id),item.text))});
    bucketlist.forEach(group=>(group.items||[]).forEach(item=>push(item.text,`${t('vault.searchType.bucket')} · ${group.name}`,()=>showScreen('bucketlist'),item.text)));
    projects.forEach(project=>push(project.title,`${t('vault.searchType.project')} · ${project.archived?t('project.completed'):t('project.active')}`,()=>showProjectDetail(project.id),project.title));return entries;
  }

  function installVaultSearch(){
    const input=$('vaultVisualSearch');if(!input)return;const results=document.createElement('div');results.id='vaultSearchResults';results.className='vault-search-results hidden';input.closest('.vault-search-shell').after(results);
    input.oninput=()=>{const q=normalizeSearchText(input.value.trim());results.innerHTML='';results.classList.toggle('hidden',!q);document.querySelector('#vaultScreen .module-grid').classList.toggle('searching',!!q);document.querySelector('#vaultScreen .vault-section-title').classList.toggle('hidden',!!q);if(!q)return;const matches=searchEntries().filter(entry=>entry.search.includes(q)).slice(0,30);if(!matches.length){results.innerHTML=`<p class="search-empty">${t('vault.searchEmpty')}</p>`;return}matches.forEach(entry=>{const button=document.createElement('button');button.type='button';button.className='vault-search-result';button.innerHTML='<strong></strong><small></small><span aria-hidden="true">›</span>';button.querySelector('strong').textContent=entry.title;button.querySelector('small').textContent=entry.meta;button.onclick=()=>{input.value='';results.classList.add('hidden');document.querySelector('#vaultScreen .module-grid').classList.remove('searching');entry.open()};results.append(button)})};
  }

  installNavigation();installVaultProjects();installCaptureTypes();installProjectIcons();installProjectTabs();installPurchaseSearch();installPurchaseForm();installVaultSearch();
  const flowObserver=new MutationObserver(syncFlowChrome);document.querySelectorAll('.overlay,.screen').forEach(node=>flowObserver.observe(node,{attributes:true,attributeFilter:['class']}));syncFlowChrome();
  applyI18n();renderProjects();renderWishlist();renderHome();
})();
