let activeRawCaptureId=null;

function persistRawCapture(text){
  const rawText=String(text??'');
  if(!rawText.length)return null;
  const records=read(CAPTURE_KEYS.raw,[]);
  const now=Date.now();
  if(!activeRawCaptureId)activeRawCaptureId=uid();
  const index=records.findIndex(record=>record.id===activeRawCaptureId);
  const previous=index>=0?records[index]:null;
  const record={
    id:activeRawCaptureId,
    rawText,
    source:'user',
    status:previous?.status||'raw',
    selectedType:previous?.selectedType??null,
    createdAt:previous?.createdAt||now,
    updatedAt:now
  };
  if(index>=0)records[index]=record;else records.push(record);
  write(CAPTURE_KEYS.raw,records);
  return record;
}

function classifyRawCapture(type){
  const rawText=$('universalCaptureText').value;
  const current=persistRawCapture(rawText);
  if(!current)return null;
  const records=read(CAPTURE_KEYS.raw,[]);
  const index=records.findIndex(record=>record.id===current.id);
  if(index<0)return current;
  records[index]={...records[index],status:type==='unknown'?'unresolved':'classified',selectedType:type,classifiedAt:Date.now(),updatedAt:Date.now()};
  write(CAPTURE_KEYS.raw,records);
  return records[index];
}

function openUniversalCapture(){captureDraft={};if(typeof clearActionDraft==='function')clearActionDraft();activeRawCaptureId=uid();pendingInboxConversionId=null;editingActionId=null;editingProjectId=null;editingWishlistId=null;editingListId=null;editingIdeaId=null;selectedPurchaseType='';purchaseImportance=null;formImportance=null;formImpact=null;formResistance=null;formLoad=null;selectedResistanceReasons=[];activeActionExtras=new Set();$('universalCaptureText').value='';open('universalCaptureOverlay');setTimeout(()=>$('universalCaptureText').focus(),50)}
$('universalCaptureText').addEventListener('input',()=>persistRawCapture($('universalCaptureText').value));
$('universalCaptureForm').onsubmit=e=>{e.preventDefault();if(!requireField($('universalCaptureText')))return;persistRawCapture($('universalCaptureText').value);close('universalCaptureOverlay');open('captureTypeOverlay')};
$('captureTypeBack').onclick=()=>{close('captureTypeOverlay');open('universalCaptureOverlay');setTimeout(()=>$('universalCaptureText').focus(),50)};
function openCapturedType(type){const text=$('universalCaptureText').value.trim();const raw=classifyRawCapture(type);close('captureTypeOverlay');if(type==='unknown'){if(text){const item={id:uid(),text,order:inbox.length,createdAt:Date.now(),rawCaptureId:raw?.id||activeRawCaptureId};inbox.push(item);saveInbox();lumiSuccess();showScreen('inbox')}activeRawCaptureId=null;return}if(type==='task'){openAction();$('actionTitle').value=text}else if(type==='household'){openAction(null,'','household');$('actionTitle').value=text;activeActionExtras.add('repeat');setDisclosure('repeat',true);setTaskContextVisible(true);updateActionExtraSummaries()}else if(type==='bucket'){const group=bucketlist.find(entry=>entry.name===t('bucket.defaults.someday'))||bucketlist[0];if(group&&text){group.items.push({id:uid(),text,done:false,createdAt:Date.now(),rawCaptureId:raw?.id||activeRawCaptureId});saveBucketlist();lumiSuccess();showScreen('bucketlist')}}else if(type==='project'){openProject();$('projectName').value=text}else if(type==='idea'){openIdea();$('ideaText').value=text}else if(type==='wishlist'){openWishlist();$('wishlistName').value=text}else if(type==='list'){openList();$('listName').value=text}}
document.querySelectorAll('[data-capture-type]').forEach(b=>b.onclick=()=>openCapturedType(b.dataset.captureType));
