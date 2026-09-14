const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const bootstrap = fs.readFileSync(path.join(__dirname, '..', 'js/core/bootstrap.js'), 'utf8');
const navigation = fs.readFileSync(path.join(__dirname, '..', 'js/core/navigation.js'), 'utf8');

test('bootstrap no longer owns screen routing or navigation event wiring', () => {
  assert.doesNotMatch(bootstrap, /function showScreen\s*\(/);
  assert.doesNotMatch(bootstrap, /querySelectorAll\('\.nav-button'\)/);
  assert.doesNotMatch(bootstrap, /querySelectorAll\('\.vault-back'\)/);
  assert.doesNotMatch(bootstrap, /vaultVisualSearch/);
});

test('navigation core owns routing and its explicit wiring seam', () => {
  assert.match(navigation, /function showScreen\s*\(name\)/);
  assert.match(navigation, /function wireNavigation\s*\(\)/);
  assert.match(navigation, /wireNavigation\(\);/);
  assert.match(navigation, /querySelectorAll\('\.nav-button'\)/);
  assert.match(navigation, /querySelectorAll\('\.vault-back'\)/);
  assert.match(navigation, /vaultVisualSearch/);
});
