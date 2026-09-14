const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
let chromium;
try { ({ chromium } = require('playwright')); } catch { chromium = null; }
const { readLegacyFixture, seedFixture, startStaticServer } = require('./helpers/browser-harness');

const browserExecutableAvailable = Boolean(chromium && fs.existsSync(chromium.executablePath()));
const browserTest = browserExecutableAvailable ? test : test.skip;

browserTest('bootstrap data seam preserves current startup semantics in Chromium', async () => {
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
    }));
    const fixture = readLegacyFixture();

    assert.deepEqual(pageErrors, []);
    assert.equal(state.storageAdapter, 'legacy-localStorage');
    assert.equal(state.actions.length, fixture.mijnTaken.length);
    assert.equal(state.actions[0].title, fixture.mijnTaken[0].text);
    assert.ok(state.actions[0].id);
    assert.equal(state.actions.find(item => item.id === 'legacy-waiting').lifecycle.state, 'waiting');
    assert.equal(state.actions.find(item => item.id === 'legacy-later').lifecycle.state, 'later');
    assert.equal(state.actions.find(item => item.id === 'legacy-household').context, 'household');
    assert.equal(state.projects.find(item => item.id === 'project-home').title, 'Huis op orde');
    assert.equal(state.wishlist.find(item => item.id === 'purchase-needed').price, 24.95);
    assert.equal(state.documentsRaw, JSON.stringify(fixture.lumiDocuments));
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
});
