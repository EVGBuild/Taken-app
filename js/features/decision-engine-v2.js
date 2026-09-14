/**
 * Decision Engine V2 foundation.
 *
 * Selection is staged: lifecycle/hard constraints first, then contextual fit,
 * then ordering inside the selected band. No universal score is produced.
 * The existing recommendation engine remains available as the legacy adapter
 * until a separate activation decision is made.
 */
function createDecisionEngineV2({todayKey}){
  function capacityContext(checkin={},dayLoad=0){
    const base=checkin.date===todayKey()?Number(checkin.energy)||3:3;
    const available=Math.max(1,base-Math.ceil(Number(dayLoad||0)/2));
    return {
      available,
      mental:Number(checkin.mentalEnergy)||available,
      physical:Number(checkin.physicalEnergy)||available
    };
  }

  function signals(item,{checkin={},dayLoad=0}={}){
    const relevance=getTaskRelevance(item,{today:todayKey()});
    const capacity=capacityContext(checkin,dayLoad);
    const demand=Number(item.energyDemand??item.load)||2;
    const mentalDemand=Number(item.mentalLoad??demand)||demand;
    const physicalDemand=Number(item.physicalLoad??demand)||demand;
    const necessity=Number(item.necessity??item.importance)||2;
    const impact=Number(item.impact)||2;
    const resistance=Number(item.resistance)||3;
    const enjoyment=Number(item.enjoyment??item.pleasure)||0;
    let daysUntilDue=null;
    if(item.dueDate)daysUntilDue=(new Date(item.dueDate+'T12:00')-new Date(todayKey()+'T12:00'))/864e5;
    return {relevance,capacity,demand,mentalDemand,physicalDemand,necessity,impact,resistance,enjoyment,daysUntilDue};
  }

  function stage(item,context={}){
    const s=signals(item,context);
    if(item.done)return{band:'excluded',reason:'done',signals:s};
    if(!s.relevance.actionable)return{band:s.relevance.attention?'attention':'excluded',reason:s.relevance.reason,signals:s};

    const urgent=s.daysUntilDue!=null&&s.daysUntilDue<=2;
    const important=s.necessity>=3||s.impact>=3;
    const fits=s.demand<=s.capacity.available&&s.mentalDemand<=s.capacity.mental&&s.physicalDemand<=s.capacity.physical;
    const light=s.demand<=2||(item.durationExplicit&&Number(item.duration)<=15);

    if(urgent)return{band:'must',reason:'deadline',signals:s};
    if(important&&fits)return{band:'strong',reason:'important-fit',signals:s};
    if(fits)return{band:'fit',reason:'capacity-fit',signals:s};
    if(light)return{band:'possible',reason:'light-option',signals:s};
    return{band:'defer',reason:'capacity-mismatch',signals:s};
  }

  function orderWithinBand(entries,orderIndex){
    return entries.sort((a,b)=>{
      const ad=a.decision.signals.daysUntilDue,bd=b.decision.signals.daysUntilDue;
      if(ad!=null||bd!=null){const left=ad??Infinity,right=bd??Infinity;if(left!==right)return left-right;}
      const an=a.decision.signals.necessity+a.decision.signals.impact;
      const bn=b.decision.signals.necessity+b.decision.signals.impact;
      if(an!==bn)return bn-an;
      return orderIndex(a.item)-orderIndex(b.item);
    });
  }

  function select(actions,{checkin={},dayLoad=0,swappedIds=new Set(),orderIndex=()=>0,broaden=false}={}){
    const buckets={must:[],strong:[],fit:[],possible:[],defer:[],attention:[],excluded:[]};
    actions.forEach(item=>{
      if(swappedIds.has(item.id))return;
      const decision=stage(item,{checkin,dayLoad});
      buckets[decision.band].push({item,decision});
    });
    ['must','strong','fit','possible','defer','attention'].forEach(key=>orderWithinBand(buckets[key],orderIndex));
    const standard=[...buckets.must,...buckets.strong,...buckets.fit];
    const extra=[...buckets.possible,...buckets.defer];
    return {buckets,standard,extra,visible:broaden?[...standard,...extra]:standard,attention:buckets.attention.map(entry=>entry.item)};
  }

  return {capacityContext,signals,stage,select};
}
