(function exposeStorageSafetySeam(root, factory) {
  const core = typeof module === 'object' && module.exports
    ? require('./migration-core')
    : root.LumiVaultMigrationCore;
  const api = factory(core);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.LumiVaultStorageSafetySeam = api;
}(typeof self !== 'undefined' ? self : this, function createStorageSafetySeam(core) {
  'use strict';

  function assertDependencies({ gateway, exportRepository, shadowAdapter }) {
    if (!gateway || gateway.activeAdapter !== 'legacy-localStorage') throw new Error('LEGACY_GATEWAY_REQUIRED');
    if (!exportRepository || typeof exportRepository.saveImmutable !== 'function') throw new Error('EXPORT_REPOSITORY_REQUIRED');
    if (!shadowAdapter || typeof shadowAdapter.writePending !== 'function') throw new Error('SHADOW_ADAPTER_REQUIRED');
  }

  async function runShadowMigration({ gateway, exportRepository, shadowAdapter, exportedAt } = {}) {
    assertDependencies({ gateway, exportRepository, shadowAdapter });

    const snapshot = core.captureLegacySnapshot(gateway, { exportedAt });
    if (!core.verifyLegacySnapshot(snapshot)) throw new Error('EXPORT_INTEGRITY_FAILED');
    const exportResult = await exportRepository.saveImmutable(snapshot);

    const afterExport = core.captureLegacySnapshot(gateway, { exportedAt: snapshot.exportedAt });
    if (afterExport.checksum !== snapshot.checksum) throw new Error('SOURCE_CHANGED_AFTER_EXPORT');

    const target = core.buildTargetModel(snapshot);
    const writeResult = await shadowAdapter.writePending(target);
    const afterWrite = core.captureLegacySnapshot(gateway, { exportedAt: snapshot.exportedAt });
    if (afterWrite.checksum !== snapshot.checksum) {
      await shadowAdapter.rollback(snapshot.checksum);
      throw new Error('SOURCE_CHANGED_DURING_SHADOW_WRITE');
    }

    const storedTarget = await shadowAdapter.readTarget(snapshot.checksum);
    if (!storedTarget) throw new Error('SHADOW_READBACK_MISSING');
    const verification = core.verifyTarget(snapshot, storedTarget);
    if (!verification.ok) throw new Error('SHADOW_VERIFICATION_FAILED');

    const beforeVerify = core.captureLegacySnapshot(gateway, { exportedAt: snapshot.exportedAt });
    if (beforeVerify.checksum !== snapshot.checksum) {
      await shadowAdapter.rollback(snapshot.checksum);
      throw new Error('SOURCE_CHANGED_BEFORE_VERIFICATION');
    }
    if (!writeResult.reused) {
      await shadowAdapter.markVerified(snapshot.checksum, target.targetChecksum, verification);
    }

    return {
      status: 'verified',
      sourceChecksum: snapshot.checksum,
      targetChecksum: target.targetChecksum,
      exportReused: exportResult.reused,
      shadowReused: writeResult.reused,
      verification
    };
  }

  async function rollbackShadow({ shadowAdapter, sourceChecksum } = {}) {
    if (!shadowAdapter || !sourceChecksum) throw new Error('ROLLBACK_ARGUMENTS_REQUIRED');
    return shadowAdapter.rollback(sourceChecksum);
  }

  async function restoreLegacyFromExport({ gateway, exportRepository, sourceChecksum } = {}) {
    if (!gateway || gateway.activeAdapter !== 'legacy-localStorage') throw new Error('LEGACY_GATEWAY_REQUIRED');
    const snapshot = await exportRepository.get(sourceChecksum);
    if (!snapshot) throw new Error('EXPORT_NOT_FOUND');
    core.restoreLegacySnapshot(snapshot, gateway);
    return { restored: true, sourceChecksum, verified: core.verifyLegacySnapshot(snapshot) };
  }

  return Object.freeze({ runShadowMigration, rollbackShadow, restoreLegacyFromExport });
}));
