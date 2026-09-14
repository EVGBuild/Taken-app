const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'css/layers.json'), 'utf8'));

function firstPartyStylesheets() {
  return [...indexHtml.matchAll(/<link\s+rel=["']stylesheet["']\s+href=["']\.\/css\/([^"'?]+\.css)(?:\?[^"']*)?["']/g)]
    .map(match => match[1]);
}

test('active first-party CSS follows the explicit design-system cascade contract', () => {
  assert.deepEqual(firstPartyStylesheets(), manifest.entryOrder);
});

test('every active stylesheet belongs to exactly one ownership zone', () => {
  const files = Object.values(manifest.zones).flatMap(zone => zone.files);
  assert.deepEqual([...files].sort(), [...manifest.entryOrder].sort());
  assert.equal(new Set(files).size, files.length, 'a stylesheet is assigned to multiple ownership zones');
});

test('the design-system manifest only references existing CSS files', () => {
  for (const file of manifest.entryOrder) {
    assert.ok(fs.existsSync(path.join(root, 'css', file)), `missing stylesheet: ${file}`);
  }
});
