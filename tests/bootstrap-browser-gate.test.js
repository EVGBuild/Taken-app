const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
let chromium;
try { ({ chromium } = require('playwright')); } catch { chromium = null; }
const { readLegacyFixture, seedFixture, startStaticServer } = require('./helpers/browser-harness');

const browserExecutableAvailable = Boolean(chromium && fs.existsSync(chromium.executablePath()));
const browserTest = browserExecutableAvailable ? test : test.skip;

browserTest('bootstrap and navigation seams preserve current startup semantics in Chromium', async () => {
  const { server, url } = await startStaticServer();
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.stack || error.message));
    await seedFixture(page);
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.locator('#homeScreen.active').waitFor();

    const state = await page.evaluate(() => ({
      actions: JSON.parse(localStorage.getItem('mijnTaken')),
      projects: JSON.parse(localStorage.getItem('lumiProjects')),
      wishlist: JSON.parse(localStorage.getItem('lumiWishlist')),
      documentsRaw: localStorage.getItem('lumiDocuments'),
      storageAdapter: storageGateway.activeAdapter,
      decisionMode: recommendationEngine.mode(),
    }));
    const fixture = readLegacyFixture();

    assert.deepEqual(pageErrors, []);
    assert.equal(state.storageAdapter, 'legacy-localStorage');
    assert.equal(state.decisionMode, 'v2');
    assert.equal(state.actions.length, fixture.mijnTaken.length);
    assert.equal(state.actions[0].title, fixture.mijnTaken[0].text);
    assert.ok(state.actions[0].id);
    assert.equal(state.actions.find(item => item.id === 'legacy-waiting').lifecycle.state, 'waiting');
    assert.equal(state.actions.find(item => item.id === 'legacy-later').lifecycle.state, 'later');
    assert.equal(state.actions.find(item => item.id === 'legacy-household').context, 'household');
    assert.equal(state.projects.find(item => item.id === 'project-home').title, 'Huis op orde');
    assert.equal(state.wishlist.find(item => item.id === 'purchase-needed').price, 24.95);
    assert.equal(state.documentsRaw, JSON.stringify(fixture.lumiDocuments));

    const fallback = await page.evaluate(() => {
      const before=recommendationEngine.mode();
      const legacy=recommendationEngine.useLegacy();
      const restored=recommendationEngine.useV2();
      return {before,legacy,restored,after:recommendationEngine.mode()};
    });
    assert.deepEqual(fallback,{before:'v2',legacy:'legacy',restored:'v2',after:'v2'});

    await page.locator('.nav-button[data-screen="vault"]').click();
    await page.locator('#vaultScreen.active').waitFor();
    await page.locator('#vaultVisualSearch').fill('garantieaanvraag');
    const connectedSearch = await page.evaluate(() => searchConnectedVault('garantieaanvraag'));
    assert.equal(connectedSearch.length, 1);
    assert.equal(connectedSearch[0].type, 'task');
    assert.equal(connectedSearch[0].id, 'legacy-waiting');
    assert.equal(await page.locator('#masterlistModule').evaluate(element => element.classList.contains('vault-search-hidden')), false);
    await page.locator('#vaultVisualSearch').fill('');
    await page.locator('#masterlistModule').click();
    await page.locator('#masterlistScreen.active').waitFor();
    await page.locator('#masterlistBackButton').click();
    await page.locator('#vaultScreen.active').waitFor();
    assert.deepEqual(pageErrors, []);
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
});

browserTest('raw capture is durable before classification and unresolved captures keep provenance', async () => {
  const { server, url } = await startStaticServer();
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.stack || error.message));
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.locator('#homeScreen.active').waitFor();

    await page.locator('#globalAddButton').click();
    await page.locator('#universalCaptureOverlay:not(.hidden)').waitFor();
    await page.locator('#universalCaptureText').fill('Ted trimmen');

    const beforeClassification = await page.evaluate(() => JSON.parse(localStorage.getItem('lumiRawCaptures') || '[]'));
    assert.equal(beforeClassification.length, 1);
    assert.equal(beforeClassification[0].rawText, 'Ted trimmen');
    assert.equal(beforeClassification[0].status, 'raw');
    assert.equal(beforeClassification[0].selectedType, null);

    await page.locator('#universalCaptureForm').evaluate(form => form.requestSubmit());
    await page.locator('#captureTypeOverlay:not(.hidden)').waitFor();
    await page.locator('[data-capture-type="unknown"]').click();
    await page.locator('#inboxScreen.active').waitFor();

    const afterClassification = await page.evaluate(() => ({
      raw: JSON.parse(localStorage.getItem('lumiRawCaptures') || '[]'),
      inbox: JSON.parse(localStorage.getItem('lumiInbox') || '[]'),
      relations: JSON.parse(localStorage.getItem('lumiDomainRelations') || '[]'),
      search: searchConnectedVault('Ted trimmen'),
    }));
    assert.equal(afterClassification.raw[0].status, 'unresolved');
    assert.equal(afterClassification.raw[0].selectedType, 'unknown');
    assert.equal(afterClassification.inbox.at(-1).text, 'Ted trimmen');
    assert.equal(afterClassification.inbox.at(-1).rawCaptureId, afterClassification.raw[0].id);
    assert.equal(afterClassification.relations.length, 1);
    assert.equal(afterClassification.relations[0].kind, 'derived-from');
    assert.equal(afterClassification.search.length, 1);
    assert.equal(afterClassification.search[0].type, 'inbox');
    assert.equal(afterClassification.search[0].relations[0].to.type, 'raw-capture');
    assert.deepEqual(pageErrors, []);
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
});
