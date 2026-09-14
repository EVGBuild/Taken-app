(function exposeIndexedDbShadow(root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.LumiVaultIndexedDbShadow = api;
}(typeof self !== 'undefined' ? self : this, function createIndexedDbShadowModule(root) {
  'use strict';

  const EXPORT_DB = 'lumivault-legacy-exports-v1';
  const SHADOW_DB = 'lumivault-shadow-v1';
  const DB_VERSION = 1;

  function requestResult(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('INDEXEDDB_REQUEST_FAILED'));
    });
  }

  function transactionDone(transaction) {
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onabort = () => reject(transaction.error || new Error('INDEXEDDB_TRANSACTION_ABORTED'));
      transaction.onerror = () => reject(transaction.error || new Error('INDEXEDDB_TRANSACTION_FAILED'));
    });
  }

  function openDatabase(indexedDB, name, upgrade) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(name, DB_VERSION);
      request.onupgradeneeded = () => upgrade(request.result, request.transaction);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('INDEXEDDB_OPEN_FAILED'));
      request.onblocked = () => reject(new Error('INDEXEDDB_OPEN_BLOCKED'));
    });
  }

  async function withDatabase(open, operation) {
    const database = await open();
    try {
      return await operation(database);
    } finally {
      database.close();
    }
  }

  function createIndexedDbExportRepository({ indexedDB = root.indexedDB, databaseName = EXPORT_DB } = {}) {
    if (!indexedDB) throw new Error('INDEXEDDB_UNAVAILABLE');
    const open = () => openDatabase(indexedDB, databaseName, (database) => {
      if (!database.objectStoreNames.contains('exports')) database.createObjectStore('exports', { keyPath: 'checksum' });
    });

    return Object.freeze({
      databaseName,
      async saveImmutable(snapshot) {
        return withDatabase(open, async (database) => {
          const readTransaction = database.transaction('exports', 'readonly');
          const readCompletion = transactionDone(readTransaction);
          const existing = await requestResult(readTransaction.objectStore('exports').get(snapshot.checksum));
          await readCompletion;
          if (existing) {
            if (existing.checksum !== snapshot.checksum || JSON.stringify(existing.keys) !== JSON.stringify(snapshot.keys)) {
              throw new Error('EXPORT_IMMUTABILITY_CONFLICT');
            }
            return { snapshot: existing, reused: true };
          }

          const writeTransaction = database.transaction('exports', 'readwrite');
          const writeCompletion = transactionDone(writeTransaction);
          writeTransaction.objectStore('exports').add(snapshot);
          await writeCompletion;
          return { snapshot, reused: false };
        });
      },
      async get(checksum) {
        return withDatabase(open, async (database) => {
          const transaction = database.transaction('exports', 'readonly');
          const completion = transactionDone(transaction);
          const snapshot = await requestResult(transaction.objectStore('exports').get(checksum));
          await completion;
          return snapshot || null;
        });
      }
    });
  }

  function createShadowStores(database) {
    if (!database.objectStoreNames.contains('migrations')) database.createObjectStore('migrations', { keyPath: 'sourceChecksum' });
    for (const name of ['items', 'collections', 'relations']) {
      if (!database.objectStoreNames.contains(name)) {
        const store = database.createObjectStore(name, { keyPath: ['sourceChecksum', 'recordKey'] });
        store.createIndex('bySourceChecksum', 'sourceChecksum', { unique: false });
      }
    }
  }

  async function deleteGeneration(transaction, sourceChecksum) {
    for (const name of ['items', 'collections', 'relations']) {
      const store = transaction.objectStore(name);
      const keys = await requestResult(store.index('bySourceChecksum').getAllKeys(sourceChecksum));
      keys.forEach((key) => store.delete(key));
    }
  }

  function createIndexedDbShadowAdapter({ indexedDB = root.indexedDB, databaseName = SHADOW_DB } = {}) {
    if (!indexedDB) throw new Error('INDEXEDDB_UNAVAILABLE');
    const open = () => openDatabase(indexedDB, databaseName, createShadowStores);

    async function getMigration(sourceChecksum) {
      return withDatabase(open, async (database) => {
        const transaction = database.transaction('migrations', 'readonly');
        const completion = transactionDone(transaction);
        const migration = await requestResult(transaction.objectStore('migrations').get(sourceChecksum));
        await completion;
        return migration || null;
      });
    }

    async function readTarget(sourceChecksum) {
      return withDatabase(open, async (database) => {
        const transaction = database.transaction(['migrations', 'items', 'collections', 'relations'], 'readonly');
        const completion = transactionDone(transaction);
        const migrationRequest = transaction.objectStore('migrations').get(sourceChecksum);
        const itemRequest = transaction.objectStore('items').index('bySourceChecksum').getAll(sourceChecksum);
        const collectionRequest = transaction.objectStore('collections').index('bySourceChecksum').getAll(sourceChecksum);
        const relationRequest = transaction.objectStore('relations').index('bySourceChecksum').getAll(sourceChecksum);
        const [migration, itemRows, collectionRows, relationRows] = await Promise.all([
          requestResult(migrationRequest), requestResult(itemRequest), requestResult(collectionRequest), requestResult(relationRequest)
        ]);
        await completion;
        if (!migration) return null;
        const byShadowOrder = (left, right) => left.shadowOrder - right.shadowOrder;
        const stripGeneration = ({ sourceChecksum: ignoredSource, shadowOrder: ignoredOrder, ...record }) => record;
        return {
          schemaVersion: migration.schemaVersion,
          sourceChecksum: migration.sourceChecksum,
          items: itemRows.sort(byShadowOrder).map(stripGeneration),
          collections: collectionRows.sort(byShadowOrder).map(stripGeneration),
          relations: relationRows.sort(byShadowOrder).map(stripGeneration),
          contexts: migration.contexts,
          auxiliary: migration.auxiliary,
          quarantine: migration.quarantine,
          targetChecksum: migration.targetChecksum
        };
      });
    }

    return Object.freeze({
      databaseName,
      getMigration,
      readTarget,
      async writePending(target, { abortAfterWrites = 0 } = {}) {
        const existing = await getMigration(target.sourceChecksum);
        if (existing && existing.status === 'verified' && existing.targetChecksum === target.targetChecksum) {
          return { reused: true, status: 'verified' };
        }
        return withDatabase(open, async (database) => {
          const transaction = database.transaction(['migrations', 'items', 'collections', 'relations'], 'readwrite');
          const completion = transactionDone(transaction);
          try {
            await deleteGeneration(transaction, target.sourceChecksum);
            const migration = {
              sourceChecksum: target.sourceChecksum,
              targetChecksum: target.targetChecksum,
              schemaVersion: target.schemaVersion,
              status: 'pending',
              contexts: target.contexts,
              auxiliary: target.auxiliary,
              quarantine: target.quarantine,
              counts: {
                items: target.items.length,
                collections: target.collections.length,
                relations: target.relations.length
              }
            };
            transaction.objectStore('migrations').put(migration);
            let writes = 1;
            for (const [storeName, records] of [
              ['items', target.items], ['collections', target.collections], ['relations', target.relations]
            ]) {
              const store = transaction.objectStore(storeName);
              for (let index = 0; index < records.length; index += 1) {
                const record = records[index];
                store.put({ sourceChecksum: target.sourceChecksum, shadowOrder: index, ...record });
                writes += 1;
                if (abortAfterWrites > 0 && writes >= abortAfterWrites) {
                  transaction.abort();
                  await completion;
                }
              }
            }
            await completion;
            return { reused: false, status: 'pending' };
          } catch (error) {
            if (transaction.readyState !== 'done') {
              try { transaction.abort(); } catch { /* transaction already completed or aborted */ }
            }
            throw error;
          }
        });
      },
      async markVerified(sourceChecksum, targetChecksum, verification) {
        return withDatabase(open, async (database) => {
          const transaction = database.transaction('migrations', 'readwrite');
          const completion = transactionDone(transaction);
          const store = transaction.objectStore('migrations');
          const migration = await requestResult(store.get(sourceChecksum));
          if (!migration || migration.targetChecksum !== targetChecksum || !verification || !verification.ok) {
            transaction.abort();
            try { await completion; } catch { /* expected abort */ }
            throw new Error('SHADOW_VERIFICATION_REQUIRED');
          }
          store.put({ ...migration, status: 'verified', verifiedAt: new Date().toISOString(), verification });
          await completion;
          return { status: 'verified' };
        });
      },
      async rollback(sourceChecksum) {
        return withDatabase(open, async (database) => {
          const transaction = database.transaction(['migrations', 'items', 'collections', 'relations'], 'readwrite');
          const completion = transactionDone(transaction);
          await deleteGeneration(transaction, sourceChecksum);
          transaction.objectStore('migrations').delete(sourceChecksum);
          await completion;
          return { shadowRemoved: true, exportTouched: false };
        });
      }
    });
  }

  return Object.freeze({
    EXPORT_DB,
    SHADOW_DB,
    createIndexedDbExportRepository,
    createIndexedDbShadowAdapter
  });
}));
