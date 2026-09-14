(async function runIndexedDbContract() {
  'use strict';

  const statusNode = document.getElementById('status');
  const resultNode = document.getElementById('result');
  const exportDatabaseName = 'lumivault-browser-contract-exports-v1';
  const shadowDatabaseName = 'lumivault-browser-contract-shadow-v1';
  const core = window.LumiVaultMigrationCore;
  const adapters = window.LumiVaultIndexedDbShadow;
  const seam = window.LumiVaultStorageSafetySeam;

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  function rawState() {
    return Object.fromEntries(core.LEGACY_KEYS.map((key) => [key, localStorage.getItem(key)]));
  }

  function deleteDatabase(name) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(name);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error || new Error(`DELETE_FAILED:${name}`));
      request.onblocked = () => reject(new Error(`DELETE_BLOCKED:${name}`));
    });
  }

  function seed(values) {
    for (const key of core.LEGACY_KEYS) localStorage.removeItem(key);
    for (const [key, value] of Object.entries(values)) localStorage.setItem(key, JSON.stringify(value));
  }

  try {
    assert(typeof indexedDB !== 'undefined', 'INDEXEDDB_UNAVAILABLE');
    await deleteDatabase(exportDatabaseName);
    await deleteDatabase(shadowDatabaseName);

    const fixtureResponse = await fetch('../../docs/phase-0/legacy-localstorage-fixture.json');
    assert(fixtureResponse.ok, 'FIXTURE_LOAD_FAILED');
    const fixture = (await fixtureResponse.json()).localStorage;
    seed(fixture);
    const originalBytes = rawState();

    const exportRepository = adapters.createIndexedDbExportRepository({ indexedDB, databaseName: exportDatabaseName });
    const shadowAdapter = adapters.createIndexedDbShadowAdapter({ indexedDB, databaseName: shadowDatabaseName });
    const first = await seam.runShadowMigration({
      gateway: storageGateway,
      exportRepository,
      shadowAdapter,
      exportedAt: '2026-09-13T21:30:00.000Z'
    });
    assert(first.status === 'verified', 'FIRST_RUN_NOT_VERIFIED');
    assert(first.verification.ok, 'LEGACY_SHADOW_ROUNDTRIP_FAILED');
    assert(JSON.stringify(rawState()) === JSON.stringify(originalBytes), 'LEGACY_MUTATED_BY_SHADOW_WRITE');

    const second = await seam.runShadowMigration({
      gateway: storageGateway,
      exportRepository,
      shadowAdapter,
      exportedAt: '2026-09-13T21:30:00.000Z'
    });
    assert(second.exportReused && second.shadowReused, 'SECOND_RUN_NOT_IDEMPOTENT');

    const interruptTarget = core.buildTargetModel(core.captureLegacySnapshot(storageGateway, {
      exportedAt: '2026-09-13T21:31:00.000Z'
    }));
    interruptTarget.sourceChecksum = `interrupt:${interruptTarget.sourceChecksum}`;
    interruptTarget.targetChecksum = core.checksum((({ targetChecksum, ...rest }) => rest)(interruptTarget));
    let interrupted = false;
    try {
      await shadowAdapter.writePending(interruptTarget, { abortAfterWrites: 3 });
    } catch {
      interrupted = true;
    }
    assert(interrupted, 'INTERRUPTED_TRANSACTION_DID_NOT_ABORT');
    assert(await shadowAdapter.getMigration(interruptTarget.sourceChecksum) === null, 'ABORT_LEFT_PARTIAL_MIGRATION');

    const rollback = await seam.rollbackShadow({ shadowAdapter, sourceChecksum: first.sourceChecksum });
    assert(rollback.shadowRemoved, 'ROLLBACK_FAILED');
    assert(await shadowAdapter.getMigration(first.sourceChecksum) === null, 'ROLLBACK_LEFT_MIGRATION_STATE');
    assert((await exportRepository.get(first.sourceChecksum)).checksum === first.sourceChecksum, 'ROLLBACK_REMOVED_EXPORT');
    assert(JSON.stringify(rawState()) === JSON.stringify(originalBytes), 'ROLLBACK_MUTATED_LEGACY');

    storageGateway.write('lumiIdeas', ['tijdelijke wijziging']);
    await seam.restoreLegacyFromExport({ gateway: storageGateway, exportRepository, sourceChecksum: first.sourceChecksum });
    assert(JSON.stringify(rawState()) === JSON.stringify(originalBytes), 'BYTE_EXACT_RESTORE_FAILED');

    const oversizedLegacyPayloadBytes = 6 * 1024 * 1024;
    let legacyLocalStorageQuotaFailureObserved = false;
    try {
      localStorage.setItem('lumiDocuments', JSON.stringify([{
        id: 'oversized-legacy-document',
        fileData: `data:application/pdf;base64,${'A'.repeat(oversizedLegacyPayloadBytes)}`
      }]));
    } catch (error) {
      legacyLocalStorageQuotaFailureObserved = error && error.name === 'QuotaExceededError';
    }
    assert(legacyLocalStorageQuotaFailureObserved, 'EXPECTED_LEGACY_QUOTA_FAILURE_NOT_OBSERVED');

    seed(fixture);
    const largeFixture = structuredClone(fixture);
    const largePayloadBytes = 2 * 1024 * 1024;
    largeFixture.lumiDocuments = [{
      id: 'large-browser-document',
      title: 'Grote browserfixture',
      fileName: 'large.pdf',
      fileData: `data:application/pdf;base64,${'A'.repeat(largePayloadBytes)}`,
      unknownFutureField: { preserved: true }
    }];
    seed(largeFixture);
    const largeLegacyBytes = rawState();
    const estimateBefore = navigator.storage && navigator.storage.estimate ? await navigator.storage.estimate() : null;
    const large = await seam.runShadowMigration({
      gateway: storageGateway,
      exportRepository,
      shadowAdapter,
      exportedAt: '2026-09-13T21:32:00.000Z'
    });
    const estimateAfter = navigator.storage && navigator.storage.estimate ? await navigator.storage.estimate() : null;
    assert(large.status === 'verified' && large.verification.ok, 'LARGE_MIGRATION_NOT_VERIFIED');
    assert(large.verification.checks.attachments, 'LARGE_ATTACHMENT_NOT_PRESERVED');
    assert(JSON.stringify(rawState()) === JSON.stringify(largeLegacyBytes), 'LARGE_MIGRATION_MUTATED_LEGACY');
    await seam.rollbackShadow({ shadowAdapter, sourceChecksum: large.sourceChecksum });
    assert(await exportRepository.get(large.sourceChecksum), 'LARGE_EXPORT_NOT_PRESERVED');

    const report = {
      indexedDbAvailable: true,
      transactionCommit: true,
      interruptedTransactionAtomic: true,
      repeatedRunIdempotent: true,
      rollbackShadowOnly: true,
      immutableExportPreserved: true,
      byteExactLegacyRestore: true,
      largePayloadBytes,
      largePayloadVerified: true,
      oversizedLegacyPayloadBytes,
      legacyLocalStorageQuotaFailureObserved,
      quotaEstimateAvailable: Boolean(estimateBefore && estimateAfter),
      quotaBefore: estimateBefore,
      quotaAfter: estimateAfter,
      indexedDbQuotaFailureForced: false,
      legacyShadowRoundTrip: first.verification.ok,
      verificationChecks: first.verification.checks
    };

    seed(fixture);
    await deleteDatabase(shadowDatabaseName);
    await deleteDatabase(exportDatabaseName);
    statusNode.dataset.status = 'passed';
    statusNode.textContent = 'Geslaagd';
    resultNode.textContent = JSON.stringify(report, null, 2);
  } catch (error) {
    statusNode.dataset.status = 'failed';
    statusNode.textContent = 'Mislukt';
    resultNode.textContent = JSON.stringify({ message: error.message, stack: error.stack }, null, 2);
  }
}());
