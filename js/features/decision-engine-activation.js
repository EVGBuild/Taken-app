/**
 * Reversible activation adapter for Today/Home.
 * Keeps the legacy engine intact while presenting one stable profile/sets API.
 */
function createDecisionEngineAdapter({legacyEngine,v2Engine,initialMode='legacy'}){
  let mode=initialMode==='v2'?'v2':'legacy';
  const v2Reason=decision=>{
    const reason=decision?.reason;
    if(reason==='deadline')return t('reason.deadline');
    if(reason==='important-fit')return [t('reason.important'),t('reason.energyFit')].filter(Boolean).join(' · ');
    if(reason==='capacity-fit'||reason==='light-option')return t('reason.energyFit');
    if(reason==='capacity-mismatch')return t('reason.lowEnergy');
    if(reason==='resurfaced')return t('reason.resurfaced');
    return '';
  };
  const normalizeDecision=decision=>({
    eligible:!['excluded','attention'].includes(decision?.band),
    attention:decision?.band==='attention',
    reason:v2Reason(decision),
    decision
  });
  const mapEntry=entry=>({item:entry.item,profile:normalizeDecision(entry.decision)});

  function profile(item,context){
    if(mode==='legacy')return legacyEngine.profile(item,context);
    return normalizeDecision(v2Engine.stage(item,context));
  }

  function sets(actions,context){
    if(mode==='legacy')return legacyEngine.sets(actions,context);
    const result=v2Engine.select(actions,context);
    return {
      attention:result.attention,
      standard:result.standard.map(mapEntry),
      extra:result.extra.map(mapEntry),
      visible:result.visible.map(mapEntry),
      v2Buckets:result.buckets
    };
  }

  return Object.freeze({
    profile,
    sets,
    mode:()=>mode,
    useLegacy:()=>{mode='legacy';return mode;},
    useV2:()=>{mode='v2';return mode;}
  });
}
