/**
 * Recommendation engine.
 *
 * This module owns recommendation scoring and grouping. It intentionally does
 * not render Home and does not read/write storage directly.
 */
export function createRecommendationEngine({ todayKey }) {
  function profile(item, { checkin, dayLoad = 0 }) {
    if (item.blocker?.enabled && (!item.blocker.availableFrom || item.blocker.availableFrom > todayKey())) {
      return { eligible: false, score: -999, priority: 0, fit: -99, reason: 'Wacht nog op iets anders.' };
    }

    const capacity = checkin.date === todayKey() ? Number(checkin.energy) || 3 : 3;
    const available = Math.max(1, capacity - Math.ceil(dayLoad / 2));
    const necessity = Number(item.necessity ?? item.importance) || 2;
    const impact = Number(item.impact) || 2;
    const load = Number(item.load) || 2;
    const resistance = Number(item.resistance) || 3;
    const age = Math.max(0, (Date.now() - (item.createdAt || Date.now())) / 864e5);
    const skips = (item.recommendationHistory?.skips || []).length + Number(item.postponeCount || 0);

    let deadline = 0;
    let days = null;
    if (item.deadline?.enabled && item.deadline.date) {
      days = (new Date(item.deadline.date + 'T12:00') - new Date(todayKey() + 'T12:00')) / 864e5;
      deadline = days <= 0 ? 18 : days <= 2 ? 14 : days <= 7 ? 8 : 3;
    }

    const priority = necessity * 5 + impact * 2.4 + deadline + Math.min(4, age / 21 + skips * .8);
    const mismatch = Math.max(0, load - available);
    const fit = (available - load) * 4
      + (5 - resistance) * .9
      + (item.durationExplicit && item.duration <= 15 ? 3 : 0)
      - (item.durationExplicit && item.duration > 90 && available <= 2 ? 4 : 0);
    const lowPriorityHeavy = available <= 2 && load >= 3 && necessity <= 2 && deadline < 8;
    const score = priority + fit - mismatch * mismatch * 4 - (lowPriorityHeavy ? 12 : 0);

    let reason;
    if (days != null && days <= 2 && load > available) reason = 'Dit vraagt veel van je, maar de deadline maakt aandacht nu belangrijk.';
    else if (necessity >= 4 && load > available) reason = 'Dit vraagt veel van je, maar uitstellen heeft duidelijke gevolgen.';
    else if (load <= available && item.durationExplicit && item.duration <= 15 && resistance <= 3) reason = 'Kort om te doen en passend bij wat je nu aankunt.';
    else if (load <= available && available <= 2) reason = 'Licht genoeg voor je huidige energie.';
    else if (load <= available && impact >= 3) reason = 'Past bij je huidige capaciteit en levert merkbaar iets op.';
    else if (deadline >= 8) reason = 'De nabije deadline geeft deze taak nu voorrang.';
    else if (necessity >= 3) reason = 'Uitstel begint gevolgen te geven, daarom verdient dit aandacht.';
    else if (load > available) reason = 'Vraagt meer energie dan je nu hebt; kies dit alleen als het nodig voelt.';
    else reason = 'Een redelijke match met je huidige capaciteit en prioriteiten.';

    return { eligible: true, score, priority, fit, load, available, lowPriorityHeavy, reason };
  }

  function sets(actions, {
    checkin,
    dayLoad = 0,
    swappedIds,
    orderIndex,
    broaden = false
  }) {
    const all = actions
      .filter(item => !item.done && !swappedIds.has(item.id))
      .map(item => ({ item, profile: profile(item, { checkin, dayLoad }) }))
      .filter(entry => entry.profile.eligible)
      .sort((a, b) => orderIndex(a.item) - orderIndex(b.item) || b.profile.score - a.profile.score);

    const best = all.filter(entry => !entry.profile.lowPriorityHeavy)[0]?.profile.score ?? -999;
    const standard = all.filter(entry => !entry.profile.lowPriorityHeavy && entry.profile.score >= best - 16);
    const extra = all.filter(entry => !standard.some(candidate => candidate.item.id === entry.item.id));

    return { standard, extra, visible: broaden ? [...standard, ...extra] : standard };
  }

  return { profile, sets };
}
