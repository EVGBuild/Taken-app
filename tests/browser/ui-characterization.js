(async function runBrowserCharacterization() {
  'use strict';

  const statusNode = document.getElementById('status');
  const resultNode = document.getElementById('result');
  const frameHost = document.getElementById('frameHost');
  const results = [];

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  function waitFor(predicate, message, timeout = 10000) {
    const startedAt = Date.now();
    return new Promise((resolve, reject) => {
      const check = () => {
        try {
          if (predicate()) {
            resolve();
            return;
          }
        } catch { /* page can still be initializing */ }
        if (Date.now() - startedAt >= timeout) {
          reject(new Error(message));
          return;
        }
        setTimeout(check, 25);
      };
      check();
    });
  }

  function click(document, selector) {
    const element = [...document.querySelectorAll(selector)].find((candidate) => {
      const style = candidate.ownerDocument.defaultView.getComputedStyle(candidate);
      return !candidate.classList.contains('hidden')
        && style.display !== 'none'
        && style.visibility !== 'hidden'
        && candidate.getClientRects().length > 0;
    });
    assert(element, `VISIBLE_ELEMENT_NOT_FOUND:${selector}`);
    element.click();
    return element;
  }

  function fill(element, value) {
    element.value = value;
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }

  const fixtureResponse = await fetch('../../docs/phase-0/legacy-localstorage-fixture.json');
  const fixture = (await fixtureResponse.json()).localStorage;

  function seedFixture() {
    for (const [key, value] of Object.entries(fixture)) localStorage.setItem(key, JSON.stringify(value));
  }

  async function openSeededBuild(testNumber) {
    seedFixture();
    const frame = document.createElement('iframe');
    frame.width = '390';
    frame.height = '844';
    frame.src = `../../index.html?browser-characterization=${testNumber}-${Date.now()}`;
    frameHost.replaceChildren(frame);
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('BUILD_LOAD_TIMEOUT')), 10000);
      frame.onload = () => {
        clearTimeout(timer);
        resolve();
      };
    });
    await waitFor(() => frame.contentDocument.querySelector('#homeScreen.active'), 'HOME_DID_NOT_INITIALIZE');
    return { frame, window: frame.contentWindow, document: frame.contentDocument };
  }

  async function runTest(name, testNumber, callback) {
    try {
      const page = await openSeededBuild(testNumber);
      await callback(page);
      results.push({ name, status: 'passed' });
    } catch (error) {
      results.push({ name, status: 'failed', message: error.message });
    } finally {
      frameHost.replaceChildren();
    }
  }

  await runTest('legacy records retain meaning when the current build boots', 1, async () => {
    const actions = JSON.parse(localStorage.getItem('mijnTaken'));
    const projects = JSON.parse(localStorage.getItem('lumiProjects'));
    const wishlist = JSON.parse(localStorage.getItem('lumiWishlist'));
    assert(actions.length === fixture.mijnTaken.length, 'ACTION_COUNT_CHANGED');
    assert(actions[0].title === fixture.mijnTaken[0].text, 'LEGACY_TITLE_NOT_NORMALIZED');
    assert(Boolean(actions[0].id), 'MISSING_CURRENT_BOOTSTRAP_ID');
    assert(actions.find((item) => item.id === 'legacy-waiting').lifecycle.state === 'waiting', 'WAITING_STATE_CHANGED');
    assert(actions.find((item) => item.id === 'legacy-waiting').waitingFor === 'Klantenservice', 'WAITING_FOR_CHANGED');
    assert(actions.find((item) => item.id === 'legacy-later').lifecycle.state === 'later', 'LATER_STATE_CHANGED');
    assert(actions.find((item) => item.id === 'legacy-household').context === 'household', 'HOUSEHOLD_CONTEXT_CHANGED');
    assert(actions.find((item) => item.id === 'legacy-household').repeat.nextDue === '2026-09-12', 'RECURRENCE_DATE_CHANGED');
    assert(projects.find((item) => item.id === 'project-home').title === 'Huis op orde', 'PROJECT_CHANGED');
    assert(wishlist.find((item) => item.id === 'purchase-needed').price === 24.95, 'WISHLIST_PRICE_CHANGED');
    assert(localStorage.getItem('lumiDocuments') === JSON.stringify(fixture.lumiDocuments), 'UNTOUCHED_DOMAIN_BYTES_CHANGED');
  });

  await runTest('Home, optional check-in and primary navigation keep their current contract', 2, async ({ document, window }) => {
    assert(document.querySelectorAll('.bottom-nav .nav-button').length === 2, 'PRIMARY_NAV_COUNT_CHANGED');
    assert(document.querySelector('#globalAddButton').getAttribute('aria-label') === 'Toevoegen', 'ADD_LABEL_CHANGED');
    assert(document.querySelector('#suggestionList').innerText.includes('Bel de garage over de afspraak'), 'HOME_SUGGESTION_MISSING');
    click(document, '#todayAdjustButton');
    await waitFor(() => !document.querySelector('#energyOverlay').classList.contains('hidden'), 'ENERGY_OVERLAY_DID_NOT_OPEN');
    assert(document.querySelectorAll('#energyOverlay .energy-choice').length === 5, 'ENERGY_CHOICE_COUNT_CHANGED');
    click(document, '.energy-choice[data-energy="4"]');
    click(document, '#saveCheckinButton');
    const energy = JSON.parse(localStorage.getItem('lumiEnergy'));
    const checkin = JSON.parse(localStorage.getItem('lumiMorningCheckin'));
    assert(energy === 4 && checkin.energy === 4, 'CHECKIN_ENERGY_NOT_SAVED');
    assert(checkin.date === window.todayKey(), 'CHECKIN_DATE_CHANGED');
    assert(!document.body.classList.contains('checkin-required'), 'CHECKIN_BECAME_BLOCKING');
  });

  await runTest('Orb carries captured text into a task and title-only save persists it', 3, async ({ document }) => {
    click(document, '#globalAddButton');
    const capture = document.querySelector('#universalCaptureText');
    fill(capture, 'Karakterisatietaak');
    document.querySelector('#universalCaptureForm').requestSubmit();
    await waitFor(() => !document.querySelector('#captureTypeOverlay').classList.contains('hidden'), 'CAPTURE_TYPE_DID_NOT_OPEN');
    click(document, '[data-capture-type="task"]');
    assert(document.querySelector('#actionTitle').value === 'Karakterisatietaak', 'CAPTURE_TEXT_NOT_CARRIED');
    click(document, '#saveTaskNowButton');
    const saved = JSON.parse(localStorage.getItem('mijnTaken'));
    const item = saved.find((entry) => entry.title === 'Karakterisatietaak');
    assert(Boolean(item && item.id), 'CAPTURED_TASK_MISSING_ID');
    assert(item.lifecycle.state === 'open' && item.done === false, 'CAPTURED_TASK_SEMANTICS_CHANGED');
  });

  await runTest('Vault and legacy lifecycle views keep records reachable', 4, async ({ document }) => {
    click(document, '.nav-button[data-screen="vault"]');
    assert(document.querySelectorAll('#vaultScreen.active').length === 1, 'VAULT_DID_NOT_OPEN');
    assert(document.querySelectorAll('#vaultScreen .module-card').length === 7, 'VAULT_MODULE_COUNT_CHANGED');
    click(document, '#masterlistModule');
    assert(document.querySelector('#masterlistList').innerText.includes('Bel de garage over de afspraak'), 'OPEN_TASK_NOT_REACHABLE');
    click(document, '[data-master-filter="waiting"]');
    assert(document.querySelector('#masterlistList').innerText.includes('Reactie op garantieaanvraag controleren'), 'WAITING_TASK_NOT_REACHABLE');
    click(document, '[data-master-filter="later"]');
    assert(document.querySelector('#masterlistList').innerText.includes('Fotoarchief uitzoeken'), 'LATER_TASK_NOT_REACHABLE');
    click(document, '#masterlistBackButton');
    click(document, '#wishlistModule');
    assert(document.querySelector('#wishlistList').innerText.includes('Nieuwe oplader'), 'WISHLIST_ITEM_NOT_REACHABLE');
    click(document, '.vault-back');
    click(document, '#choresModule');
    assert(document.querySelector('#choresList').innerText.includes('Kattenbakken geheel verschonen'), 'HOUSEHOLD_TASK_NOT_REACHABLE');
  });

  await runTest('known gaps stay diagnostic rather than becoming protected behavior', 5, async ({ document }) => {
    click(document, '.nav-button[data-screen="vault"]');
    fill(document.querySelector('#vaultVisualSearch'), 'garantiebon');
    assert(document.querySelector('#vaultSearchResults').innerText.includes('Geen resultaten gevonden'), 'KNOWN_SEARCH_GAP_CHANGED');
    assert(document.querySelectorAll('[data-capture-type="unknown"]').length === 0, 'KNOWN_CAPTURE_GAP_CHANGED');
    fill(document.querySelector('#vaultVisualSearch'), '');
    click(document, '#choresModule');
    click(document, '#choresList .chore-item');
    await waitFor(() => !document.querySelector('#taskDetailOverlay').classList.contains('hidden'), 'TASK_DETAIL_DID_NOT_OPEN');
    const actions = [...document.querySelectorAll('#taskDetailOverlay button')]
      .map((button) => button.innerText.trim())
      .filter(Boolean);
    assert(
      JSON.stringify(actions) === JSON.stringify(['Bewerken', 'Verwijderen']),
      `KNOWN_HOUSEHOLD_ACTION_GAP_CHANGED:${JSON.stringify(actions)}`
    );
  });

  const passed = results.filter((result) => result.status === 'passed').length;
  const report = { passed, failed: results.length - passed, total: results.length, results };
  statusNode.dataset.status = report.failed === 0 ? 'passed' : 'failed';
  statusNode.textContent = report.failed === 0 ? 'Geslaagd' : 'Mislukt';
  resultNode.textContent = JSON.stringify(report, null, 2);
}());
