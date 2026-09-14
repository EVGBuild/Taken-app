const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
let chromium;
try { ({ chromium } = require('playwright')); } catch { chromium = null; }
const { readLegacyFixture, seedFixture, startStaticServer } = require('./helpers/browser-harness');

const browserExecutableAvailable = Boolean(chromium && fs.existsSync(chromium.executablePath()));
const browserTest = browserExecutableAvailable ? test : test.skip;

let browser;
let server;
let baseUrl;

test.before(async () => {
  if (!browserExecutableAvailable) return;
  ({ server, url: baseUrl } = await startStaticServer());
  browser = await chromium.launch({ headless: true });
});

test.after(async () => {
  await browser?.close();
  await new Promise((resolve) => server?.close(resolve));
});

async function openSeededPage() {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await seedFixture(page);
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await page.locator('#homeScreen.active').waitFor();
  return page;
}

browserTest('legacy records retain meaning when the current build boots', async () => {
  const page = await openSeededPage();
  const state = await page.evaluate(() => ({
    actions: JSON.parse(localStorage.getItem('mijnTaken')),
    projects: JSON.parse(localStorage.getItem('lumiProjects')),
    wishlist: JSON.parse(localStorage.getItem('lumiWishlist')),
    documentsRaw: localStorage.getItem('lumiDocuments'),
  }));
  const fixture = readLegacyFixture();

  assert.equal(state.actions.length, fixture.mijnTaken.length);
  assert.equal(state.actions[0].title, fixture.mijnTaken[0].text);
  assert.ok(state.actions[0].id, 'the current bootstrap assigns an id to an id-less task');
  assert.equal(state.actions.find((item) => item.id === 'legacy-waiting').lifecycle.state, 'waiting');
  assert.equal(state.actions.find((item) => item.id === 'legacy-waiting').waitingFor, 'Klantenservice');
  assert.equal(state.actions.find((item) => item.id === 'legacy-later').lifecycle.state, 'later');
  assert.equal(state.actions.find((item) => item.id === 'legacy-household').context, 'household');
  assert.equal(state.actions.find((item) => item.id === 'legacy-household').repeat.nextDue, '2026-09-12');
  assert.equal(state.projects.find((item) => item.id === 'project-home').title, 'Huis op orde');
  assert.equal(state.wishlist.find((item) => item.id === 'purchase-needed').price, 24.95);
  assert.equal(state.documentsRaw, JSON.stringify(fixture.lumiDocuments), 'untouched domains remain byte-identical');
  await page.close();
});

browserTest('Home, optional check-in and primary navigation keep their current contract', async () => {
  const page = await openSeededPage();
  assert.equal(await page.locator('.bottom-nav .nav-button').count(), 2);
  assert.equal(await page.locator('#globalAddButton').getAttribute('aria-label'), 'Toevoegen');
  assert.match(await page.locator('#suggestionList').innerText(), /Bel de garage over de afspraak/);

  await page.locator('#todayAdjustButton').click();
  assert.equal(await page.locator('#energyOverlay:not(.hidden) .energy-choice').count(), 5);
  await page.locator('.energy-choice[data-energy="4"]').click();
  await page.locator('#saveCheckinButton').click();
  const saved = await page.evaluate(() => ({
    energy: JSON.parse(localStorage.getItem('lumiEnergy')),
    checkin: JSON.parse(localStorage.getItem('lumiMorningCheckin')),
    today: todayKey(),
  }));
  assert.equal(saved.energy, 4);
  assert.equal(saved.checkin.energy, 4);
  assert.equal(saved.checkin.date, saved.today);
  assert.ok(!documentHasBlockingCheckin(await page.locator('body').getAttribute('class')));
  await page.close();
});

function documentHasBlockingCheckin(bodyClass) {
  return String(bodyClass || '').split(/\s+/).includes('checkin-required');
}

browserTest('Orb carries captured text into a task and title-only save persists it', async () => {
  const page = await openSeededPage();
  await page.locator('#globalAddButton').click();
  await page.locator('#universalCaptureText').fill('Karakterisatietaak');
  await page.locator('#universalCaptureForm').evaluate((form) => form.requestSubmit());
  await page.locator('#captureTypeOverlay:not(.hidden)').waitFor();
  await page.locator('[data-capture-type="task"]').click();
  assert.equal(await page.locator('#actionTitle').inputValue(), 'Karakterisatietaak');
  assert.equal(await page.locator('#saveTaskNowButton').isVisible(), true);
  await page.locator('#saveTaskNowButton').click();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('mijnTaken')));
  const item = saved.find((entry) => entry.title === 'Karakterisatietaak');
  assert.ok(item?.id);
  assert.equal(item.lifecycle.state, 'open');
  assert.equal(item.done, false);
  await page.close();
});

browserTest('Vault and legacy lifecycle views keep records reachable', async () => {
  const page = await openSeededPage();
  await page.locator('.nav-button[data-screen="vault"]').click();
  assert.equal(await page.locator('#vaultScreen.active').count(), 1);
  assert.equal(await page.locator('#vaultScreen .module-card').count(), 7);

  await page.locator('#masterlistModule').click();
  assert.match(await page.locator('#masterlistList').innerText(), /Bel de garage over de afspraak/);
  await page.locator('[data-master-filter="waiting"]').click();
  assert.match(await page.locator('#masterlistList').innerText(), /Reactie op garantieaanvraag controleren/);
  await page.locator('[data-master-filter="later"]').click();
  assert.match(await page.locator('#masterlistList').innerText(), /Fotoarchief uitzoeken/);

  await page.locator('#masterlistBackButton').click();
  await page.locator('#wishlistModule').click();
  assert.match(await page.locator('#wishlistList').innerText(), /Nieuwe oplader/);
  await page.locator('.vault-back').first().click();
  await page.locator('#choresModule').click();
  assert.match(await page.locator('#choresList').innerText(), /Kattenbakken geheel verschonen/);
  await page.close();
});

browserTest('known gaps stay diagnostic rather than becoming protected behavior', async () => {
  const page = await openSeededPage();
  await page.locator('.nav-button[data-screen="vault"]').click();
  await page.locator('#vaultVisualSearch').fill('garantiebon');
  assert.match(await page.locator('#vaultSearchResults').innerText(), /Geen resultaten gevonden/);
  assert.equal(await page.locator('[data-capture-type="unknown"]').count(), 0);
  await page.locator('#vaultVisualSearch').fill('');
  await page.locator('#choresModule').click();
  await page.locator('#choresList .chore-item').click();
  const actions = await page.locator('#taskDetailOverlay:not(.hidden) button').allInnerTexts();
  assert.deepEqual(actions.filter(Boolean), ['Bewerken', 'Verwijderen']);
  await page.close();
});
