/* VDS v1 mobile application: scoped navigation icons, screen routing and living-light motion. */
const vdsNavIcons={home:'house',masterlist:'check-square',vault:'vault',projects:'folder',settings:'gear'};
function syncVdsNavIcons(){document.querySelectorAll('.nav-button').forEach(button=>{const active=button.classList.contains('active'),icon=button.querySelector('span');icon.innerHTML=`<i class="${active?'ph-fill':'ph'} ph-${vdsNavIcons[button.dataset.screen]}" aria-hidden="true"></i>`})}

let ambientLumiTimer=null;
const ambientMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
function clearAmbientLumi(){clearTimeout(ambientLumiTimer);ambientLumiTimer=null;document.querySelector('.lumi--ambient')?.remove()}
function ambientScreenEligible(){return !document.hidden&&!ambientMotion.matches&&currentScreen==='vault'&&!document.querySelector('.overlay:not(.hidden),.menu-overlay:not(.hidden)')}
function findAmbientLumiPosition(){const candidates=currentScreen==='vault'?[[84,24],[12,38],[88,57],[18,69]]:[[88,25],[10,47],[91,64],[14,73]];for(const [x,y] of candidates.sort(()=>Math.random()-.5)){const px=innerWidth*x/100,py=innerHeight*y/100,target=document.elementFromPoint(px,py);if(!target?.closest('button,a,input,select,textarea,.suggestion-card,.task-row,.project-card,.module-card,.today-context,.bottom-nav,.global-add'))return{x,y}}return null}
function scheduleAmbientLumi(){clearTimeout(ambientLumiTimer);ambientLumiTimer=null;if(!ambientScreenEligible())return;ambientLumiTimer=setTimeout(()=>{ambientLumiTimer=null;if(!ambientScreenEligible())return;const position=findAmbientLumiPosition();if(!position){scheduleAmbientLumi();return}const lumi=createLumi({mode:'ambient',...position});ambientLumiTimer=setTimeout(()=>{ambientLumiTimer=null;lumi?.remove();scheduleAmbientLumi()},7600)},45000+Math.random()*50000)}
function syncAmbientLumi(){clearAmbientLumi();scheduleAmbientLumi()}
document.addEventListener('visibilitychange',syncAmbientLumi);
ambientMotion.addEventListener?.('change',syncAmbientLumi);
document.querySelectorAll('.overlay,.menu-overlay').forEach(overlay=>new MutationObserver(syncAmbientLumi).observe(overlay,{attributes:true,attributeFilter:['class']}));

const vaultScreens=new Set(['vault','masterlist','wishlist','lists','listDetail','ideas','bucketlist','chores','inbox','finance','documents']);
function navContextFor(screen){return vaultScreens.has(screen)?'vault':screen}

function showScreen(name){
  previousScreen=currentScreen;
  currentScreen=name;
  document.querySelectorAll('.screen').forEach(screen=>screen.classList.toggle('active',screen.id===name+'Screen'));
  const context=navContextFor(name);
  document.querySelectorAll('.nav-button').forEach(button=>button.classList.toggle('active',button.dataset.screen===context));
  if(name==='home')renderHome();
  if(name==='masterlist')renderMasterlist();
  if(name==='wishlist')renderWishlist();
  if(name==='projects')renderProjects();
  if(name==='lists')renderLists();
  if(name==='ideas')renderIdeas();
  if(name==='bucketlist')renderBucketlist();
  if(name==='chores')renderChores();
  if(name==='inbox')renderInbox();
  if(name==='finance')renderFinance();
  if(name==='documents')renderDocuments();
  if(name==='settings')renderSettings();
  syncVdsNavIcons();
  syncAmbientLumi();
  syncGlobalAdd();
  window.scrollTo(0,0);
}

function wireNavigation(){
  document.querySelectorAll('.nav-button').forEach(button=>button.onclick=()=>{if(currentScreen==='capture')pendingInboxConversionId=null;showScreen(button.dataset.screen)});
  document.querySelectorAll('.vault-back').forEach(button=>button.onclick=()=>showScreen('vault'));
  $('seeProjectsButton').onclick=()=>showScreen('projects');
  $('masterlistModule').onclick=()=>showScreen('masterlist');
  $('masterlistBackButton').onclick=()=>showScreen('vault');
  $('wishlistModule').onclick=()=>showScreen('wishlist');
  $('listsModule').onclick=()=>showScreen('lists');
  $('ideasModule').onclick=()=>showScreen('ideas');
  $('bucketlistModule').onclick=()=>showScreen('bucketlist');
  $('choresModule').onclick=()=>showScreen('chores');
  if($('vaultVisualSearch'))$('vaultVisualSearch').oninput=()=>{const q=$('vaultVisualSearch').value.trim().toLowerCase();document.querySelectorAll('#vaultScreen .module-card').forEach(card=>card.classList.toggle('vault-search-hidden',!!q&&!card.textContent.toLowerCase().includes(q)))};
}

wireNavigation();
syncVdsNavIcons();
$('globalAddButton').setAttribute('aria-label','Vastleggen');
$('globalAddButton').innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';
scheduleAmbientLumi();
window.addEventListener('load',scheduleAmbientLumi,{once:true});
