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

// New foundation data lives outside the immutable legacy-key set above.
// This keeps the legacy export/migration contract stable while allowing
// capture provenance and typed relations to grow without flattening domains.
const CAPTURE_KEYS = Object.freeze({
  raw: 'lumiRawCaptures'
});
const DOMAIN_KEYS = Object.freeze({
  relations: 'lumiDomainRelations'
});

function createDomainRef(type,id){
  const refType=String(type||'').trim(),refId=String(id||'').trim();
  if(!refType||!refId)return null;
  return Object.freeze({type:refType,id:refId});
}
function sameDomainRef(left,right){return !!left&&!!right&&left.type===right.type&&left.id===right.id}
function createDomainRelation({kind,from,to,source='user',createdAt=Date.now()}){
  const fromRef=createDomainRef(from?.type,from?.id),toRef=createDomainRef(to?.type,to?.id),relationKind=String(kind||'').trim();
  if(!relationKind||!fromRef||!toRef)return null;
  return {id:`${relationKind}:${fromRef.type}:${fromRef.id}:${toRef.type}:${toRef.id}`,kind:relationKind,from:fromRef,to:toRef,source,createdAt};
}
function linkDomainRelation(input){
  const relation=createDomainRelation(input);if(!relation)return null;
  const relations=read(DOMAIN_KEYS.relations,[]),existing=relations.find(item=>item.id===relation.id);
  if(existing)return existing;
  relations.push(relation);write(DOMAIN_KEYS.relations,relations);return relation;
}
function domainRelationsFor(ref){
  const target=createDomainRef(ref?.type,ref?.id);if(!target)return [];
  return read(DOMAIN_KEYS.relations,[]).filter(relation=>sameDomainRef(relation.from,target)||sameDomainRef(relation.to,target));
}

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
