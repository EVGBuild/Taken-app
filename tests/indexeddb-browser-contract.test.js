const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
let chromium;
try { ({ chromium } = require('playwright')); } catch { chromium = null; }
const { startStaticServer } = require('./helpers/browser-harness');

const browserExecutableAvailable = Boolean(chromium && fs.existsSync(chromium.executablePath()));
const browserTest = browserExecutableAvailable ? test : test.skip;

browserTest('IndexedDB shadow contract passes in a real browser page', async () => {
  const { server, url } = await startStaticServer();
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.goto(new URL('tests/browser/indexeddb-contract.html', url).href, { waitUntil: 'domcontentloaded' });
    await page.locator('#status[data-status="passed"], #status[data-status="failed"]').waitFor({ timeout: 120000 });
    const status = await page.locator('#status').getAttribute('data-status');
    const report = JSON.parse(await page.locator('#result').innerText());
    assert.equal(status, 'passed', JSON.stringify(report));
    assert.equal(report.indexedDbAvailable, true);
    assert.equal(report.interruptedTransactionAtomic, true);
    assert.equal(report.largePayloadVerified, true);
    assert.equal(report.legacyShadowRoundTrip, true);
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
});
