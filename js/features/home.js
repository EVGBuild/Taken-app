/**
 * Home screen presentation.
 *
 * Recommendation calculations stay in recommendations.js. This module only
 * translates current app state into the Home screen UI.
 */
const TODAY_SPACE_LABELS = ['', 'heel weinig', 'weinig', 'redelijke', 'best veel', 'veel'];

function renderHomeScreen({
  $,
  sets,
  checkin,
  todayKey,
  suggestionCard,
  openCheckin,
  renderProjectPreview,
  broaden
}) {
  const primary = sets.visible.slice(0, 3).map(entry => entry.item);
  const current = checkin.date === todayKey() ? Number(checkin.energy) || null : null;

  $('todayDate').textContent = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
  $('todayEnergy').innerHTML = current
    ? `<span class="energy-battery level-${current}" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span><b>${current} van 5</b>`
    : '<b>Nog niet ingecheckt</b>';
  $('todayEnergy').onclick = null;
  $('todayMeaning').textContent = current
    ? `${TODAY_SPACE_LABELS[current][0].toUpperCase() + TODAY_SPACE_LABELS[current].slice(1)} ruimte vandaag`
    : 'Hoeveel ruimte heb je vandaag?';
  $('todayConsideration').textContent = '';
  $('todayConsideration').classList.add('hidden');
  $('todayAdjustButton').textContent = current ? 'Aanpassen' : 'Inchecken';
  $('todayAdjustButton').onclick = openCheckin;
  $('suggestionList').innerHTML = '';
  $('moreTodayList').innerHTML = '';
  $('moreTodayButton').classList.add('hidden');

  primary.forEach(item => $('suggestionList').append(suggestionCard(item)));

  const noOptions = current && !primary.length;
  $('suggestionEmpty').classList.toggle('hidden', !noOptions);
  if (noOptions) {
    $('suggestionEmpty').innerHTML = '<strong>Geen passende taken voor nu</strong><small>Je hoeft nu niets te forceren.</small>';
  }

  const canBroaden = !broaden && sets.standard.length < 3 && sets.extra.length > 0;
  $('broadenSuggestionsButton').classList.toggle('hidden', !canBroaden);
  $('todayRecoveryActions').classList.toggle('hidden', !canBroaden);

  renderProjectPreview();
}
