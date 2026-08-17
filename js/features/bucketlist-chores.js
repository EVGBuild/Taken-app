/* Bucketlist + Klusjes: two focused Vault views, without duplicating task data. */
function renderBucketlist(){
  const box=$('bucketlistGroups');box.innerHTML='';
  bucketlist.forEach(group=>{
    const section=document.createElement('section');section.className='bucket-group';
    const head=document.createElement('header');head.innerHTML='<h2></h2><button class="more-button" type="button">•••</button>';head.querySelector('h2').textContent=group.name;
    head.querySelector('button').onclick=()=>menu([{label:'Hernoemen',run:()=>{const name=prompt('Naam van de lijst',group.name)?.trim();if(name){group.name=name;saveBucketlist();renderBucketlist()}}},{label:'Verwijderen',danger:true,run:()=>{bucketlist=bucketlist.filter(x=>x.id!==group.id);saveBucketlist();renderBucketlist()}}]);
    const list=document.createElement('div');list.className='bucket-items';
    group.items.forEach(item=>{const row=document.createElement('div');row.className='bucket-item'+(item.done?' done':'');const check=document.createElement('button');check.className='check'+(item.done?' checked':'');check.textContent=item.done?'✓':'';check.onclick=()=>{item.done=!item.done;saveBucketlist();renderBucketlist()};const text=document.createElement('span');text.textContent=item.text;const more=moreButton(()=>menu([{label:'Bewerken',run:()=>{const text=prompt('Bucketlist-item',item.text)?.trim();if(text){item.text=text;saveBucketlist();renderBucketlist()}}},{label:'Verwijderen',danger:true,run:()=>{group.items=group.items.filter(x=>x.id!==item.id);saveBucketlist();renderBucketlist()}}]));row.append(check,text,more);list.append(row)});
    if(!group.items.length){const hint=document.createElement('p');hint.className='bucket-hint';hint.textContent=group.name==='Eten & proberen'?'Bijv. kreeft eten, een workshop volgen of iets nieuws proberen.':'Nog niets toegevoegd.';list.append(hint)}
    const add=document.createElement('button');add.className='bucket-add';add.type='button';add.textContent='+ Item toevoegen';add.onclick=()=>{const text=prompt(`Toevoegen aan ${group.name}`)?.trim();if(!text)return;group.items.push({id:uid(),text,done:false,createdAt:Date.now()});saveBucketlist();renderBucketlist();lumiSuccess()};
    section.append(head,list,add);box.append(section)
  });
}
$('addBucketGroupButton').onclick=()=>{const name=prompt('Naam van de nieuwe bucketlist')?.trim();if(!name)return;bucketlist.push({id:uid(),name,items:[]});saveBucketlist();renderBucketlist()};

function renderChores(){
  const box=$('choresList');box.innerHTML='';const chores=actions.filter(item=>item.repeat?.enabled&&!item.done).sort((a,b)=>(a.repeat?.nextDue||'9999').localeCompare(b.repeat?.nextDue||'9999'));
  if(!chores.length){const e=empty(box,'Nog geen klusjes','Voeg een terugkerende taak toe, zoals bed verschonen of ramen wassen.',()=>openNewChore());e.classList.add('clickable-empty');return}
  chores.forEach(item=>{const row=document.createElement('article');row.className='vault-item chore-item';const last=item.repeat?.lastDone,meta=[recurrenceLabel(item.repeat),last?'Laatst gedaan '+formatDate(last):'Nog geen laatste keer ingevuld'];row.innerHTML='<div><strong></strong><small></small></div>';row.querySelector('strong').textContent=item.title;row.querySelector('small').textContent=meta.join(' · ');row.onclick=e=>{if(!e.target.closest('.more-button'))openTaskDetail(item)};row.append(moreButton(()=>actionMenu(item)));box.append(row)})
}
function openNewChore(){openAction();activeActionExtras.add('repeat');setDisclosure('repeat',true);updateActionExtraSummaries();$('actionTitle').focus()}
$('addChoreButton').onclick=openNewChore;
