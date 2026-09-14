(function exposeMigrationCore(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.LumiVaultMigrationCore = api;
}(typeof self !== 'undefined' ? self : this, function createMigrationCore() {
  'use strict';

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
    'lumiBucketlist'
  ]);

  const FLAT_DOMAINS = Object.freeze([
    'mijnTaken', 'lumiProjects', 'lumiWishlist', 'lumiIdeas',
    'lumiInbox', 'lumiFinance', 'lumiDocuments'
  ]);

  function stableStringify(value) {
    if (value === undefined) return 'undefined';
    if (value === null || typeof value !== 'object') return JSON.stringify(value);
    if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
  }

  function utf8(value) {
    return unescape(encodeURIComponent(value));
  }

  // Synchronous SHA-256 keeps snapshot creation atomic with the localStorage read.
  function sha256(value) {
    const input = utf8(String(value));
    const maxWord = Math.pow(2, 32);
    const words = [];
    const hash = [];
    const constants = [];
    const composite = {};
    let primeCounter = 0;
    let candidate = 2;
    while (primeCounter < 64) {
      if (!composite[candidate]) {
        for (let multiple = candidate * candidate; multiple < 312; multiple += candidate) composite[multiple] = true;
        if (primeCounter < 8) hash[primeCounter] = (Math.pow(candidate, 0.5) * maxWord) | 0;
        constants[primeCounter] = (Math.pow(candidate, 1 / 3) * maxWord) | 0;
        primeCounter += 1;
      }
      candidate += 1;
    }

    const bitLength = input.length * 8;
    let padded = `${input}\x80`;
    while (padded.length % 64 !== 56) padded += '\x00';
    for (let index = 0; index < padded.length; index += 1) {
      words[index >> 2] |= padded.charCodeAt(index) << ((3 - index) % 4) * 8;
    }
    words.push((bitLength / maxWord) | 0);
    words.push(bitLength | 0);

    for (let block = 0; block < words.length; block += 16) {
      const schedule = words.slice(block, block + 16);
      const previous = hash.slice(0);
      for (let round = 0; round < 64; round += 1) {
        const w15 = schedule[round - 15];
        const w2 = schedule[round - 2];
        const a = hash[0];
        const e = hash[4];
        const word = round < 16 ? schedule[round] : (
          schedule[round - 16]
          + ((w15 >>> 7 | w15 << 25) ^ (w15 >>> 18 | w15 << 14) ^ (w15 >>> 3))
          + schedule[round - 7]
          + ((w2 >>> 17 | w2 << 15) ^ (w2 >>> 19 | w2 << 13) ^ (w2 >>> 10))
        ) | 0;
        schedule[round] = word;
        const temp1 = (
          hash[7]
          + ((e >>> 6 | e << 26) ^ (e >>> 11 | e << 21) ^ (e >>> 25 | e << 7))
          + ((e & hash[5]) ^ (~e & hash[6]))
          + constants[round]
          + word
        ) | 0;
        const temp2 = (
          ((a >>> 2 | a << 30) ^ (a >>> 13 | a << 19) ^ (a >>> 22 | a << 10))
          + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]))
        ) | 0;
        hash.pop();
        hash.unshift((temp1 + temp2) | 0);
        hash[4] = (hash[4] + temp1) | 0;
      }
      for (let index = 0; index < 8; index += 1) hash[index] = (hash[index] + previous[index]) | 0;
    }

    return hash.map((word) => {
      let hex = '';
      for (let byte = 3; byte >= 0; byte -= 1) hex += ((word >> (byte * 8)) & 255).toString(16).padStart(2, '0');
      return hex;
    }).join('');
  }

  function checksum(value) {
    return sha256(stableStringify(value));
  }

  function byteLength(value) {
    return utf8(String(value)).length;
  }

  function captureLegacySnapshot(gateway, { exportedAt = new Date().toISOString() } = {}) {
    const keys = Object.fromEntries(LEGACY_KEYS.map((key) => [key, gateway.getRaw(key)]));
    return Object.freeze({
      format: 'lumivault-legacy-export',
      version: 1,
      source: gateway.activeAdapter || 'legacy-localStorage',
      exportedAt,
      checksumAlgorithm: 'SHA-256',
      keyNames: LEGACY_KEYS.slice(),
      byteLength: Object.values(keys).reduce((total, raw) => total + (raw === null ? 0 : byteLength(raw)), 0),
      keys: Object.freeze(keys),
      checksum: checksum(keys)
    });
  }

  function verifyLegacySnapshot(snapshot) {
    return Boolean(
      snapshot
      && snapshot.format === 'lumivault-legacy-export'
      && snapshot.version === 1
      && snapshot.checksumAlgorithm === 'SHA-256'
      && stableStringify(snapshot.keyNames) === stableStringify(LEGACY_KEYS)
      && checksum(snapshot.keys) === snapshot.checksum
    );
  }

  function parseSnapshot(snapshot) {
    if (!verifyLegacySnapshot(snapshot)) throw new Error('EXPORT_INTEGRITY_FAILED');
    const parsed = {};
    const quarantine = [];
    for (const key of LEGACY_KEYS) {
      const raw = snapshot.keys[key];
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
      legacy
    };
  }

  function taskState(item) {
    if (item && item.done) return 'completed';
    if (item && item.lifecycle && item.lifecycle.state === 'deferred') return 'later';
    if (item && item.blocker && item.blocker.enabled) return 'waiting';
    return (item && item.lifecycle && item.lifecycle.state) || 'open';
  }

  function taskCanonical(item) {
    const deadline = item && item.deadline;
    const blocker = item && item.blocker;
    const lifecycle = item && item.lifecycle;
    return {
      title: String((item && (item.title ?? item.text)) ?? ''),
      state: taskState(item),
      context: item && (item.context === 'household' || item.type === 'household') ? 'household' : 'general',
      dueDate: (item && item.dueDate) || (deadline && deadline.enabled ? deadline.date || null : null),
      followUpDate: (item && item.followUpDate) || (blocker && blocker.availableFrom) || null,
      resurfaceDate: (item && item.resurfaceDate) || (lifecycle && lifecycle.deferredUntil) || null,
      recurrence: (item && (item.recurrence || item.repeat)) || null
    };
  }

  function buildTargetModel(snapshot) {
    const { parsed, quarantine } = parseSnapshot(snapshot);
    const items = [];
    const collections = [];
    const relations = [];
    const addFlat = (key, kind, canonicalize) => {
      const values = Array.isArray(parsed[key]) ? parsed[key] : [];
      values.forEach((legacy, index) => items.push(asRecord(key, index, kind, legacy, canonicalize(legacy))));
    };

    addFlat('mijnTaken', 'task', taskCanonical);
    addFlat('lumiProjects', 'project', (item) => ({ title: String((item && item.title) || 'Project') }));
    addFlat('lumiWishlist', 'purchase', (item) => ({ title: String((item && item.name) || ''), state: item && item.bought ? 'completed' : 'open' }));
    addFlat('lumiIdeas', 'idea', (item) => ({ title: String(typeof item === 'string' ? item : (item && item.text) || '') }));
    addFlat('lumiInbox', 'capture', (item) => ({ title: String(typeof item === 'string' ? item : (item && item.text) || '') }));
    addFlat('lumiFinance', 'financial', (item) => ({ title: String((item && item.title) || ''), state: (item && item.status) || 'open' }));
    addFlat('lumiDocuments', 'document', (item) => ({ title: String((item && item.title) || ''), fileName: String((item && item.fileName) || '') }));

    const addCollections = (key, kind, entryKind) => {
      const values = Array.isArray(parsed[key]) ? parsed[key] : [];
      values.forEach((legacy, collectionIndex) => {
        const collection = asRecord(key, collectionIndex, kind, legacy, { title: String((legacy && legacy.name) || '') });
        collections.push(collection);
        const entries = legacy && Array.isArray(legacy.items) ? legacy.items : [];
        entries.forEach((entry, entryIndex) => {
          const sourceKey = `${key}[${collectionIndex}].items`;
          const item = asRecord(sourceKey, entryIndex, entryKind, entry, {
            title: String(typeof entry === 'string' ? entry : (entry && entry.text) || ''),
            state: entry && typeof entry === 'object' && entry.done ? 'completed' : 'open'
          });
          items.push(item);
          relations.push({
            recordKey: `contains:${collection.recordKey}:${item.recordKey}`,
            type: 'contains',
            from: collection.recordKey,
            to: item.recordKey
          });
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
      schemaVersion: 'shadow-1',
      sourceChecksum: snapshot.checksum,
      items,
      collections,
      relations,
      contexts,
      auxiliary,
      quarantine
    };
    return { ...target, targetChecksum: checksum(target) };
  }

  function reconstructParsedLegacy(target) {
    const result = Object.fromEntries(LEGACY_KEYS.map((key) => [key, null]));
    for (const key of FLAT_DOMAINS) {
      result[key] = target.items
        .filter((item) => item.source.key === key)
        .sort((left, right) => left.source.index - right.source.index)
        .map((item) => item.legacy);
    }
    for (const key of ['lumiLists', 'lumiBucketlist']) {
      result[key] = target.collections
        .filter((item) => item.source.key === key)
        .sort((left, right) => left.source.index - right.source.index)
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

  function countAttachments(value) {
    if (!value || typeof value !== 'object') return 0;
    let count = 0;
    for (const [key, child] of Object.entries(value)) {
      if (typeof child === 'string' && /(filedata|attachment|base64|dataurl)/i.test(key)) count += 1;
      else count += countAttachments(child);
    }
    return count;
  }

  function verifyTarget(snapshot, target) {
    const { parsed } = parseSnapshot(snapshot);
    const roundTrip = roundTripReport(snapshot, target);
    const taskRecords = target.items.filter((item) => item.source.key === 'mijnTaken');
    const sourceTasks = Array.isArray(parsed.mijnTaken) ? parsed.mijnTaken : [];
    const nestedCount = ['lumiLists', 'lumiBucketlist'].reduce((total, key) => (
      total + (Array.isArray(parsed[key]) ? parsed[key].reduce((sum, collection) => sum + (Array.isArray(collection && collection.items) ? collection.items.length : 0), 0) : 0)
    ), 0);
    const flatCount = FLAT_DOMAINS.reduce((total, key) => total + (Array.isArray(parsed[key]) ? parsed[key].length : 0), 0);
    const collectionCount = ['lumiLists', 'lumiBucketlist'].reduce((total, key) => total + (Array.isArray(parsed[key]) ? parsed[key].length : 0), 0);
    const existingIdsPreserved = target.items.concat(target.collections).every((record) => (
      !record.source.hadLegacyId || record.id === record.legacy.id
    ));
    const taskSemanticsPreserved = taskRecords.every((record) => (
      stableStringify(record.canonical) === stableStringify(taskCanonical(record.legacy))
    ));
    const { targetChecksum, ...targetWithoutChecksum } = target;
    const checks = {
      sourceChecksum: target.sourceChecksum === snapshot.checksum,
      targetChecksum: checksum(targetWithoutChecksum) === targetChecksum,
      itemCounts: target.items.length === flatCount + nestedCount,
      collectionCounts: target.collections.length === collectionCount,
      relationCounts: target.relations.length === nestedCount,
      existingIds: existingIdsPreserved,
      statesAndLifecycle: taskSemanticsPreserved,
      dates: taskSemanticsPreserved,
      recurrence: taskSemanticsPreserved,
      householdIndependentOfRecurrence: sourceTasks.length === taskRecords.length && taskSemanticsPreserved,
      collections: target.collections.every((record) => record.kind === 'list' || record.kind === 'bucket-list'),
      relations: target.relations.every((relation) => relation.type === 'contains' && relation.from && relation.to),
      unknownFields: roundTrip.ok,
      attachments: countAttachments(parsed) === countAttachments(reconstructParsedLegacy(target)),
      roundTrip: roundTrip.ok
    };
    return {
      ok: Object.values(checks).every(Boolean),
      checks,
      counts: {
        items: target.items.length,
        collections: target.collections.length,
        relations: target.relations.length,
        quarantine: target.quarantine.length,
        attachments: countAttachments(parsed)
      },
      roundTrip
    };
  }

  function restoreLegacySnapshot(snapshot, gateway) {
    if (!verifyLegacySnapshot(snapshot)) throw new Error('EXPORT_INTEGRITY_FAILED');
    for (const key of LEGACY_KEYS) {
      const raw = snapshot.keys[key];
      if (raw === null) gateway.removeRaw(key);
      else gateway.setRaw(key, raw);
    }
  }

  return Object.freeze({
    LEGACY_KEYS,
    buildTargetModel,
    captureLegacySnapshot,
    checksum,
    reconstructParsedLegacy,
    restoreLegacySnapshot,
    roundTripReport,
    sha256,
    stableStringify,
    verifyLegacySnapshot,
    verifyTarget
  });
}));
