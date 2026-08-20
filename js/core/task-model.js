const TASK_STATES=Object.freeze({OPEN:'open',WAITING:'waiting',LATER:'later',COMPLETED:'completed'});
function validIsoDate(value){return typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(new Date(value+'T12:00').getTime())}
function legacyFrequency(unit='weeks'){return({days:'day',weeks:'week',months:'month',years:'year',day:'day',week:'week',month:'month',year:'year'})[unit]||'week'}
function legacyUnit(frequency='week'){return({day:'days',week:'weeks',month:'months',year:'years'})[frequency]||'weeks'}
function normalizeRecurrence(item){
  const legacy=item.repeat||{},source=item.recurrence||{};
  const frequency=legacyFrequency(source.frequency||legacy.unit),interval=Math.max(1,Number(source.interval??legacy.every)||1);
  const anchor=source.anchor==='completion'?'completion':'calendar';
  return{enabled:source.enabled??!!legacy.enabled,frequency,interval,anchor,startDate:validIsoDate(source.startDate)?source.startDate:'',lastCompletedDate:validIsoDate(source.lastCompletedDate)?source.lastCompletedDate:(validIsoDate(legacy.lastDone)?legacy.lastDone:''),nextDate:validIsoDate(source.nextDate)?source.nextDate:(validIsoDate(legacy.nextDue)?legacy.nextDue:'')};
}
function normalizeTaskModel(raw,index=0){
  const item={...raw},legacyLifecycle=item.lifecycle||{},legacyBlocker=item.blocker||{};
  const dueDate=validIsoDate(item.dueDate)?item.dueDate:(item.deadline?.enabled&&validIsoDate(item.deadline.date)?item.deadline.date:'');
  const plannedDate=validIsoDate(item.plannedDate)?item.plannedDate:(validIsoDate(item.scheduledDate)?item.scheduledDate:'');
  const resurfaceDate=validIsoDate(item.resurfaceDate)?item.resurfaceDate:(validIsoDate(legacyLifecycle.deferredUntil)?legacyLifecycle.deferredUntil:'');
  let state=item.done?TASK_STATES.COMPLETED:(legacyLifecycle.state==='deferred'?TASK_STATES.LATER:legacyLifecycle.state);
  if(!Object.values(TASK_STATES).includes(state))state=legacyBlocker.enabled?TASK_STATES.WAITING:TASK_STATES.OPEN;
  const waitingFor=String(item.waitingFor??legacyBlocker.text??'').trim();
  const waitingSince=validIsoDate(item.waitingSince)?item.waitingSince:'';
  const followUpDate=validIsoDate(item.followUpDate)?item.followUpDate:(state===TASK_STATES.WAITING&&validIsoDate(legacyBlocker.availableFrom)?legacyBlocker.availableFrom:'');
  const recurrence=normalizeRecurrence(item);
  return{...item,dueDate,plannedDate,resurfaceDate,waitingFor,waitingSince,followUpDate,recurrence,deadline:{enabled:!!dueDate,date:dueDate},repeat:{...item.repeat,enabled:recurrence.enabled,every:recurrence.interval,unit:legacyUnit(recurrence.frequency),lastDone:recurrence.lastCompletedDate,nextDue:recurrence.nextDate},blocker:{...legacyBlocker,enabled:state===TASK_STATES.WAITING,text:waitingFor,availableFrom:followUpDate},lifecycle:{...legacyLifecycle,state,deferredUntil:state===TASK_STATES.LATER?resurfaceDate:''},done:state===TASK_STATES.COMPLETED||!!item.done,order:Number.isFinite(Number(item.order))?Number(item.order):index};
}
function getTaskRelevance(task,context={}){
  const today=context.today||todayKey(),item=normalizeTaskModel(task),state=item.lifecycle.state;
  if(item.done||state===TASK_STATES.COMPLETED)return{actionable:false,attention:false,reason:'completed',state};
  if(state===TASK_STATES.WAITING){const due=!!item.followUpDate&&item.followUpDate<=today;return{actionable:false,attention:due,reason:due?'waiting-follow-up':'waiting',state,followUpDue:due};}
  if(state===TASK_STATES.LATER){const resurfaced=!!item.resurfaceDate&&item.resurfaceDate<=today;return{actionable:resurfaced,attention:false,reason:resurfaced?'resurfaced':'later',state,resurfaced};}
  if(item.recurrence.enabled&&item.recurrence.nextDate&&item.recurrence.nextDate>today)return{actionable:false,attention:false,reason:'recurrence-future',state};
  return{actionable:true,attention:false,reason:'open',state};
}
function isTaskActionableNow(task,context={}){return getTaskRelevance(task,context).actionable}
function setTaskWaiting(task,{waitingFor='',followUpDate='',today=todayKey()}={}){Object.assign(task,normalizeTaskModel({...task,waitingFor,waitingSince:today,followUpDate,lifecycle:{...task.lifecycle,state:TASK_STATES.WAITING,deferredUntil:''},resurfaceDate:''}));return task}
function keepTaskWaiting(task,followUpDate=''){task.followUpDate=validIsoDate(followUpDate)?followUpDate:'';task.blocker={...task.blocker,enabled:true,availableFrom:task.followUpDate};return task}
function makeTaskActionable(task){Object.assign(task,normalizeTaskModel({...task,waitingFor:'',waitingSince:'',followUpDate:'',resurfaceDate:'',lifecycle:{...task.lifecycle,state:TASK_STATES.OPEN,deferredUntil:''},blocker:{...task.blocker,enabled:false,text:'',availableFrom:''}}));return task}
function setTaskLater(task,resurfaceDate=''){Object.assign(task,normalizeTaskModel({...task,resurfaceDate:validIsoDate(resurfaceDate)?resurfaceDate:'',lifecycle:{...task.lifecycle,state:TASK_STATES.LATER,deferredUntil:validIsoDate(resurfaceDate)?resurfaceDate:''},waitingFor:'',waitingSince:'',followUpDate:''}));return task}
