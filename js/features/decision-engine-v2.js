/**
 * Decision Engine V2 foundation.
 *
 * Selection is staged: lifecycle/hard constraints first, then contextual fit,
 * then ordering inside the selected band. No universal score is produced.
 */
function createDecisionEngineV2({todayKey}){
  const knownNumber=value=>value===null||value===undefined||value===''?null:(Number.isFinite(Number(value))?Number(value):null);

  function capacityContext(checkin={},dayLoad=0){
    const current=checkin.date===todayKey();
    const base=current?knownNumber(checkin.energy):null;
    const load=knownNumber(dayLoad)??0;
    const available=base==null?null:Math.max(1,base-Math.ceil(load/2));
    const mentalRaw=current?knownNumber(checkin.mentalEnergy):null;
    const physicalRaw=current?knownNumber(checkin.physicalEnergy):null;
    return {
      known:available!=null,
      available,
      mental:mentalRaw??available,
      physical:physicalRaw??available
    };
  }

  function signals(item,{checkin={},dayLoad=0}={}){
    const relevance=getTaskRelevance(item,{today:todayKey()});
    const capacity=capacityContext(checkin,dayLoad);
    const demand=knownNumber(item.energyDemand??item.load);
    const mentalDemand=knownNumber(item.mentalLoad)??demand;
    const physicalDemand=knownNumber(item.physicalLoad)??demand;
    const necessity=knownNumber(item.necessity??item.importance);
    const impact=knownNumber(item.impact);
    const resistance=knownNumber(item.resistance);
    const enjoyment=knownNumber(item.enjoyment??item.pleasure);
    let daysUntilDue=null;
    if(item.dueDate)daysUntilDue=(new Date(item.dueDate+'T12:00')-new Date(todayKey()+'T12:00'))/864e5;
    const fitKnown=capacity.available!=null&&demand!=null&&mentalDemand!=null&&physicalDemand!=null;
    return {relevance,capacity,demand,mentalDemand,physicalDemand,necessity,impact,resistance,enjoyment,daysUntilDue,fitKnown};
  }

  function stage(item,context={}){
    const s=signals(item,context);
    if(item.done)return{band:'excluded',reason:'done',reasons:['done'],signals:s};
    if(!s.relevance.actionable)return{band:s.relevance.attention?'attention':'excluded',reason:s.relevance.reason,reasons:[s.relevance.reason],signals:s};

    const urgent=s.daysUntilDue!=null&&s.daysUntilDue<=2;
    const important=(s.necessity!=null&&s.necessity>=3)||(s.impact!=null&&s.impact>=3);
    const fits=s.fitKnown&&s.demand<=s.capacity.available&&s.mentalDemand<=s.capacity.mental&&s.physicalDemand<=s.capacity.physical;
    const light=(s.demand!=null&&s.demand<=2)||(item.durationExplicit&&Number(item.duration)<=15);

    if(urgent)return{band:'must',reason:'deadline',reasons:['deadline',...(s.fitKnown?[]:['context-unknown'])],signals:s};
    if(important&&fits)return{band:'strong',reason:'important-fit',reasons:['important','capacity-fit'],signals:s};
    if(important&&!s.fitKnown)return{band:'strong',reason:'important-context-unknown',reasons:['important','context-unknown'],signals:s};
    if(fits)return{band:'fit',reason:'capacity-fit',reasons:['capacity-fit'],signals:s};
    if(!s.fitKnown)return{band:'context',reason:'context-unknown',reasons:['context-unknown'],signals:s};
    if(light)return{band:'possible',reason:'light-option',reasons:['light-option','capacity-mismatch'],signals:s};
    return{band:'defer',reason:'capacity-mismatch',reasons:['capacity-mismatch'],signals:s};
  }

  function orderWithinBand(entries,orderIndex){
    return entries.sort((a,b)=>{
      const ad=a.decision.signals.daysUntilDue,bd=b.decision.signals.daysUntilDue;
      if(ad!=null||bd!=null){const left=ad??Infinity,right=bd??Infinity;if(left!==right)return left-right;}
      const importance=decision=>(decision.signals.necessity??0)+(decision.signals.impact??0);
      const an=importance(a.decision),bn=importance(b.decision);
      if(an!==bn)return bn-an;
      return orderIndex(a.item)-orderIndex(b.item);
    });
  }

  function select(actions,{checkin={},dayLoad=0,swappedIds=new Set(),orderIndex=()=>0,broaden=false}={}){
    const buckets={must:[],strong:[],fit:[],context:[],possible:[],defer:[],attention:[],excluded:[]};
    actions.forEach(item=>{
      if(swappedIds.has(item.id))return;
      const decision=stage(item,{checkin,dayLoad});
      buckets[decision.band].push({item,decision});
    });
    ['must','strong','fit','context','possible','defer','attention'].forEach(key=>orderWithinBand(buckets[key],orderIndex));
    const standard=[...buckets.must,...buckets.strong,...buckets.fit,...buckets.context];
    const extra=[...buckets.possible,...buckets.defer];
    return {buckets,standard,extra,visible:broaden?[...standard,...extra]:standard,attention:buckets.attention.map(entry=>entry.item)};
  }

  return {capacityContext,signals,stage,select};
}
