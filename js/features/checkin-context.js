/* Mobile recovery: preserve stored data, session check-ins and explainable recommendations. */
const vaultScreens=new Set(['vault','wishlist','lists','listDetail','ideas','inbox','finance','documents']);
const mainNavContext={projectDetail:'projects'};
function navContextFor(screen){return vaultScreens.has(screen)?'vault':(mainNavContext[screen]||screen)}
const recoveredShowScreen=showScreen;
showScreen=function(name){recoveredShowScreen(name);const context=navContextFor(name);document.querySelectorAll('.nav-button').forEach(button=>button.classList.toggle('active',button.dataset.screen===context));syncVdsNavIcons()};

lists=lists.map((list,index)=>{const normalized=normalizeList(list,index),known=new Set(normalized.sublists);normalized.items.forEach(item=>{if(!known.has(item.sublist)){normalized.sublists.push(item.sublist);known.add(item.sublist)}});if(!known.has('main'))normalized.sublists.unshift('main');return normalized});
saveLists();

function dayLoad(){return checkin.date===todayKey()?Math.max(0,Math.min(3,Number(checkin.dayLoad??checkin.eventImpact)||0)):0}
function taskRecommendation(item){return recommendationEngine.profile(item,{checkin,dayLoad:dayLoad()})}
recommendationProfile=taskRecommendation;
suggestions=function(){const all=actions.filter(item=>!item.done).map(item=>({item,profile:taskRecommendation(item)})).filter(entry=>entry.profile.eligible).sort((a,b)=>b.profile.score-a.profile.score||b.profile.priority-a.profile.priority||a.item.order-b.item.order),best=all.find(entry=>!entry.profile.lowPriorityHeavy)?.profile.score??all[0]?.profile.score??-999;return all.filter(entry=>!homeSwappedIds.has(entry.item.id)&&!entry.profile.lowPriorityHeavy&&entry.profile.score>=best-16).map(entry=>entry.item)};

function setCheckinStep(step){$('energyOverlay').dataset.step=String(step);energyCard.querySelector('.energy-grid').classList.toggle('hidden',step!==1);energyCard.querySelector('.checkin-day-load').classList.toggle('hidden',step!==2);$('checkinNextButton').classList.toggle('hidden',step!==1);$('saveCheckinButton').classList.toggle('hidden',step!==2)}
const oldPlanning=energyCard.querySelector('.checkin-planning');oldPlanning.classList.add('hidden');$('checkinEventFields').classList.add('hidden');
const dayLoadPanel=document.createElement('section');dayLoadPanel.className='checkin-day-load hidden';dayLoadPanel.innerHTML='<h3>Staat er vandaag nog iets gepland dat energie vraagt?</h3><p>Kies wat het beste past. Je hoeft niets uit te leggen.</p><div class="day-load-grid"><button type="button" data-day-load="0">Niets noemenswaardigs</button><button type="button" data-day-load="1">Iets lichts</button><button type="button" data-day-load="2">Redelijk belastend</button><button type="button" data-day-load="3">Iets zwaars</button></div>';
energyCard.querySelector('.energy-grid').after(dayLoadPanel);
const nextButton=document.createElement('button');nextButton.id='checkinNextButton';nextButton.type='button';nextButton.className='primary-button big-button modal-save';nextButton.textContent='Verder';$('saveCheckinButton').before(nextButton);
nextButton.onclick=()=>{if(pendingEnergy)setCheckinStep(2)};
document.querySelectorAll('[data-day-load]').forEach(button=>button.onclick=()=>{pendingEventImpact=+button.dataset.dayLoad;document.querySelectorAll('[data-day-load]').forEach(other=>other.classList.toggle('selected',other===button))});
openCheckin=function(){const isToday=checkin.date===todayKey();pendingEnergy=isToday?Number(checkin.energy):null;pendingEventImpact=isToday?dayLoad():0;document.querySelectorAll('.energy-choice').forEach(button=>button.classList.toggle('selected',+button.dataset.energy===pendingEnergy));document.querySelectorAll('[data-day-load]').forEach(button=>button.classList.toggle('selected',+button.dataset.dayLoad===pendingEventImpact));setCheckinStep(1);open('energyOverlay')};
if($('settingsEnergyButton'))$('settingsEnergyButton').onclick=openCheckin;$('homeCheckinButton').onclick=openCheckin;$('todayEnergy').onclick=openCheckin;
$('saveCheckinButton').onclick=()=>{if(!pendingEnergy)return;energy=pendingEnergy;checkin={date:todayKey(),energy,dayLoad:pendingEventImpact,updatedAt:Date.now()};write(KEYS.energy,energy);write(KEYS.checkin,checkin);sessionStorage.setItem('lumiCheckinOffered',todayKey());close('energyOverlay');renderHome();renderSettings()};

function saveRecoveredSublist(){const list=lists.find(item=>item.id===currentListId);if(!list||!requireField($('sublistName')))return;const clean=$('sublistName').value.trim(),old=editingSublistName;list.sublistColors=list.sublistColors||{};if(old){if(clean!==old&&list.sublists.includes(clean))return toast('Deze naam bestaat al','Kies een andere naam.');list.sublists=list.sublists.map(name=>name===old?clean:name);list.items.forEach(item=>{if(item.sublist===old)item.sublist=clean});if(old!==clean)delete list.sublistColors[old]}else if(list.sublists.includes(clean))return toast('Deze naam bestaat al','Kies een andere naam.');else list.sublists.push(clean);if(selectedSublistColor)list.sublistColors[clean]=selectedSublistColor;else delete list.sublistColors[clean];editingSublistName=null;saveLists();close('sublistOverlay');renderListDetail()}
$('saveSublistButton').onclick=saveRecoveredSublist;

document.addEventListener('dragstart',event=>{if(event.target.closest('.task-row,.suggestion-card'))event.preventDefault()});
wireDrag=function(element,scope,handle=element){
  let timer=null,active=false,startX=0,startY=0,targetId='',justDragged=false,pointerId=null;
  element.classList.add('draggable-item');
  const blocked=event=>event.target.closest('.check,.more-button,.column-menu,input,a,textarea,select');
  const cancel=()=>{clearTimeout(timer);timer=null;if(active){active=false;drag=null;targetId='';element.classList.remove('dragging');if(pointerId!=null)handle.releasePointerCapture?.(pointerId)}pointerId=null};
  handle.addEventListener('pointerdown',event=>{if(event.pointerType==='mouse'||blocked(event))return;startX=event.clientX;startY=event.clientY;pointerId=event.pointerId;timer=setTimeout(()=>{active=true;drag={id:element.dataset.id,scope};element.classList.add('dragging');handle.setPointerCapture?.(event.pointerId);navigator.vibrate?.(18)},420)});
  handle.addEventListener('pointermove',event=>{if(event.pointerType==='mouse')return;const distance=Math.hypot(event.clientX-startX,event.clientY-startY);if(!active){if(distance>8)cancel();return}event.preventDefault();const target=document.elementFromPoint(event.clientX,event.clientY)?.closest('[data-id]');if(target?.dataset.id&&target.dataset.id!==element.dataset.id)targetId=target.dataset.id});
  const finish=()=>{clearTimeout(timer);if(active){justDragged=true;if(targetId)reorder(scope,element.dataset.id,targetId);setTimeout(()=>justDragged=false,0)}cancel()};
  handle.addEventListener('pointerup',finish);handle.addEventListener('pointercancel',cancel);
  element.addEventListener('click',event=>{if(justDragged){event.preventDefault();event.stopImmediatePropagation()}},true);
  handle.onmousedown=event=>{if(blocked(event))return;startX=event.clientX;startY=event.clientY;const move=moveEvent=>{if(!active&&Math.hypot(moveEvent.clientX-startX,moveEvent.clientY-startY)>7){active=true;drag={id:element.dataset.id,scope};element.classList.add('dragging')}if(!active)return;const target=document.elementFromPoint(moveEvent.clientX,moveEvent.clientY)?.closest('[data-id]');if(target?.dataset.id&&target.dataset.id!==element.dataset.id)targetId=target.dataset.id},up=()=>{document.removeEventListener('mousemove',move);document.removeEventListener('mouseup',up);finish()};document.addEventListener('mousemove',move);document.addEventListener('mouseup',up)};
};
