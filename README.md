# LumiVault

LumiVault is a browser-based HTML/CSS/JavaScript application. The codebase is organised into small, responsibility-based files while preserving existing product behaviour and localStorage data.

## Runtime architecture

`index.html` owns the application markup and loads CSS and JavaScript in an explicit dependency order. LumiVault currently uses native browser scripts rather than a framework or build step. This is intentional: it keeps the repository easy to inspect and allows small changes to be made by replacing one or a few files.

### CSS load order

The four CSS files together are byte-for-byte equivalent to the former monolithic stylesheet when concatenated in this order:

1. `css/foundation.css`
2. `css/vds.css`
3. `css/theme.css`
4. `css/mobile-polish.css`

Keep this order unless a deliberate CSS refactor changes the cascade.

### JavaScript foundations

- `js/core/storage.js` — localStorage key contract and safe read/write helpers.
- `js/utils/helpers.js` — generic helpers.
- `js/utils/dates.js` — shared date parsing, formatting and recurrence behaviour.
- `js/utils/formatting.js` — display formatting.
- `js/features/recommendations.js` — recommendation engine.
- `js/features/checkin.js` — reusable check-in controller.
- `js/features/home.js` — Home presentation helper.
- `js/core/ui.js` — shared UI primitives and interaction helpers.
- `js/core/navigation.js` — navigation-specific helpers and visual navigation behaviour.
- `js/core/bootstrap.js` — persisted application state and initial application wiring.

### Feature files

- `js/features/tasks.js` — task CRUD, task form, task detail and task rendering.
- `js/features/projects.js` — projects.
- `js/features/wishlist.js` — wishes and purchases.
- `js/features/lists.js` — lists and sublists.
- `js/features/ideas.js` — ideas.
- `js/features/inbox.js` — uncategorised capture/inbox.
- `js/features/capture.js` — universal capture flow.
- `js/features/checkin-context.js` — navigation/context recovery and check-in related rollout behaviour.
- `js/features/today.js` — Today ordering and recommendation presentation behaviour.
- `js/features/task-capture.js` — current task capture/check-in integration and draft behaviour.
- `js/features/finance-documents.js` — finance and document Vault modules.
- `js/features/presentation.js` — later presentation refinements.
- `js/features/settings.js` — settings.
- `js/core/init.js` — final startup synchronisation.

## Important dependency rule

The JavaScript files are currently classic browser scripts loaded in a deliberate order from `index.html`. They share one browser global lexical environment. Do not arbitrarily reorder script tags: some later files refine behaviour declared earlier.

This is an intentionally lightweight intermediate architecture. It gives each responsibility a clear file without introducing React, a bundler, or a build process. A future refactor may convert feature boundaries to true ES modules once shared state and rollout overrides have been fully untangled.

## Storage compatibility

Existing localStorage key names are a compatibility contract. Do not rename keys or change persisted data shapes without an explicit migration plan. New persistent storage access should go through `js/core/storage.js` where possible.

## Where do I change…?

- Recommendation scoring/ranking → `js/features/recommendations.js` and current Today integration in `js/features/today.js`
- Check-in controller → `js/features/checkin.js`; current integration → `js/features/task-capture.js`
- Task form, validation and task CRUD → `js/features/tasks.js`
- Projects → `js/features/projects.js`
- Wishes/purchases → `js/features/wishlist.js`
- Lists/sublists → `js/features/lists.js`
- Ideas → `js/features/ideas.js`
- Inbox → `js/features/inbox.js`
- Finance/documents → `js/features/finance-documents.js`
- Settings → `js/features/settings.js`
- Shared dates/recurrence → `js/utils/dates.js`
- Storage keys/read/write → `js/core/storage.js`
- Shared UI helpers → `js/core/ui.js`
- Navigation → `js/core/navigation.js`
- Base/layout styling → `css/foundation.css`
- visual design-system layer → `css/vds.css`
- theme refinements → `css/theme.css`
- mobile-specific polish → `css/mobile-polish.css`

## Refactor principle

Codex or another coding agent should be an accelerator, not a single point of failure. Optimise for understandable ownership, local changes, predictable behaviour and a safe manual fallback rather than architectural novelty.
