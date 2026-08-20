/**
 * Recommendation engine.
 *
 * This module owns recommendation scoring and grouping. It intentionally does
 * not render Home and does not read/write storage directly.
 */
function createRecommendationEngine({ todayKey }) {
  function profile(item, { checkin, dayLoad = 0 }) {
    const relevance=getTaskRelevance(item,{today:todayKey()});
    if(!relevance.actionable)return{eligible:false,attention:relevance.attention,score:-999,priority:0,fit:-99,reason:relevance.reason,relevance};

    const capacity = checkin.date === todayKey() ? Number(checkin.energy) || 3 : 3;
    const available = Math.max(1, capacity - Math.ceil(dayLoad / 2));
    const necessity = Number(item.necessity ?? item.importance) || 2;
    const impact = Number(item.impact) || 2;
    const taskDemand=Number(item.energyDemand??item.load)||2,mentalLoad=Number(item.mentalLoad??taskDemand)||taskDemand,physicalLoad=Number(item.physicalLoad??taskDemand)||taskDemand;
    const mentalCapacity=Number(checkin.mentalEnergy)||available,physicalCapacity=Number(checkin.physicalEnergy)||available;
    const load = Math.max(taskDemand,mentalLoad>mentalCapacity?mentalLoad:0,physicalLoad>physicalCapacity?physicalLoad:0);
    const resistance = Number(item.resistance) || 3;
    const enjoyment=Number(item.enjoyment??item.pleasure)||0;
    const age = Math.max(0, (Date.now() - (item.createdAt || Date.now())) / 864e5);
    const skips = (item.recommendationHistory?.skips || []).length + Number(item.postponeCount || 0);

    let deadline = 0;
    let days = null;
    if (item.dueDate) {
      days = (new Date(item.dueDate + 'T12:00') - new Date(todayKey() + 'T12:00')) / 864e5;
      deadline = days <= 0 ? 18 : days <= 2 ? 14 : days <= 7 ? 8 : 3;
    }

    const plannedBoost=item.plannedDate&&item.plannedDate<=todayKey()?4:0;
    const priority = necessity * 5 + impact * 2.4 + deadline + plannedBoost + Math.min(4, age / 21 + skips * .8);
    const mismatch = Math.max(0, load - available);
    const fit = (available - load) * 4
      + (5 - resistance) * .9
      + enjoyment * .35
      + (item.durationExplicit && item.duration <= 15 ? 3 : 0)
      - (item.durationExplicit && item.duration > 90 && available <= 2 ? 4 : 0);
    const lowPriorityHeavy = available <= 2 && load >= 3 && necessity <= 2 && deadline < 8;
    const score = priority + fit - mismatch * mismatch * 4 - (lowPriorityHeavy ? 12 : 0);

    const reasons=[];
    if(relevance.resurfaced)reasons.push(t('reason.resurfaced'));
    if(days!=null&&days<=7)reasons.push(t('reason.deadline'));
    else if(necessity>=3||impact>=3)reasons.push(t('reason.important'));
    if(item.durationExplicit&&item.duration)reasons.push(t('reason.duration',{minutes:item.duration}));
    else if(load<=available)reasons.push(t('reason.energyFit'));
    else if(available<=2)reasons.push(t('reason.lowEnergy'));
    else if(resistance<=2)reasons.push(t('reason.lowResistance'));
    const reason=reasons.slice(0,2).join(' · ');

    return { eligible: true, score, priority, fit, load, available, lowPriorityHeavy, reason, relevance };
  }

  function sets(actions, {
    checkin,
    dayLoad = 0,
    swappedIds,
    orderIndex,
    broaden = false
  }) {
    const attention=actions.filter(item=>!item.done&&getTaskRelevance(item,{today:todayKey()}).attention);
    const all = actions
      .filter(item => !item.done && !swappedIds.has(item.id))
      .map(item => ({ item, profile: profile(item, { checkin, dayLoad }) }))
      .filter(entry => entry.profile.eligible)
      .sort((a, b) => orderIndex(a.item) - orderIndex(b.item) || b.profile.score - a.profile.score);

    const best = all.filter(entry => !entry.profile.lowPriorityHeavy)[0]?.profile.score ?? -999;
    const standard = all.filter(entry => !entry.profile.lowPriorityHeavy && entry.profile.score >= best - 16);
    const extra = all.filter(entry => !standard.some(candidate => candidate.item.id === entry.item.id));

    return { attention, standard, extra, visible: broaden ? [...standard, ...extra] : standard };
  }

  return { profile, sets };
}
