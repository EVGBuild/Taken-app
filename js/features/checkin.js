/**
 * Check-in UI controller.
 *
 * This preserves the current simplified 1-5 capacity check-in. App state is
 * supplied through getters/setters so this module does not own global state.
 */
export function setupCheckinFeature({
  $,
  energyCard,
  todayKey,
  getCheckin,
  getPendingEnergy,
  setPendingEnergy,
  setEnergy,
  setCheckin,
  write,
  keys,
  open,
  close,
  renderHome,
  renderSettings,
  lumiSuccess
}) {
  energyCard.querySelector('.eyebrow').textContent = 'Even inchecken';
  energyCard.querySelector('h2').textContent = 'Hoeveel ruimte heb je vandaag?';
  energyCard.querySelector('.modal-copy').textContent = 'Kies wat het dichtst in de buurt komt.';

  [['1', 'Heel weinig'], ['2', 'Weinig'], ['3', 'Redelijk'], ['4', 'Best veel'], ['5', 'Veel']]
    .forEach(([value, label]) => {
      const labelElement = document.querySelector(`.energy-choice[data-energy="${value}"] small`);
      if (labelElement) labelElement.textContent = label;
    });

  energyCard.querySelector('.checkin-planning')?.remove();
  $('checkinEventFields')?.remove();
  energyCard.querySelector('.checkin-day-load')?.remove();
  $('checkinNextButton')?.remove();

  function openCheckin() {
    const checkin = getCheckin();
    const isToday = checkin.date === todayKey();
    const pending = isToday ? Number(checkin.energy) : null;
    setPendingEnergy(pending);
    document.querySelectorAll('.energy-choice').forEach(button => {
      button.classList.toggle('selected', +button.dataset.energy === pending);
    });
    $('saveCheckinButton').classList.remove('hidden');
    open('energyOverlay');
  }

  function saveCheckin() {
    const pending = getPendingEnergy();
    if (!pending) return;

    const energy = pending;
    const nextCheckin = { ...getCheckin(), date: todayKey(), energy, updatedAt: Date.now() };
    delete nextCheckin.dayLoad;
    delete nextCheckin.eventImpact;
    delete nextCheckin.hasEnergyEvent;
    delete nextCheckin.eventNote;

    setEnergy(energy);
    setCheckin(nextCheckin);
    write(keys.energy, energy);
    write(keys.checkin, nextCheckin);
    close('energyOverlay');
    renderHome();
    renderSettings();
    lumiSuccess();
  }

  $('saveCheckinButton').onclick = saveCheckin;
  return { openCheckin, saveCheckin };
}
