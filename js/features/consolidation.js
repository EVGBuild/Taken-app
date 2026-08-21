/* LumiVault consolidation: capture, collections, search, projects and purchases. */
(function consolidateLumiVault(){
  Object.assign(LUMI_TRANSLATIONS.nl,{
    'capture.purchase':'Aankoop / wens','capture.household':'Huishoudelijke taak','capture.bucketItem':'Bucketlist-item',
    'capture.taskEyebrow':'Taak','capture.extraTitle':'Extra informatie','task.resistanceQuestion':'Hoe erg zie je ertegenop om eraan te beginnen?',
    'nav.projects':'Projecten','project.icon':'Icoon','project.active':'Actief','project.completed':'Afgerond','project.archive':'Markeer als afgerond','project.reopen':'Maak weer actief',
    'purchase.search':'Zoek in Kopen','purchase.all':'Alles','purchase.done':'Geregeld','purchase.wishlist':'Wishlist','purchase.needTiming':'Wanneer heb je het nodig?','purchase.wishTiming':'Wanneer wil je dit?','purchase.noRush':'Geen haast','purchase.byDate':'Voor een bepaalde datum','purchase.extraTitle':'Extra informatie',
    'vault.searchEmpty':'Geen resultaten gevonden','vault.searchType.task':'Masterlist','vault.searchType.purchase':'Kopen','vault.searchType.idea':'Ideeën','vault.searchType.list':'Lijstjes','vault.searchType.bucket':'Bucketlist','vault.searchType.project':'Projecten','vault.searchType.household':'Huishouden',
    'vault.projects':'Projecten','capture.householdSaved':'Huishoudelijke taak','capture.bucketSaved':'Bucketlist-item'
  });
  Object.assign(LUMI_TRANSLATIONS.en,{
    'capture.purchase':'Purchase / wish','capture.household':'Household task','capture.bucketItem':'Bucket-list item',
    'capture.taskEyebrow':'Task','capture.extraTitle':'Extra information','task.resistanceQuestion':'How much do you dread getting started?',
    'nav.projects':'Projects','project.icon':'Icon','project.active':'Active','project.completed':'Completed','project.archive':'Mark completed','project.reopen':'Make active again',
    'purchase.search':'Search purchases','purchase.all':'All','purchase.done':'Done','purchase.wishlist':'Wishlist','purchase.needTiming':'When do you need it?','purchase.wishTiming':'When would you like it?','purchase.noRush':'No rush','purchase.byDate':'Before a certain date','purchase.extraTitle':'Extra information',
    'vault.searchEmpty':'No results found','vault.searchType.task':'Masterlist','vault.searchType.purchase':'Purchases','vault.searchType.idea':'Ideas','vault.searchType.list':'Lists','vault.searchType.bucket':'Bucket list','vault.searchType.project':'Projects','vault.searchType.household':'Household',
    'vault.projects':'Projects','capture.householdSaved':'Household task','capture.bucketSaved':'Bucket-list item'
  });

  const iconNames=['house','car','map-pin','paw-print','package','suitcase-rolling','heart','wrench','plant','briefcase','storefront','currency-eur','file-text','star','confetti','airplane-tilt','bicycle','book-open','music-notes','camera','palette','graduation-cap','barbell','sparkle'];
  let selectedProjectIcon='folder';
  let projectView='active';
  let purchaseQuery='';

  function makeSearch(id,placeholderKey){
    const wrap=document.createElement('div');wrap.className='search-wrap collection-search';
    wrap.innerHTML='<span class="search-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/></svg></span>';
    const input=document.createElement('input');input.id=id;input.type='search';input.placeholder=t(placeholderKey);input.setAttribute('aria-label',t(placeholderKey));wrap.append(input);return wrap;
  }

  function installNavigation(){
    document.querySelector('.nav-button[data-screen="projects"]')?.remove();
    const nav=document.querySelector('.bottom-nav');
    nav?.querySelector('.nav-add-spacer')?.remove();
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

  function cleanCaptureState(){
    captureDraft={};clearActionDraft?.();pendingInboxConversionId=null;editingActionId=null;editingProjectId=null;editingWishlistId=null;editingListId=null;editingIdeaId=null;
    selectedPurchaseType='';purchaseImportance=null;formImportance=null;formImpact=null;formResistance=null;formLoad=null;selectedResistanceReasons=[];activeActionExtras=new Set();
    ['projectOverlay','wishlistOverlay','listOverlay','ideaOverlay','captureTypeOverlay'].forEach(id=>$(id)?.classList.add('hidden'));
    document.querySelectorAll('.disclosure-panel').forEach(panel=>panel.classList.add('hidden'));
  }

  function installCaptureTypes(){
    document.querySelector('[data-capture-type="unknown"]')?.remove();
    const list=document.querySelector('.capture-type-list');
    const labels={wishlist:'capture.purchase',household:'capture.household',bucket:'capture.bucketItem'};
    const wishlistButton=list?.querySelector('[data-capture-type="wishlist"] strong');if(wishlistButton)wishlistButton.textContent=t(labels.wishlist);
    for(const type of ['household','bucket'])if(!list?.querySelector(`[data-capture-type="${type}"]`)){
      const button=document.createElement('button');button.type='button';button.dataset.captureType=type;button.innerHTML=`<strong>${t(labels[type])}</strong>`;list.append(button);
    }
    const baseOpenUniversal=openUniversalCapture;
    openUniversalCapture=function(){cleanCaptureState();baseOpenUniversal()};
    const baseOpenCaptured=openCapturedType;
    openCapturedType=function(type){
      const text=$('universalCaptureText').value.trim();
      if(type==='household'){close('captureTypeOverlay');openAction();$('actionTitle').value=text;activeActionExtras.add('repeat');setDisclosure('repeat',true);setTaskContextVisible(true);updateActionExtraSummaries();return}
      if(type==='bucket'){close('captureTypeOverlay');const group=bucketlist.find(g=>g.name==='Ooit')||bucketlist[0];if(group&&text){group.items.push({id:uid(),text,done:false,createdAt:Date.now()});saveBucketlist();lumiSuccess();showScreen('bucketlist')}return}
      baseOpenCaptured(type);
    };
    list?.querySelectorAll('[data-capture-type]').forEach(button=>button.onclick=()=>openCapturedType(button.dataset.captureType));
  }

  function installTaskPolish(){
    const eyebrow=$('captureEyebrow'),title=$('captureTitle');
    const baseOpenAction=openAction;
    openAction=function(item=null,projectId=''){baseOpenAction(item,projectId);eyebrow.textContent=t('capture.taskEyebrow');title.textContent=t('capture.extraTitle')};
    const baseSummaries=updateActionExtraSummaries;
    updateActionExtraSummaries=function(){baseSummaries();
      const project=projects.find(p=>p.id===$('actionProject').value),note=$('actionNote').value.trim();
      if(activeActionExtras.has('duration'))$('durationSummary').textContent=durationLabel($('duration').value).replace('Ongeveer ','');
      if($('deadlineDate').value)$('deadlineSummary').textContent=formatDateLong($('deadlineDate').value);
      if(project)$('projectSummary').textContent=project.title;
      if(activeActionExtras.has('repeat'))$('repeatSummary').textContent=repeatLabel();
      if(note)$('noteSummary').textContent=note.length>58?note.slice(0,58)+'…':note;
    };
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
    const baseOpenProject=openProject;
    openProject=function(project=null){baseOpenProject(project);selectedProjectIcon=project?.icon||'folder';picker.querySelectorAll('button').forEach(b=>b.classList.toggle('selected',b.dataset.projectIcon===selectedProjectIcon))};
    $('saveProjectButton').onclick=()=>{if(!requireField($('projectName')))return;const isNew=!editingProjectId,title=$('projectName').value.trim(),existing=projects.find(p=>p.id===editingProjectId);if(existing)Object.assign(existing,{title,color:selectedColor,icon:selectedProjectIcon});else projects.push({id:uid(),title,color:selectedColor,icon:selectedProjectIcon,archived:false,order:projects.length,createdAt:Date.now()});saveProjects();finishInboxConversion();close('projectOverlay');refresh();if(isNew)lumiSuccess()};
    projectCard=function(project,draggable){const card=document.createElement('div');card.className=`project-card project-${project.color}`;card.dataset.id=project.id;const main=document.createElement('button');main.className='project-card-main';main.innerHTML=`<span class="project-card-icon"><i class="ph ph-${project.icon||'folder'}"></i></span><h3></h3><small>${project.archived?t('project.completed'):t('project.active')}</small>`;main.querySelector('h3').textContent=project.title;main.onclick=()=>showProjectDetail(project.id);card.append(main);if(draggable)wireDrag(card,'projects');card.append(moreButton(()=>projectMenu(project)));return card};
    projectMenu=function(project){if(!project)return;menu([{label:t('menu.edit'),run:()=>openProject(project)},{label:project.archived?t('project.reopen'):t('project.archive'),run:()=>{project.archived=!project.archived;saveProjects();renderProjects()}},{label:t('menu.delete'),danger:true,run:()=>confirmRemoval(()=>{projects=projects.filter(x=>x.id!==project.id);actions.forEach(a=>{if(a.projectId===project.id)a.projectId=''});saveProjects();saveActions();showScreen('projects')})}])};
  }

  function installProjectTabs(){
    const tabs=document.querySelectorAll('.project-tabs button');if(tabs.length<2)return;
    tabs[0].textContent=t('project.active');tabs[1].textContent=t('project.completed');tabs[1].disabled=false;
    tabs.forEach((button,index)=>button.onclick=()=>{projectView=index?'completed':'active';tabs.forEach(x=>x.classList.toggle('active',x===button));renderProjects()});
    renderProjects=function(){const box=$('projectsList');box.innerHTML='';const archived=projectView==='completed',visible=projects.filter(p=>!!p.archived===archived).sort((a,b)=>a.order-b.order);if(!visible.length)return empty(box,archived?t('project.completed'):t('project.active'),'',archived?undefined:()=>openProject());visible.forEach(p=>box.append(projectCard(p,true)))};
  }

  function installPurchaseSearch(){
    if($('purchaseSearch'))return;const search=makeSearch('purchaseSearch','purchase.search');document.querySelector('.purchase-tools')?.before(search);search.querySelector('input').oninput=e=>{purchaseQuery=e.target.value.trim().toLowerCase();if(purchaseQuery){purchaseFilter='all';wishlistFilter='open'}renderWishlist()};
    purchaseFilter='need';wishlistFilter='open';
    const filter=$('purchaseTypeFilters');const order=[filter.querySelector('[data-purchase-filter="need"]'),filter.querySelector('[data-purchase-filter="wish"]'),filter.querySelector('[data-purchase-filter="all"]'),filter.querySelector('[data-wishlist-unified="done"]')];order.forEach(b=>b&&filter.append(b));
    order[0].textContent=t('purchase.need');order[1].textContent=t('purchase.wishlist');order[2].textContent=t('purchase.all');order[3].textContent=t('purchase.done');
    const baseRender=renderWishlist;
    renderWishlist=function(){baseRender();if(purchaseQuery)document.querySelectorAll('#wishlistList .wishlist-card').forEach(card=>card.classList.toggle('hidden',!card.textContent.toLowerCase().includes(purchaseQuery)))};
  }

  function installPurchaseForm(){
    const typeWish=document.querySelector('[data-purchase-type="wish"]');if(typeWish)typeWish.textContent=t('purchase.wishlist');
    const extra=document.querySelector('#wishlistOverlay .wishlist-options');if(extra&&!extra.previousElementSibling?.classList.contains('purchase-extra-heading')){const heading=document.createElement('button');heading.type='button';heading.className='purchase-extra-heading';heading.textContent=t('purchase.extraTitle');heading.setAttribute('aria-expanded','false');heading.onclick=()=>{const open=extra.classList.toggle('purchase-options-open');heading.setAttribute('aria-expanded',String(open))};extra.before(heading)}
    const baseOpen=openWishlist;
    openWishlist=function(item=null){baseOpen(item);document.querySelector('[data-purchase-type="wish"]').textContent=t('purchase.wishlist');document.querySelector('.wishlist-options')?.classList.remove('purchase-options-open');document.querySelector('.purchase-extra-heading')?.setAttribute('aria-expanded','false');syncPurchaseTiming()};
    function syncPurchaseTiming(){const question=document.querySelectorAll('.purchase-question')[1],buttons=[...document.querySelectorAll('[data-purchase-importance]')];if(!question)return;question.textContent=t(selectedPurchaseType==='wish'?'purchase.wishTiming':'purchase.needTiming');
      const keys=selectedPurchaseType==='wish'?['purchase.noRush','purchase.byDate']:['purchase.canWait','purchase.soon','purchase.now','purchase.byDate'];
      buttons.forEach((button,index)=>{const visible=selectedPurchaseType==='wish'?(index===0||index===3):true;button.classList.toggle('hidden',!visible);button.textContent=t(keys[selectedPurchaseType==='wish'?(index===0?0:1):index])});
      if(selectedPurchaseType==='wish'&&![1,4].includes(purchaseImportance))purchaseImportance=null;
      toggleWishlistField('wishlistHasDeadline','wishlistDeadlineFields',purchaseImportance===4||$('wishlistHasDeadline').checked&&!!$('wishlistDeadline').value);
    }
    document.querySelectorAll('[data-purchase-type]').forEach(button=>button.addEventListener('click',()=>{selectedPurchaseType=button.dataset.purchaseType;syncPurchaseTiming()}));
    document.querySelectorAll('[data-purchase-importance]').forEach(button=>button.addEventListener('click',()=>{purchaseImportance=+button.dataset.purchaseImportance;if(purchaseImportance===4)toggleWishlistField('wishlistHasDeadline','wishlistDeadlineFields',true);else if(!$('wishlistDeadline').value)toggleWishlistField('wishlistHasDeadline','wishlistDeadlineFields',false)}));
  }

  function addUrgentPurchaseToHome(){
    const today=todayKey(),days=date=>Math.ceil((new Date(date+'T12:00')-new Date(today+'T12:00'))/864e5);
    const urgent=wishlist.filter(w=>!w.bought&&((w.purchaseType==='need'&&w.importance>=3)||(w.deadline?.enabled&&days(w.deadline.date)<=3))).sort((a,b)=>(b.importance||0)-(a.importance||0))[0];
    if(!urgent||document.querySelector(`[data-purchase-suggestion="${urgent.id}"]`))return;
    const card=document.createElement('article');card.className='suggestion-card purchase-suggestion';card.dataset.purchaseSuggestion=urgent.id;card.innerHTML=`<span class="purchase-suggestion-icon"><i class="ph ph-shopping-bag"></i></span><div class="suggestion-content"><strong></strong><small>${t('vault.searchType.purchase')} · ${urgent.purchaseType==='need'?t('purchase.need'):t('purchase.wishlist')}</small></div>`;card.querySelector('strong').textContent=urgent.name;card.onclick=()=>openWishlistDetail(urgent);$('suggestionList')?.append(card);
  }

  function installHomePurchase(){const base=renderHome;renderHome=function(){base();addUrgentPurchaseToHome();document.querySelector('.projects-preview')?.classList.add('hidden');document.querySelectorAll('#homeScreen button').forEach(button=>{if(button.textContent.includes('Nog uitzoeken'))button.remove()})}};
  function installLocaleDates(){formatDate=function(iso){return new Date(iso+'T12:00').toLocaleDateString(lumiLocale()==='en'?'en-GB':'nl-NL',{day:'numeric',month:'long',year:'numeric'})}};

  function searchEntries(){
    const entries=[];const push=(title,meta,open,search=title)=>entries.push({title,meta,open,search:(search+' '+meta).toLowerCase()});
    actions.forEach(item=>push(item.title,item.repeat?.enabled?t('vault.searchType.household'):t('vault.searchType.task'),()=>{showScreen('masterlist');openTaskDetail(item)},`${item.title} ${item.note||''}`));
    wishlist.forEach(item=>push(item.name,`${t('vault.searchType.purchase')} · ${item.purchaseType==='need'?t('purchase.need'):t('purchase.wishlist')}`,()=>{showScreen('wishlist');openWishlistDetail(item)},`${item.name} ${item.note||''} ${item.link||''}`));
    ideas.forEach(item=>push(item.text,t('vault.searchType.idea'),()=>{showScreen('ideas');openIdea(item)},`${item.text} ${item.note||''}`));
    lists.forEach(list=>{push(list.name,t('vault.searchType.list'),()=>showListDetail(list.id));(list.items||[]).forEach(item=>push(item.text,`${t('vault.searchType.list')} · ${list.name}`,()=>showListDetail(list.id),item.text))});
    bucketlist.forEach(group=>(group.items||[]).forEach(item=>push(item.text,`${t('vault.searchType.bucket')} · ${group.name}`,()=>showScreen('bucketlist'),item.text)));
    projects.forEach(project=>push(project.title,`${t('vault.searchType.project')} · ${project.archived?t('project.completed'):t('project.active')}`,()=>showProjectDetail(project.id),project.title));return entries;
  }

  function installVaultSearch(){
    const input=$('vaultVisualSearch');if(!input)return;const results=document.createElement('div');results.id='vaultSearchResults';results.className='vault-search-results hidden';input.closest('.vault-search-shell').after(results);
    input.oninput=()=>{const q=input.value.trim().toLowerCase();results.innerHTML='';results.classList.toggle('hidden',!q);document.querySelector('#vaultScreen .module-grid').classList.toggle('searching',!!q);document.querySelector('#vaultScreen .vault-section-title').classList.toggle('hidden',!!q);if(!q)return;const matches=searchEntries().filter(entry=>entry.search.includes(q)).slice(0,30);if(!matches.length){results.innerHTML=`<p class="search-empty">${t('vault.searchEmpty')}</p>`;return}matches.forEach(entry=>{const button=document.createElement('button');button.type='button';button.className='vault-search-result';button.innerHTML='<strong></strong><small></small><span aria-hidden="true">›</span>';button.querySelector('strong').textContent=entry.title;button.querySelector('small').textContent=entry.meta;button.onclick=()=>{input.value='';results.classList.add('hidden');document.querySelector('#vaultScreen .module-grid').classList.remove('searching');entry.open()};results.append(button)})};
  }

  installNavigation();installVaultProjects();installCaptureTypes();installTaskPolish();installProjectIcons();installProjectTabs();installPurchaseSearch();installPurchaseForm();installHomePurchase();installVaultSearch();installLocaleDates();
  const flowObserver=new MutationObserver(syncFlowChrome);document.querySelectorAll('.overlay,.screen').forEach(node=>flowObserver.observe(node,{attributes:true,attributeFilter:['class']}));syncFlowChrome();
  const baseShow=showScreen;showScreen=function(name){baseShow(name);syncFlowChrome()};
  applyI18n();renderProjects();renderWishlist();renderHome();
})();
