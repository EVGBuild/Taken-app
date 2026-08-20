/* Rollout 4: simplified capacity check-in, durable task drafts, and expanded Vault. */
const checkinFeature=setupCheckinFeature({
  $,
  energyCard,
  todayKey,
  getCheckin:()=>checkin,
  getPendingEnergy:()=>pendingEnergy,
  setPendingEnergy:value=>{pendingEnergy=value},
  setEnergy:value=>{energy=value},
  setCheckin:value=>{checkin=value},
  write,
  keys:KEYS,
  open,
  close,
  renderHome:()=>renderHome(),
  renderSettings:()=>renderSettings(),
  lumiSuccess
});
openCheckin=checkinFeature.openCheckin;
if($('settingsEnergyButton'))$('settingsEnergyButton').onclick=openCheckin;
$('homeCheckinButton').onclick=openCheckin;
$('adjustCheckinButton').onclick=openCheckin;

function recommendationSets(){return recommendationEngine.sets(actions,{checkin,dayLoad:dayLoad(),swappedIds:homeSwappedIds,orderIndex:todayOrderIndex,broaden:broadenToday})}
suggestions=function(){return recommendationSets().visible.map(entry=>entry.item)};
renderHome=function(){renderHomeScreen({$,sets:recommendationSets(),checkin,todayKey,suggestionCard,openCheckin,renderProjectPreview,broaden:broadenToday})};
$('broadenSuggestionsButton').onclick=()=>{const before=recommendationSets().visible.length,extra=recommendationSets().extra.length;if(!extra)return renderHome();broadenToday=true;homeSwappedIds.clear();renderHome();if(recommendationSets().visible.length>before)showTodayFeedback('Je ziet nu bewust ook opties die wat meer kunnen vragen.')};

function collectActionDraft(){return{editingId:editingActionId,title:$('actionTitle').value,importance:formImportance,impact:formImpact,resistance:formResistance,load:formLoad,reasons:selectedResistanceReasons.slice(),extras:[...activeActionExtras],duration:$('duration').value,deadline:$('deadlineDate').value,deadlineText:$('deadlineDateText').value,project:$('actionProject').value,repeatEvery:$('repeatEvery').value,repeatUnit:$('repeatUnit').value,lastDone:$('lastDone').value,note:$('actionNote').value,updatedAt:Date.now()}}
function persistActionDraft(){const draft=collectActionDraft();captureDraft.task=draft;write(KEYS.actionDraft,draft)}
function clearActionDraft(){captureDraft={};localStorage.removeItem(KEYS.actionDraft)}
function restoreActionDraft(draft){if(!draft)return;$('actionTitle').value=draft.title??'';formImportance=draft.importance??null;formImpact=draft.impact??null;formResistance=draft.resistance??null;formLoad=draft.load??null;selectedResistanceReasons=Array.isArray(draft.reasons)?draft.reasons.slice():[];activeActionExtras=new Set(draft.extras||[]);$('duration').value=draft.duration||'';setDeadlineValue(draft.deadline||'');$('deadlineDateText').value=draft.deadlineText||$('deadlineDateText').value;populateProjects();$('actionProject').value=draft.project||'';$('repeatEvery').value=draft.repeatEvery||1;$('repeatUnit').value=draft.repeatUnit||'weeks';$('lastDone').value=draft.lastDone||'';$('actionNote').value=draft.note||'';renderResistanceReasons();[['importanceChoices',formImportance],['impactChoices',formImpact],['resistanceChoices',formResistance],['loadChoices',formLoad]].forEach(([id,value])=>document.querySelectorAll(`#${id} button`).forEach(button=>button.classList.toggle('selected',+button.dataset.value===value)));document.querySelectorAll('[data-disclosure]').forEach(button=>setDisclosure(button.dataset.disclosure,activeActionExtras.has(button.dataset.disclosure)));setTaskContextVisible(!!(formImpact||formResistance||formLoad||activeActionExtras.size));updateActionExtraSummaries();durationGrid.querySelectorAll('button').forEach(button=>button.classList.toggle('selected',button.dataset.duration===$('duration').value))}
const openActionR4=openAction;openAction=function(item=null,projectId=''){openActionR4(item,projectId);const saved=read(KEYS.actionDraft,null);if(saved&&((item&&saved.editingId===item.id)||(!item&&!saved.editingId)))restoreActionDraft(saved);$('captureCloseButton').classList.toggle('capture-save',!!item);$('captureCloseButton').textContent=item?'✓':'×';$('captureCloseButton').setAttribute('aria-label',item?'Wijzigingen opslaan':'Capture sluiten');$('captureCloseButton').onclick=item?()=>requestActionSave():()=>{persistActionDraft();showScreen(previousScreen==='capture'?'home':previousScreen)}};
function requestActionSave(){if(typeof $('actionForm').requestSubmit==='function')$('actionForm').requestSubmit();else $('actionForm').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}))}
document.querySelectorAll('#actionForm input,#actionForm textarea,#actionForm select').forEach(field=>{field.addEventListener('input',persistActionDraft);field.addEventListener('change',persistActionDraft)});document.querySelectorAll('#actionForm button[type="button"]').forEach(button=>button.addEventListener('click',()=>setTimeout(persistActionDraft,0)));
$('captureBackButton').onclick=()=>{persistActionDraft();if(editingActionId)showScreen(detailOrigin==='projectDetail'?'projectDetail':detailOrigin==='masterlist'?'masterlist':'home');else returnToCaptureTypes()};
$('cancelActionButton').onclick=()=>confirmRemoval(()=>{clearActionDraft();pendingInboxConversionId=null;currentProjectId?showProjectDetail(currentProjectId):showScreen('home')},'Wil je dit concept verwijderen?','Concept verwijderen');
const actionSubmitR4=$('actionForm').onsubmit;$('actionForm').onsubmit=event=>{actionSubmitR4(event);if(event.defaultPrevented&&currentScreen!=='capture')clearActionDraft()};

let financeFilter='open',editingFinanceId=null,financeDirection='receive';
