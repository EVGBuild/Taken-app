/**
 * Decision Engine shadow comparison.
 *
 * Runs legacy and V2 against the same in-memory inputs and returns a diagnostic
 * comparison only. It does not render, persist, reorder Today, or activate V2.
 */
function createDecisionEngineShadow({legacyEngine,v2Engine}){
  function legacyBand(profile){
    if(!profile?.eligible)return profile?.attention?'attention':'excluded';
    if(profile.lowPriorityHeavy)return'defer';
    return'standard';
  }

  function compare(actions,{checkin={},dayLoad=0,swappedIds=new Set(),orderIndex=()=>0,broaden=false}={}){
    const legacy=legacyEngine.sets(actions,{checkin,dayLoad,swappedIds,orderIndex,broaden});
    const v2=v2Engine.select(actions,{checkin,dayLoad,swappedIds,orderIndex,broaden});
    const legacyProfiles=new Map();
    actions.forEach(item=>legacyProfiles.set(item.id,legacyEngine.profile(item,{checkin,dayLoad})));
    const v2Decisions=new Map();
    Object.values(v2.buckets).flat().forEach(entry=>v2Decisions.set(entry.item.id,entry.decision));

    const rows=actions.map(item=>{
      const legacyProfile=legacyProfiles.get(item.id);
      const v2Decision=v2Decisions.get(item.id)||null;
      return {
        id:item.id,
        title:item.title||item.text||'',
        legacyBand:legacyBand(legacyProfile),
        legacyVisible:legacy.visible.some(entry=>entry.item.id===item.id),
        v2Band:v2Decision?.band||'swapped',
        v2Visible:v2.visible.some(entry=>entry.item.id===item.id),
        changedVisibility:legacy.visible.some(entry=>entry.item.id===item.id)!==v2.visible.some(entry=>entry.item.id===item.id)
      };
    });

    return {
      rows,
      differences:rows.filter(row=>row.changedVisibility||row.legacyBand!==row.v2Band),
      legacyVisibleIds:legacy.visible.map(entry=>entry.item.id),
      v2VisibleIds:v2.visible.map(entry=>entry.item.id),
      legacy,
      v2
    };
  }

  return{compare};
}
