/* Settings rollout: durable preferences, honest capability states, and local data controls. */
const SETTINGS_SCREENS=['settingsHelp','settingsNotifications','settingsCalendar','settingsAppearance','settingsPrivacy','settingsAbout'];
function saveAppSettings(){write(KEYS.settings,appSettings);applyAccessibilitySettings()}
function applyAccessibilitySettings(){document.documentElement.classList.toggle('reduce-motion',!!appSettings.reducedMotion)}
function renderAppSettings(){
  document.querySelectorAll('[data-setting]').forEach(group=>group.querySelectorAll('[data-value]').forEach(button=>button.classList.toggle('selected',button.dataset.value===appSettings[group.dataset.setting])));
  document.querySelectorAll('[data-setting-toggle]').forEach(input=>{input.checked=!!appSettings[input.dataset.settingToggle]});
}
document.querySelectorAll('[data-settings-page]').forEach(button=>button.onclick=()=>{showScreen(button.dataset.settingsPage);document.querySelector('[data-screen="settings"]')?.classList.add('active');$('globalAddButton').classList.add('hidden');renderAppSettings()});
document.querySelectorAll('.settings-back').forEach(button=>button.onclick=()=>showScreen('settings'));
document.querySelectorAll('[data-setting] [data-value]').forEach(button=>button.onclick=()=>{const group=button.closest('[data-setting]');appSettings[group.dataset.setting]=button.dataset.value;saveAppSettings();renderAppSettings()});
document.querySelectorAll('[data-setting-toggle]').forEach(input=>input.onchange=()=>{appSettings[input.dataset.settingToggle]=input.checked;saveAppSettings();renderAppSettings()});
$('clearLocalDataButton').onclick=()=>confirmRemoval(()=>{Object.values(KEYS).forEach(key=>localStorage.removeItem(key));sessionStorage.removeItem('lumiCheckinOffered');location.reload()},'Alle LumiVault-gegevens op dit apparaat definitief verwijderen?','Ja, alles verwijderen');
applyAccessibilitySettings();renderAppSettings();

// Lifecycle semantics stay separate: waiting is represented by blocker/lifecycle.state,
// while a future deferredUntil is not a deadline. Recommendation interaction events can
// later be attached locally at suggestionCard without changing task or calendar data.
