/** Simple, persisted 1–5 energy check-in. Legacy fields remain readable but are not written. */
let openCheckin;
function normalizeEnergyLevel(value){const level=Number(value);return Number.isInteger(level)&&level>=1&&level<=5?level:null}
function setupCheckinFeature({$,energyCard,todayKey,getCheckin,getPendingEnergy,setPendingEnergy,setEnergy,setCheckin,write,keys,open,close,renderHome,renderSettings,lumiSuccess}){
  energyCard.querySelector('.eyebrow').textContent=t('energy.eyebrow');
  energyCard.querySelector('h2').textContent=t('energy.question');
  energyCard.querySelector('.modal-copy').textContent=t('energy.help');
  [1,2,3,4,5].forEach(value=>{const label=document.querySelector(`.energy-choice[data-energy="${value}"] small`);if(label)label.textContent=t(`energy.level.${value}`)});
  energyCard.querySelector('.checkin-planning')?.remove();$('checkinEventFields')?.remove();energyCard.querySelector('.checkin-day-load')?.remove();$('checkinNextButton')?.remove();
  function openEnergyCheckin(){const saved=getCheckin(),pending=saved.date===todayKey()?normalizeEnergyLevel(saved.energy):null;setPendingEnergy(pending);document.querySelectorAll('.energy-choice').forEach(button=>button.classList.toggle('selected',+button.dataset.energy===pending));$('saveCheckinButton').classList.remove('hidden');open('energyOverlay')}
  function saveCheckin(){const pending=getPendingEnergy();if(!pending)return;const current=getCheckin(),next={date:todayKey(),energy:pending,updatedAt:Date.now()};if(current&&typeof current==='object'&&current.calendarLoads)next.calendarLoads=current.calendarLoads;setEnergy(pending);setCheckin(next);write(keys.energy,pending);write(keys.checkin,next);close('energyOverlay');renderHome();renderSettings();lumiSuccess()}
  document.querySelectorAll('.energy-choice').forEach(button=>button.onclick=()=>{setPendingEnergy(+button.dataset.energy);document.querySelectorAll('.energy-choice').forEach(other=>other.classList.toggle('selected',other===button))});
  $('saveCheckinButton').onclick=saveCheckin;return{openCheckin:openEnergyCheckin,saveCheckin};
}
