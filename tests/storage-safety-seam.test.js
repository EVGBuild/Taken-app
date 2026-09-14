const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const core = require('../js/storage/migration-core');
const seam = require('../js/storage/storage-safety-seam');

const fixture = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'docs/phase-0/legacy-localstorage-fixture.json'), 'utf8')).localStorage;

test('shadow migration scripts are not loaded by the product build', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.doesNotMatch(html, /migration-core|indexeddb-shadow-adapter|storage-safety-seam/);
  assert.match(html, /js\/core\/storage\.js/);
});

class MemoryGateway {
  constructor(seed = fixture) {
    this.activeAdapter = 'legacy-localStorage';
    this.values = new Map(Object.entries(seed).map(([key, value]) => [key, JSON.stringify(value)]));
  }
  getRaw(key) { return this.values.has(key) ? this.values.get(key) : null; }
  setRaw(key, value) { this.values.set(key, String(value)); }
  removeRaw(key) { this.values.delete(key); }
  read(key, fallback = []) {
    try { return JSON.parse(this.getRaw(key)) ?? fallback; } catch { return fallback; }
  }
  write(key, value) { this.setRaw(key, JSON.stringify(value)); }
  rawState() { return Object.fromEntries(core.LEGACY_KEYS.map((key) => [key, this.getRaw(key)])); }
}

class MemoryExportRepository {
  constructor() { this.exports = new Map(); }
  async saveImmutable(snapshot) {
    const existing = this.exports.get(snapshot.checksum);
    if (existing) return { snapshot: existing, reused: true };
    this.exports.set(snapshot.checksum, snapshot);
    return { snapshot, reused: false };
  }
  async get(checksum) { return this.exports.get(checksum) || null; }
}

class MemoryShadowAdapter {
  constructor() { this.targets = new Map(); this.migrations = new Map(); this.writeCount = 0; }
  async writePending(target) {
    const existing = this.migrations.get(target.sourceChecksum);
    if (existing && existing.status === 'verified' && existing.targetChecksum === target.targetChecksum) {
      return { reused: true, status: 'verified' };
    }
    this.writeCount += 1;
    this.targets.set(target.sourceChecksum, structuredClone(target));
    this.migrations.set(target.sourceChecksum, { status: 'pending', targetChecksum: target.targetChecksum });
    return { reused: false, status: 'pending' };
  }
  async readTarget(checksum) { return structuredClone(this.targets.get(checksum) || null); }
  async markVerified(checksum, targetChecksum, verification) {
    const migration = this.migrations.get(checksum);
    if (!migration || migration.targetChecksum !== targetChecksum || !verification.ok) throw new Error('SHADOW_VERIFICATION_REQUIRED');
    this.migrations.set(checksum, { ...migration, status: 'verified', verification });
  }
  async rollback(checksum) {
    this.targets.delete(checksum);
    this.migrations.delete(checksum);
    return { shadowRemoved: true, exportPreserved: true };
  }
}

test('SHA-256 implementation matches known vectors', () => {
  assert.equal(core.sha256(''), 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  assert.equal(core.sha256('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
});

test('snapshot preserves exact legacy bytes and detects tampering', () => {
  const gateway = new MemoryGateway();
  gateway.setRaw('lumiIdeas', ' [ "spaties blijven" ] ');
  const snapshot = core.captureLegacySnapshot(gateway, { exportedAt: '2026-09-13T21:00:00.000Z' });
  assert.equal(snapshot.keys.lumiIdeas, ' [ "spaties blijven" ] ');
  assert.equal(core.verifyLegacySnapshot(snapshot), true);
  assert.equal(core.verifyLegacySnapshot({ ...snapshot, keys: { ...snapshot.keys, lumiIdeas: '[]' } }), false);
});

test('the seam exports first, writes only shadow data and verifies all migration contracts', async () => {
  const gateway = new MemoryGateway();
  const before = gateway.rawState();
  const exportRepository = new MemoryExportRepository();
  const shadowAdapter = new MemoryShadowAdapter();
  const result = await seam.runShadowMigration({
    gateway, exportRepository, shadowAdapter, exportedAt: '2026-09-13T21:00:00.000Z'
  });

  assert.equal(result.status, 'verified');
  assert.equal(result.verification.ok, true);
  assert.ok(Object.values(result.verification.checks).every(Boolean));
  assert.deepEqual(gateway.rawState(), before);
  assert.equal((await exportRepository.get(result.sourceChecksum)).checksum, result.sourceChecksum);
  assert.equal(shadowAdapter.migrations.get(result.sourceChecksum).status, 'verified');
});

test('repeat migration is idempotent and creates no duplicate generation', async () => {
  const gateway = new MemoryGateway();
  const exportRepository = new MemoryExportRepository();
  const shadowAdapter = new MemoryShadowAdapter();
  const options = { gateway, exportRepository, shadowAdapter, exportedAt: '2026-09-13T21:00:00.000Z' };
  const first = await seam.runShadowMigration(options);
  const firstTarget = await shadowAdapter.readTarget(first.sourceChecksum);
  const second = await seam.runShadowMigration(options);
  const secondTarget = await shadowAdapter.readTarget(second.sourceChecksum);

  assert.equal(second.exportReused, true);
  assert.equal(second.shadowReused, true);
  assert.equal(shadowAdapter.writeCount, 1);
  assert.deepEqual(secondTarget, firstTarget);
});

test('source change after immutable export stops before a shadow write', async () => {
  const gateway = new MemoryGateway();
  const shadowAdapter = new MemoryShadowAdapter();
  const exportRepository = new MemoryExportRepository();
  const originalSave = exportRepository.saveImmutable.bind(exportRepository);
  exportRepository.saveImmutable = async (snapshot) => {
    const result = await originalSave(snapshot);
    gateway.write('lumiIdeas', ['bron veranderde']);
    return result;
  };

  await assert.rejects(() => seam.runShadowMigration({ gateway, exportRepository, shadowAdapter }), /SOURCE_CHANGED_AFTER_EXPORT/);
  assert.equal(shadowAdapter.writeCount, 0);
  assert.equal(exportRepository.exports.size, 1);
});

test('a failed shadow write cannot become verified or mutate legacy data', async () => {
  const gateway = new MemoryGateway();
  const before = gateway.rawState();
  const exportRepository = new MemoryExportRepository();
  const shadowAdapter = new MemoryShadowAdapter();
  shadowAdapter.writePending = async (target) => {
    shadowAdapter.migrations.set(target.sourceChecksum, { status: 'pending', targetChecksum: target.targetChecksum });
    throw new Error('SIMULATED_TRANSACTION_FAILURE');
  };

  await assert.rejects(() => seam.runShadowMigration({ gateway, exportRepository, shadowAdapter }), /SIMULATED_TRANSACTION_FAILURE/);
  assert.deepEqual(gateway.rawState(), before);
  assert.ok([...shadowAdapter.migrations.values()].every((migration) => migration.status !== 'verified'));
  assert.equal(exportRepository.exports.size, 1);
});

test('a changed source during shadow write removes pending shadow state but preserves the export', async () => {
  const gateway = new MemoryGateway();
  const exportRepository = new MemoryExportRepository();
  const shadowAdapter = new MemoryShadowAdapter();
  const originalWrite = shadowAdapter.writePending.bind(shadowAdapter);
  shadowAdapter.writePending = async (target) => {
    const result = await originalWrite(target);
    gateway.write('lumiIdeas', ['concurrente nieuwere invoer']);
    return result;
  };

  await assert.rejects(() => seam.runShadowMigration({ gateway, exportRepository, shadowAdapter }), /SOURCE_CHANGED_DURING_SHADOW_WRITE/);
  assert.equal(shadowAdapter.targets.size, 0);
  assert.equal(shadowAdapter.migrations.size, 0);
  assert.equal(exportRepository.exports.size, 1);
  assert.deepEqual(gateway.read('lumiIdeas'), ['concurrente nieuwere invoer']);
});

test('tampered shadow read-back remains pending and never becomes verified', async () => {
  const gateway = new MemoryGateway();
  const exportRepository = new MemoryExportRepository();
  const shadowAdapter = new MemoryShadowAdapter();
  const originalRead = shadowAdapter.readTarget.bind(shadowAdapter);
  shadowAdapter.readTarget = async (checksum) => {
    const target = await originalRead(checksum);
    target.items[0].legacy = { lost: true };
    return target;
  };

  await assert.rejects(() => seam.runShadowMigration({ gateway, exportRepository, shadowAdapter }), /SHADOW_VERIFICATION_FAILED/);
  assert.ok([...shadowAdapter.migrations.values()].every((migration) => migration.status === 'pending'));
});

test('new core quarantines malformed JSON and namespaces duplicate legacy identifiers', () => {
  const gateway = new MemoryGateway({
    ...fixture,
    mijnTaken: [{ id: 'duplicate', title: 'Taak' }],
    lumiProjects: [{ id: 'duplicate', title: 'Project' }]
  });
  gateway.setRaw('lumiIdeas', '{kapot');
  const snapshot = core.captureLegacySnapshot(gateway);
  const target = core.buildTargetModel(snapshot);
  const duplicates = target.items.filter((item) => item.id === 'duplicate');

  assert.equal(duplicates.length, 2);
  assert.equal(new Set(duplicates.map((item) => item.recordKey)).size, 2);
  assert.deepEqual(target.quarantine, [{ sourceKey: 'lumiIdeas', raw: '{kapot', reason: 'INVALID_JSON' }]);
  assert.equal(core.verifyTarget(snapshot, target).ok, true);
});

test('large attachment survives conversion, verification and byte-exact restore', async () => {
  const largeData = `data:application/pdf;base64,${'A'.repeat(6 * 1024 * 1024)}`;
  const largeFixture = structuredClone(fixture);
  largeFixture.lumiDocuments = [{
    id: 'large-document',
    title: 'Groot testdocument',
    fileName: 'large.pdf',
    fileData: largeData,
    unknownFutureField: { preserve: true }
  }];
  const gateway = new MemoryGateway(largeFixture);
  const before = gateway.rawState();
  const exportRepository = new MemoryExportRepository();
  const shadowAdapter = new MemoryShadowAdapter();
  const result = await seam.runShadowMigration({ gateway, exportRepository, shadowAdapter });
  assert.equal(result.verification.checks.attachments, true);
  assert.equal(result.verification.checks.unknownFields, true);

  gateway.write('lumiDocuments', []);
  const restored = await seam.restoreLegacyFromExport({ gateway, exportRepository, sourceChecksum: result.sourceChecksum });
  assert.equal(restored.verified, true);
  assert.deepEqual(gateway.rawState(), before);
});

test('rollback removes only shadow state and preserves legacy plus immutable export', async () => {
  const gateway = new MemoryGateway();
  const before = gateway.rawState();
  const exportRepository = new MemoryExportRepository();
  const shadowAdapter = new MemoryShadowAdapter();
  const result = await seam.runShadowMigration({ gateway, exportRepository, shadowAdapter });
  const rollback = await seam.rollbackShadow({ shadowAdapter, sourceChecksum: result.sourceChecksum });

  assert.deepEqual(gateway.rawState(), before);
  assert.equal(rollback.shadowRemoved, true);
  assert.equal(shadowAdapter.targets.has(result.sourceChecksum), false);
  assert.ok(await exportRepository.get(result.sourceChecksum));
});
