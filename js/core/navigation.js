/* VDS v1 mobile application: scoped navigation icons and living-light motion. */
const vdsNavIcons={home:'house',masterlist:'check-square',vault:'vault',projects:'folder',settings:'gear'};
function syncVdsNavIcons(){document.querySelectorAll('.nav-button').forEach(button=>{const active=button.classList.contains('active'),icon=button.querySelector('span');icon.innerHTML=`<i class="${active?'ph-fill':'ph'} ph-${vdsNavIcons[button.dataset.screen]}" aria-hidden="true"></i>`})}

let ambientLumiTimer=null;
const ambientMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
function clearAmbientLumi(){clearTimeout(ambientLumiTimer);ambientLumiTimer=null;document.querySelector('.lumi--ambient')?.remove()}
function ambientScreenEligible(){return !document.hidden&&!ambientMotion.matches&&['home','vault'].includes(currentScreen)&&!document.querySelector('.overlay:not(.hidden),.menu-overlay:not(.hidden)')}
function findAmbientLumiPosition(){const candidates=currentScreen==='vault'?[[84,24],[12,38],[88,57],[18,69]]:[[88,25],[10,47],[91,64],[14,73]];for(const [x,y] of candidates.sort(()=>Math.random()-.5)){const px=innerWidth*x/100,py=innerHeight*y/100,target=document.elementFromPoint(px,py);if(!target?.closest('button,a,input,select,textarea,.suggestion-card,.task-row,.project-card,.module-card,.today-context,.bottom-nav,.global-add'))return{x,y}}return null}
function scheduleAmbientLumi(){clearTimeout(ambientLumiTimer);ambientLumiTimer=null;if(!ambientScreenEligible())return;ambientLumiTimer=setTimeout(()=>{ambientLumiTimer=null;if(!ambientScreenEligible())return;const position=findAmbientLumiPosition();if(!position){scheduleAmbientLumi();return}const lumi=createLumi({mode:'ambient',...position});ambientLumiTimer=setTimeout(()=>{ambientLumiTimer=null;lumi?.remove();scheduleAmbientLumi()},7600)},45000+Math.random()*50000)}
function syncAmbientLumi(){clearAmbientLumi();scheduleAmbientLumi()}
document.addEventListener('visibilitychange',syncAmbientLumi);
ambientMotion.addEventListener?.('change',syncAmbientLumi);
document.querySelectorAll('.overlay,.menu-overlay').forEach(overlay=>new MutationObserver(syncAmbientLumi).observe(overlay,{attributes:true,attributeFilter:['class']}));

const baseShowScreenVds=showScreen;
showScreen=function(name){baseShowScreenVds(name);syncVdsNavIcons();syncAmbientLumi()};
syncVdsNavIcons();
$('globalAddButton').setAttribute('aria-label','Vastleggen');
scheduleAmbientLumi();
window.addEventListener('load',scheduleAmbientLumi,{once:true});

