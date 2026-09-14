const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  LEGACY_KEYS,
  SPIKE_KEYS,
  captureLegacySnapshot,
  restoreLegacySnapshot,
  rollbackSpike,
  runCopyOnWriteMigration,
} = require('../spikes/storage-migration/migration-spike');

const fixture = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'docs/phase-0/legacy-localstorage-fixture.json'), 'utf8')).localStorage;

class MemoryStorage {
  constructor(seed = {}, { failOnKey = '' } = {}) {
    this.values = new Map(Object.entries(seed));
    this.failOnKey = failOnKey;
    this.writes = [];
    this.removals = [];
  }
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
  setItem(key, value) {
    if (key === this.failOnKey) throw new Error('QUOTA_EXCEEDED');
    this.writes.push(key);
    this.values.set(key, String(value));
  }
  removeItem(key) { this.removals.push(key); this.values.delete(key); }
}

function seededStorage(extra = {}, options) {
  const encoded = Object.fromEntries(Object.entries({ ...fixture, ...extra }).map(([key, value]) => [key, JSON.stringify(value)]));
  return new MemoryStorage(encoded, options);
}

test('the spike covers exactly the current storage contract', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'js/core/storage.js'), 'utf8');
  const keysBlock = source.slice(source.indexOf('const KEYS'), source.indexOf('});') + 3);
  const appKeys = [...keysBlock.matchAll(/^\s+\w+: '([^']+)'/gm)].map((match) => match[1]);
  assert.deepEqual([...LEGACY_KEYS].sort(), appKeys.sort());
});

test('copy-on-write migration never mutates a legacy key', () => {
  const storage = seededStorage();
  const before = Object.fromEntries(LEGACY_KEYS.map((key) => [key, storage.getItem(key)]));
  const result = runCopyOnWriteMigration(storage, { exportedAt: '2026-09-13T19:00:00.000Z' });
  const after = Object.fromEntries(LEGACY_KEYS.map((key) => [key, storage.getItem(key)]));

  assert.deepEqual(after, before);
  assert.equal(result.roundTrip.ok, true);
  assert.equal(JSON.parse(storage.getItem(SPIKE_KEYS.state)).status, 'verified');
  assert.equal(result.target.quarantine.length, 0);
});

test('existing identifiers remain exact and absent identifiers are deterministic', () => {
  const first = runCopyOnWriteMigration(seededStorage(), { exportedAt: '2026-09-13T19:00:00.000Z' }).target;
  const second = runCopyOnWriteMigration(seededStorage(), { exportedAt: '2026-09-13T20:00:00.000Z' }).target;
  assert.ok(first.items.some((item) => item.id === 'legacy-waiting'));
  assert.ok(first.items.some((item) => item.id === 'purchase-needed'));
  assert.equal(first.items.find((item) => item.canonical.title === 'Bel de garage over de afspraak').id,
    second.items.find((item) => item.canonical.title === 'Bel de garage over de afspraak').id);
});

test('duplicate legacy ids remain intact while record keys stay unambiguous', () => {
  const storage = seededStorage({
    mijnTaken: [{ id: 'same-id', title: 'Taak' }],
    lumiProjects: [{ id: 'same-id', title: 'Project' }],
  });
  const { target } = runCopyOnWriteMigration(storage, { exportedAt: '2026-09-13T19:00:00.000Z' });
  const duplicates = target.items.filter((item) => item.id === 'same-id');
  assert.equal(duplicates.length, 2);
  assert.equal(new Set(duplicates.map((item) => item.recordKey)).size, 2);
});

test('list and bucket nesting is represented by collections and explicit relations', () => {
  const { target, roundTrip } = runCopyOnWriteMigration(seededStorage(), { exportedAt: '2026-09-13T19:00:00.000Z' });
  assert.ok(target.collections.some((entry) => entry.kind === 'list' && entry.canonical.title === 'Weekendtas'));
  assert.ok(target.collections.some((entry) => entry.kind === 'bucket-list' && entry.canonical.title === '2026'));
  assert.ok(target.relations.every((relation) => relation.type === 'contains'));
  assert.ok(target.relations.length >= 3);
  assert.equal(roundTrip.ok, true);
});

test('unknown fields and base64 attachments survive the semantic round trip', () => {
  const documents = [{
    id: 'document-with-file',
    title: 'Garantiebon',
    fileData: 'data:application/pdf;base64,AAECAwQ=',
    unknownFutureField: { nested: ['keep', 42] },
  }];
  const storage = seededStorage({ lumiDocuments: documents });
  const result = runCopyOnWriteMigration(storage, { exportedAt: '2026-09-13T19:00:00.000Z' });
  const migrated = result.target.items.find((item) => item.id === 'document-with-file');
  assert.deepEqual(migrated.legacy.unknownFutureField, { nested: ['keep', 42] });
  assert.equal(migrated.legacy.fileData, documents[0].fileData);
  assert.equal(result.roundTrip.ok, true);
});

test('malformed data is quarantined while valid domains still migrate', () => {
  const storage = seededStorage();
  storage.values.set('lumiIdeas', '{not json');
  const result = runCopyOnWriteMigration(storage, { exportedAt: '2026-09-13T19:00:00.000Z' });
  assert.deepEqual(result.target.quarantine, [{ sourceKey: 'lumiIdeas', raw: '{not json', reason: 'INVALID_JSON' }]);
  assert.ok(result.target.items.some((item) => item.id === 'legacy-waiting'));
  assert.equal(result.roundTrip.ok, true);
});

test('running the same migration twice is idempotent', () => {
  const storage = seededStorage();
  const first = runCopyOnWriteMigration(storage, { exportedAt: '2026-09-13T19:00:00.000Z' });
  const writesAfterFirst = storage.writes.length;
  const second = runCopyOnWriteMigration(storage, { exportedAt: '2026-09-13T21:00:00.000Z' });
  assert.equal(second.reused, true);
  assert.equal(second.target.targetChecksum, first.target.targetChecksum);
  assert.equal(storage.writes.length, writesAfterFirst);
});

test('a changed source after export stops instead of overwriting evidence', () => {
  const storage = seededStorage();
  runCopyOnWriteMigration(storage, { exportedAt: '2026-09-13T19:00:00.000Z' });
  storage.values.set('lumiIdeas', JSON.stringify(['Nieuwe bronwaarde']));
  assert.throws(() => runCopyOnWriteMigration(storage), /SOURCE_CHANGED_AFTER_EXPORT/);
  assert.ok(storage.getItem(SPIKE_KEYS.export));
});

test('quota failure leaves legacy bytes untouched and no partial target', () => {
  const storage = seededStorage({}, { failOnKey: SPIKE_KEYS.target });
  const before = Object.fromEntries(LEGACY_KEYS.map((key) => [key, storage.getItem(key)]));
  assert.throws(() => runCopyOnWriteMigration(storage), /QUOTA_EXCEEDED/);
  assert.deepEqual(Object.fromEntries(LEGACY_KEYS.map((key) => [key, storage.getItem(key)])), before);
  assert.equal(storage.getItem(SPIKE_KEYS.target), null);
  assert.ok(storage.getItem(SPIKE_KEYS.export), 'the pre-migration export remains available');
});

test('rollback removes only spike state and an export restores exact legacy bytes', () => {
  const storage = seededStorage();
  const before = Object.fromEntries(LEGACY_KEYS.map((key) => [key, storage.getItem(key)]));
  const { snapshot } = runCopyOnWriteMigration(storage, { exportedAt: '2026-09-13T19:00:00.000Z' });
  const rollback = rollbackSpike(storage);
  assert.equal(rollback.exportPreserved, true);
  assert.equal(storage.getItem(SPIKE_KEYS.target), null);
  assert.equal(storage.getItem(SPIKE_KEYS.state), null);
  assert.deepEqual(Object.fromEntries(LEGACY_KEYS.map((key) => [key, storage.getItem(key)])), before);

  const restored = new MemoryStorage();
  restoreLegacySnapshot(snapshot, restored);
  assert.deepEqual(Object.fromEntries(LEGACY_KEYS.map((key) => [key, restored.getItem(key)])), before);
});
