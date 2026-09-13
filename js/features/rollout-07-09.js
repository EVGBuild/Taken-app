/* Rollout 07-09: recurrence completion, household separation and mobile core UX. */
(function installRollout0709(){
  const baseRenderHome=renderHome;
  renderHome=function(){
    baseRenderHome();
    const current=checkin.date===todayKey()?Number(checkin.energy)||null:null;
    const labels=['','Heel weinig energie','Weinig energie','Redelijke energie','Best veel energie','Veel energie'];
    const card=$('todayContext'),title=card.querySelector('.checkin-title'),subtitle=card.querySelector('.checkin-subtitle');
    title.textContent=current?'Jouw energie':'Hoe is je energie?';
    subtitle.textContent=current?labels[current]:'Geef aan hoeveel ruimte je hebt.';
    card.querySelectorAll('.battery-bar').forEach((bar,index)=>bar.classList.toggle('filled',!!current&&index<current));
    $('todayEnergy').innerHTML=current?`<span class="energy-battery level-${current}" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span>`:'<b>Nog niet ingevuld</b>';
    $('todayAdjustButton').setAttribute('aria-label',current?'Energie wijzigen':'Energie aangeven');
  };

  checkButton=function(item,row){
    const button=document.createElement('button');
    button.className='check'+(item.done?' checked':'');
    button.textContent=item.done?'✓':'';
    button.onclick=()=>{
      if(item.done){item.done=false;saveActions();refresh();return}
      button.disabled=true;button.classList.add('checked');button.textContent='✓';row.classList.add('finishing');
      setTimeout(()=>complete(item),360);
    };
    return button;
  };

  complete=function(item){
    const before=clone(item),completed=completeTaskOccurrence(item,{completedDate:todayKey()});
    Object.assign(item,completed);saveActions();undo={kind:'action',before};
    toast('Afgerond ✓',item.title,'Ongedaan maken',()=>{const index=actions.findIndex(entry=>entry.id===before.id);if(index>=0)actions[index]=before;saveActions();refresh()});
    refresh();
  };

  renderMasterlist=function(){
    const query=$('masterSearch').value.trim().toLowerCase();
    const visible=actions.filter(item=>{
      if(normalizeRecurrence(item).enabled)return false;
      const relevance=getTaskRelevance(item,{today:todayKey()}),state=item.done?'done':relevance.state;
      return state===masterFilter&&item.title.toLowerCase().includes(query);
    }).sort((a,b)=>a.order-b.order);
    const list=$('masterlistList');list.innerHTML='';
    if(!visible.length){
      if(query)return empty(list,'Geen taken gevonden','Pas je zoekopdracht aan');
      const labels={done:['Nog niets afgerond','Afgeronde taken verschijnen hier'],waiting:['Niets staat te wachten','Taken die van iets of iemand anders afhangen verschijnen hier'],later:['Niets voor later','Uitgestelde taken verschijnen hier'],open:['Nog geen taken','Voeg een taak toe']},copy=labels[masterFilter]||labels.open;
      return empty(list,copy[0],copy[1],masterFilter==='open'?()=>openAction():undefined);
    }
    visible.forEach(item=>list.append(taskRow(item,masterFilter==='open'&&!query,'actions')));
  };

  const nav=document.querySelector('.bottom-nav');
  if(nav&&!nav.querySelector('.nav-add-spacer')){
    const spacer=document.createElement('span');spacer.className='nav-add-spacer';spacer.setAttribute('aria-hidden','true');
    nav.querySelector('[data-screen="vault"]')?.before(spacer);
  }
  $('globalAddButton').setAttribute('aria-label','Orb openen');
  $('globalAddButton').innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';
  $('homeSettingsButton').onclick=()=>showScreen('settings');
  renderHome();
})();
