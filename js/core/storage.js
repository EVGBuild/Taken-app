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

function read(key, fallback = []) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}
