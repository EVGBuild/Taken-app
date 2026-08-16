# LumiVault

LumiVault is currently a browser-based HTML/CSS/JavaScript application. The codebase is being modularised incrementally without changing product behaviour or stored user data.

## Entry points

- `index.html` — application markup and screen/modal structure.
- `style.css` — current application styling. CSS will be split in a later refactor batch.
- `js/app.js` — JavaScript application entry point/orchestration and remaining legacy feature logic.

## Core

### `js/core/storage.js`
Owns LumiVault's localStorage contract:

- storage key names;
- safe JSON reads;
- JSON writes.

**Rule:** do not rename storage keys or change persisted data shapes without an explicit migration plan.

## Utilities

### `js/utils/dates.js`
Pure/shared date behaviour:

- today's local date key;
- short and long Dutch date formatting;
- Dutch free-text/numeric date parsing;
- recurrence next-date calculation;
- recurrence labels.

### `js/utils/formatting.js`
Shared display formatting such as prices and duration labels.

### `js/utils/helpers.js`
Small generic helpers such as id creation and nullable numeric conversion.

## Features

### `js/features/recommendations.js`
Owns recommendation scoring and grouping. It does **not** render Home and does not access storage directly.

### `js/features/home.js`
Owns the current Home screen presentation: energy summary, suggested-task area, empty state, and the UI decision whether broader suggestions are available. It receives recommendation results rather than calculating them itself.

### `js/features/checkin.js`
Owns the currently active simplified 1–5 capacity check-in UI and save flow. Persisted values still use the existing storage keys/data contract.

## Temporary legacy / Batch B

`js/app.js` still contains a substantial amount of feature logic and temporary application state. Recommendations, the active Check-in flow, and Home presentation now have their own feature modules. Subsequent refactoring can continue one domain at a time, for example:

- tasks;
- projects;
- wishlist;
- lists;
- ideas/inbox;
- finance;
- documents;
- settings;
- navigation.

Keeping this intermediate state functional is more important than splitting everything at once.

## Architecture rules

1. Prefer using `js/core/storage.js` for new persistent storage access.
2. Generic date logic belongs in `js/utils/dates.js`, not inside a screen or feature.
3. `js/app.js` is an interim orchestration/legacy file, not the permanent home for new feature logic.
4. Extract features incrementally and keep each change behaviour-preserving unless a product change is explicitly requested.
5. Do not combine architecture refactors with visual redesigns or feature changes.
6. Existing localStorage keys are a compatibility contract.

## Where do I change…?

- Shared date parsing/recurrence calculations → `js/utils/dates.js`
- Shared money/duration formatting → `js/utils/formatting.js`
- Storage keys/read/write behaviour → `js/core/storage.js`
- Recommendation ranking/grouping → `js/features/recommendations.js`
- Home presentation → `js/features/home.js`
- Active 1–5 check-in flow → `js/features/checkin.js`
- Other current feature behaviour → still primarily `js/app.js` until later Batch B steps
- Styling → `style.css` until the CSS refactor batch

## Refactor principle

Codex or other coding agents should be accelerators, not a single point of failure. The repository should remain understandable enough that small changes can be made safely by editing one or a few clearly responsible files.
