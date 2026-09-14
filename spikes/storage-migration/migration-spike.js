const { createHash } = require('node:crypto');

const LEGACY_KEYS = Object.freeze([
  'mijnTaken',
  'lumiEnergy',
  'lumiMorningCheckin',
  'lumiProjects',
  'lumiWishlist',
  'lumiLists',
  'lumiIdeas',
  'lumiInbox',
  'lumiFinance',
  'lumiDocuments',
  'lumiActionDraft',
  'lumiWishlistDragTip',
  'lumiFeedbackDraft',
  'lumiSettings',
  'lumiTodayOrder',
  'lumiBucketlist',
]);

const SPIKE_KEYS = Object.freeze({
  export: 'lumiMigrationSpikeV1:legacy-export',
  target: 'lumiMigrationSpikeV1:data',
  state: 'lumiMigrationSpikeV1:state',
});

function stableStringify(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
}

function checksum(value) {
  return createHash('sha256').update(stableStringify(value)).digest('hex');
}

function captureLegacySnapshot(storage, { exportedAt = new Date().toISOString() } = {}) {
  const keys = Object.fromEntries(LEGACY_KEYS.map((key) => [key, storage.getItem(key)]));
  return {
    format: 'lumivault-legacy-export',
    version: 1,
    exportedAt,
    keys,
    checksum: checksum(keys),
  };
}

function parseSnapshot(snapshot) {
  const parsed = {};
  const quarantine = [];
  for (const [key, raw] of Object.entries(snapshot.keys)) {
    if (raw === null) {
      parsed[key] = null;
      continue;
    }
    try {
      parsed[key] = JSON.parse(raw);
    } catch {
      parsed[key] = null;
      quarantine.push({ sourceKey: key, raw, reason: 'INVALID_JSON' });
    }
  }
  return { parsed, quarantine };
}

function deterministicId(sourceKey, index, legacy) {
  if (legacy && typeof legacy === 'object' && typeof legacy.id === 'string' && legacy.id) return legacy.id;
  return `generated:${sourceKey}:${index}:${checksum(legacy).slice(0, 12)}`;
}

function asRecord(sourceKey, index, kind, legacy, canonical = {}) {
  const id = deterministicId(sourceKey, index, legacy);
  return {
    id,
    recordKey: `${sourceKey}:${id}`,
    kind,
    source: { key: sourceKey, index, hadLegacyId: Boolean(legacy && typeof legacy === 'object' && legacy.id) },
    canonical,
    legacy,
  };
}

function taskState(item) {
  if (item?.done) return 'completed';
  if (item?.lifecycle?.state === 'deferred') return 'later';
  if (item?.blocker?.enabled) return 'waiting';
  return item?.lifecycle?.state || 'open';
}

function buildTargetModel(snapshot) {
  const { parsed, quarantine } = parseSnapshot(snapshot);
  const items = [];
  const collections = [];
  const relations = [];
  const addFlat = (key, kind, canonicalize) => {
    const values = Array.isArray(parsed[key]) ? parsed[key] : [];
    values.forEach((legacy, index) => items.push(asRecord(key, index, kind, legacy, canonicalize(legacy, index))));
  };

  addFlat('mijnTaken', 'task', (item) => ({
    title: String(item?.title ?? item?.text ?? ''),
    state: taskState(item),
    context: item?.context === 'household' || item?.type === 'household' ? 'household' : 'general',
  }));
  addFlat('lumiProjects', 'project', (item) => ({ title: String(item?.title ?? 'Project') }));
  addFlat('lumiWishlist', 'purchase', (item) => ({ title: String(item?.name ?? ''), state: item?.bought ? 'completed' : 'open' }));
  addFlat('lumiIdeas', 'idea', (item) => ({ title: String(typeof item === 'string' ? item : item?.text ?? '') }));
  addFlat('lumiInbox', 'capture', (item) => ({ title: String(typeof item === 'string' ? item : item?.text ?? '') }));
  addFlat('lumiFinance', 'financial', (item) => ({ title: String(item?.title ?? ''), state: item?.status ?? 'open' }));
  addFlat('lumiDocuments', 'document', (item) => ({ title: String(item?.title ?? ''), fileName: String(item?.fileName ?? '') }));

  const addCollections = (key, kind, entryKind) => {
    const values = Array.isArray(parsed[key]) ? parsed[key] : [];
    values.forEach((legacy, collectionIndex) => {
      const collection = asRecord(key, collectionIndex, kind, legacy, { title: String(legacy?.name ?? '') });
      collections.push(collection);
      const entries = Array.isArray(legacy?.items) ? legacy.items : [];
      entries.forEach((entry, entryIndex) => {
        const item = asRecord(`${key}[${collectionIndex}].items`, entryIndex, entryKind, entry, {
          title: String(typeof entry === 'string' ? entry : entry?.text ?? ''),
          state: typeof entry === 'object' && entry?.done ? 'completed' : 'open',
        });
        items.push(item);
        relations.push({ type: 'contains', from: collection.recordKey, to: item.recordKey });
      });
    });
  };
  addCollections('lumiLists', 'list', 'list-entry');
  addCollections('lumiBucketlist', 'bucket-list', 'bucket-entry');

  const contextKeys = ['lumiEnergy', 'lumiMorningCheckin', 'lumiSettings'];
  const auxiliaryKeys = ['lumiActionDraft', 'lumiWishlistDragTip', 'lumiFeedbackDraft', 'lumiTodayOrder'];
  const contexts = Object.fromEntries(contextKeys.map((key) => [key, parsed[key]]));
  const auxiliary = Object.fromEntries(auxiliaryKeys.map((key) => [key, parsed[key]]));
  const target = {
    schemaVersion: 'spike-1',
    sourceChecksum: snapshot.checksum,
    items,
    collections,
    relations,
    contexts,
    auxiliary,
    quarantine,
  };
  return { ...target, targetChecksum: checksum(target) };
}

function reconstructParsedLegacy(target) {
  const result = Object.fromEntries(LEGACY_KEYS.map((key) => [key, null]));
  const flatKeys = ['mijnTaken', 'lumiProjects', 'lumiWishlist', 'lumiIdeas', 'lumiInbox', 'lumiFinance', 'lumiDocuments'];
  for (const key of flatKeys) {
    result[key] = target.items
      .filter((item) => item.source.key === key)
      .sort((a, b) => a.source.index - b.source.index)
      .map((item) => item.legacy);
  }
  for (const key of ['lumiLists', 'lumiBucketlist']) {
    result[key] = target.collections
      .filter((item) => item.source.key === key)
      .sort((a, b) => a.source.index - b.source.index)
      .map((item) => item.legacy);
  }
  Object.assign(result, target.contexts, target.auxiliary);
  return result;
}

function roundTripReport(snapshot, target) {
  const { parsed, quarantine } = parseSnapshot(snapshot);
  const reconstructed = reconstructParsedLegacy(target);
  const results = LEGACY_KEYS.map((key) => {
    const invalid = quarantine.find((entry) => entry.sourceKey === key);
    if (invalid) {
      const migrated = target.quarantine.find((entry) => entry.sourceKey === key);
      return { key, equal: Boolean(migrated && migrated.raw === invalid.raw), mode: 'raw-quarantine' };
    }
    return { key, equal: stableStringify(parsed[key]) === stableStringify(reconstructed[key]), mode: 'semantic' };
  });
  return { ok: results.every((entry) => entry.equal), results };
}

function runCopyOnWriteMigration(storage, options = {}) {
  const snapshot = captureLegacySnapshot(storage, options);
  const existingExportRaw = storage.getItem(SPIKE_KEYS.export);
  if (existingExportRaw) {
    const existingExport = JSON.parse(existingExportRaw);
    if (existingExport.checksum !== snapshot.checksum) throw new Error('SOURCE_CHANGED_AFTER_EXPORT');
  } else {
    storage.setItem(SPIKE_KEYS.export, JSON.stringify(snapshot));
  }

  const existingTargetRaw = storage.getItem(SPIKE_KEYS.target);
  if (existingTargetRaw) {
    const existingTarget = JSON.parse(existingTargetRaw);
    if (existingTarget.sourceChecksum === snapshot.checksum) {
      return { snapshot, target: existingTarget, reused: true, roundTrip: roundTripReport(snapshot, existingTarget) };
    }
    throw new Error('TARGET_SOURCE_MISMATCH');
  }

  const target = buildTargetModel(snapshot);
  const serialized = JSON.stringify(target);
  storage.setItem(SPIKE_KEYS.target, serialized);
  if (storage.getItem(SPIKE_KEYS.target) !== serialized) throw new Error('TARGET_VERIFICATION_FAILED');
  const roundTrip = roundTripReport(snapshot, target);
  if (!roundTrip.ok) throw new Error('ROUND_TRIP_FAILED');
  storage.setItem(SPIKE_KEYS.state, JSON.stringify({ status: 'verified', sourceChecksum: snapshot.checksum, targetChecksum: target.targetChecksum }));
  return { snapshot, target, reused: false, roundTrip };
}

function rollbackSpike(storage) {
  storage.removeItem(SPIKE_KEYS.target);
  storage.removeItem(SPIKE_KEYS.state);
  return { exportPreserved: storage.getItem(SPIKE_KEYS.export) !== null };
}

function restoreLegacySnapshot(snapshot, storage) {
  if (checksum(snapshot.keys) !== snapshot.checksum) throw new Error('EXPORT_CHECKSUM_MISMATCH');
  for (const [key, raw] of Object.entries(snapshot.keys)) {
    if (raw === null) storage.removeItem(key);
    else storage.setItem(key, raw);
  }
}

module.exports = {
  LEGACY_KEYS,
  SPIKE_KEYS,
  buildTargetModel,
  captureLegacySnapshot,
  checksum,
  restoreLegacySnapshot,
  rollbackSpike,
  roundTripReport,
  runCopyOnWriteMigration,
  stableStringify,
};
