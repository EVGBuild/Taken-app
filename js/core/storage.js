/**
 * LumiVault storage contract.
 * Keep these key names stable unless a deliberate data migration is introduced.
 */
const KEYS = Object.freeze({
  actions: 'mijnTaken',
  energy: 'lumiEnergy',
  checkin: 'lumiMorningCheckin',
  projects: 'lumiProjects',
  wishlist: 'lumiWishlist',
  lists: 'lumiLists',
  ideas: 'lumiIdeas',
  inbox: 'lumiInbox',
  finance: 'lumiFinance',
  documents: 'lumiDocuments',
  actionDraft: 'lumiActionDraft',
  tip: 'lumiWishlistDragTip',
  feedback: 'lumiFeedbackDraft',
  settings: 'lumiSettings',
  todayOrder: 'lumiTodayOrder',
  bucketlist: 'lumiBucketlist'
});

function createLegacyStorageAdapter(storage) {
  return Object.freeze({
    name: 'legacy-localStorage',
    getRaw(key) {
      return storage.getItem(key);
    },
    setRaw(key, value) {
      storage.setItem(key, String(value));
    },
    removeRaw(key) {
      storage.removeItem(key);
    },
    read(key, fallback = []) {
      try {
        return JSON.parse(storage.getItem(key)) ?? fallback;
      } catch {
        return fallback;
      }
    },
    write(key, value) {
      storage.setItem(key, JSON.stringify(value));
    }
  });
}

function createStorageGateway(activeAdapter) {
  if (!activeAdapter || typeof activeAdapter.read !== 'function' || typeof activeAdapter.write !== 'function') {
    throw new TypeError('A readable and writable legacy adapter is required');
  }
  return Object.freeze({
    activeAdapter: activeAdapter.name,
    getRaw: (key) => activeAdapter.getRaw(key),
    setRaw: (key, value) => activeAdapter.setRaw(key, value),
    removeRaw: (key) => activeAdapter.removeRaw(key),
    read: (key, fallback = []) => activeAdapter.read(key, fallback),
    write: (key, value) => activeAdapter.write(key, value)
  });
}

const legacyStorageAdapter = createLegacyStorageAdapter(localStorage);
const storageGateway = createStorageGateway(legacyStorageAdapter);

function getRaw(key) {
  return storageGateway.getRaw(key);
}

function setRaw(key, value) {
  storageGateway.setRaw(key, value);
}

function read(key, fallback = []) {
  return storageGateway.read(key, fallback);
}

function write(key, value) {
  storageGateway.write(key, value);
}

function remove(key) {
  storageGateway.removeRaw(key);
}
