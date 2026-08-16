LumiVault
LumiVault is currently a browser-based HTML/CSS/JavaScript application. The codebase is being modularised incrementally without changing product behaviour or stored user data.
Entry points
`index.html` — application markup and screen/modal structure.
`style.css` — current application styling. CSS will be split in a later refactor batch.
`js/app.js` — JavaScript application entry point and, temporarily, most feature logic.
Core
`js/core/storage.js`
Owns LumiVault's localStorage contract:
storage key names;
safe JSON reads;
JSON writes.
Rule: do not rename storage keys or change persisted data shapes without an explicit migration plan.
Utilities
`js/utils/dates.js`
Pure/shared date behaviour:
today's local date key;
short and long Dutch date formatting;
Dutch free-text/numeric date parsing;
recurrence next-date calculation;
recurrence labels.
`js/utils/formatting.js`
Shared display formatting such as prices and duration labels.
`js/utils/helpers.js`
Small generic helpers such as id creation and nullable numeric conversion.
Temporary legacy / Batch B
`js/app.js` still contains most feature logic and temporary application state. This is intentional: Batch A moves the safest shared foundations first. Subsequent refactoring can extract feature domains one at a time, for example:
recommendations;
check-in/context;
tasks;
Home;
projects;
wishlist;
lists;
ideas/inbox;
finance;
documents;
settings;
navigation.
Keeping this intermediate state functional is more important than splitting everything at once.
Architecture rules
Prefer using `js/core/storage.js` for new persistent storage access.
Generic date logic belongs in `js/utils/dates.js`, not inside a screen or feature.
`js/app.js` is an interim orchestration/legacy file, not the permanent home for new feature logic.
Extract features incrementally and keep each change behaviour-preserving unless a product change is explicitly requested.
Do not combine architecture refactors with visual redesigns or feature changes.
Existing localStorage keys are a compatibility contract.
Where do I change…?
Shared date parsing/recurrence calculations → `js/utils/dates.js`
Shared money/duration formatting → `js/utils/formatting.js`
Storage keys/read/write behaviour → `js/core/storage.js`
Current feature behaviour → still primarily `js/app.js` until Batch B
Styling → `style.css` until the CSS refactor batch
Refactor principle
Codex or other coding agents should be accelerators, not a single point of failure. The repository should remain understandable enough that small changes can be made safely by editing one or a few clearly responsible files.
