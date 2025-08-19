# Task Master for SiYuan

English | 简体中文: see README_zh_CN.md

Task Master adds advanced, Obsidian‑Tasks–style task management to SiYuan. It lets you write tasks in plain Markdown, render interactive task lists, and run powerful queries via simple code blocks. A docked “Task Query Editor” helps you craft and update queries with one click.

## What It Does

- Interactive queries: Render tasks from your vault using `tasks` code blocks.
- Filters and sorting: Filter by status, priority, due/start dates, tags, path, and text; sort by due/start/priority/description; limit results.
- Date intelligence: Use relative keywords like `today`/`tomorrow`; see human‑readable relative labels and date grouping in the UI.
- Tag sidebar: Browse by tag (including “no tag”), toggle quick date scopes (Today, Next 7 days, Pick a date), and refresh results.
- Inline actions: Check/uncheck to toggle done, open the source document, or edit a task in a modal.
- Query dock: A right‑bottom dock (“Task Query Editor”) to preview, edit, and update the nearest query block.
- Auto refresh: Results update when documents change; refresh buttons are available when needed.

## How To Use

1) Install and load the plugin
- In SiYuan: Settings → About → Advanced → Plugin → Load plugin → select this plugin’s `dist` folder.

2) Write tasks in Markdown
- Use normal list items with checkboxes and optional metadata:
  - Status: `- [ ]` todo, `- [/]` in progress, `- [x]` done, `- [-]` cancelled
  - Priority: ⏫ high, 🔼 medium, default is low
  - Dates: 📅 due, 🛫 start, ⏳ scheduled, ✅ done, ❌ cancelled (format YYYY-MM-DD)
  - Tags: surround with `#tag#` (supports nested like `#project/alpha#`)
  - Dependencies: ⛔task_id

Example task line:
- [ ] Write release notes 📅 2024-09-01 🛫 2024-08-28 🔼 #release/notes#

3) Create a task query
- Add a fenced code block with language `tasks` inside any document:

```tasks
status: todo,in_progress
priority: high,medium
due: <2024-12-31
tag: work,important
-tag: archive
path: projects/work*
sort: dueDate desc
limit: 10
review
```

The block above renders matching tasks, sorted by due date (descending) and limited to 10. Free text lines (here: `review`) do a case‑insensitive substring search in the task description.

4) Use the Task Query Editor dock (optional)
- Open the “Task Query Editor” dock (right‑bottom) to tweak the nearest query block. Click Update to write the query back and refresh results.

## Query Language Reference

Write one directive per line inside a `tasks` code block. Unrecognized lines are treated as free‑text search.

### Filters

- Status: `status: todo` | `done` | `in_progress` | `cancelled`
  - Multiple: `status: todo,in_progress`
- Priority: `priority: low` | `medium` | `high`
  - Multiple: `priority: high,medium`
- Due date: absolute or relative
  - Exact day: `due: 2024-12-31`
  - Before: `due: <2024-12-31`
  - After: `due: >2024-01-01`
  - Today: `due: today`
  - Tomorrow: `due: tomorrow`
- Start date: same forms as due
  - `starts: 2024-09-01` | `starts: <2024-09-01` | `starts: >2024-09-01` | `starts: today` | `starts: tomorrow`
- Tags: include/exclude
  - Include any of: `tag: work,important`
  - Exclude any of: `-tag: archive,deprecated`
- Path: prefix match with a simple wildcard
  - `path: projects/work*` (single `*` wildcard expands to `.*`)
- Text search: any other line(s)
  - Case‑insensitive substring match on the full text you provide. Multiple lines are concatenated into a single phrase.

Notes
- Status must use underscore: `in_progress` (not `in-progress`).
- Only `low|medium|high` priorities are parsed from tasks. “Urgent” isn’t stored by the parser and won’t sort as a higher level.
- Tags match if any of the listed tags are present; excluded tags remove tasks that contain any of those tags.

### Sorting

- Directive: `sort: <field> [desc]`
- Fields: `dueDate` | `startDate` | `priority` | `description`
- Order: ascending by default; add `desc` for descending

Examples
- `sort: dueDate` (earliest first)
- `sort: priority desc` (high before medium before low)

### Limit

- Directive: `limit: <positive integer>`
- Example: `limit: 20`

## Date Handling Details

- Absolute dates: use `YYYY-MM-DD`.
- Relative keywords: `today`, `tomorrow`.
- Ranges: combine operators, e.g. `due: >2024-09-01` and `due: <2024-09-30`.
- Inclusivity: exact day is implemented as `[00:00, 24:00)`; `>`/`<` map to `>=`/`<` at midnight of the given date.
- Time zone: comparisons use your local time zone as provided by the browser/SiYuan runtime.
- UI grouping: the renderer groups tasks by human‑readable buckets like “Today”, “Tomorrow”, “Overdue”, or weekday+date.
- Quick filters: the tag sidebar offers Today, Next 7 days, or a specific date picker; overdue items are included in these time scopes.

## Examples

All open tasks by due date
```tasks
status: todo,in_progress
sort: dueDate
```

High‑priority tasks due this month
```tasks
priority: high
status: todo
due: >2024-09-01
due: <2024-10-01
sort: dueDate
```

Tasks with specific tags, excluding archived
```tasks
tag: work,important
-tag: archive
status: todo
sort: priority desc
limit: 20
```

Overdue tasks
```tasks
due: <today
status: todo
sort: dueDate
```

## Tips & Notes

- Check/uncheck in the list to toggle done; done tasks get a ✅ done date automatically.
- Click the open‑in‑tab icon to jump to the task’s source document.
- If you see odd matches, remove invisible characters; the engine strips zero‑width spaces automatically.
- The simple `*` wildcard in `path:` replaces only the first `*` and matches greedily.

**UI Settings In Codeblocks**
- Define renderer behavior and persist layout state directly inside the `tasks` codeblock using `ui.*` directives. These do not affect task filtering; they only control the UI.
- Supported directives:
  - `ui.height`: auto or pixel number (e.g., 420). Container is also resizable via drag (CSS vertical resize).
  - `ui.maxHeight`: pixel limit for container height (e.g., 800).
  - `ui.elements`: all (default) or tasks. When `tasks`, only the task list is rendered — no header, filter bar, sidebar, or footer buttons.
  - `ui.sidebar`: open or collapsed.
  - `ui.filter`: today, next7days, all, or date.
  - `ui.selectedDate`: YYYY-MM-DD (used when `ui.filter: date`).
  - `ui.selectedTag`: all for all tags, '' for untagged, or a tag string.

Example
```tasks
status: todo,in_progress
sort: dueDate desc
ui.height: 420
ui.maxHeight: 800
ui.sidebar: open
ui.filter: today
ui.elements: tasks
```

Saving UI state
- Click the footer button “💾 UI speichern” in the rendered container to write the current UI state (height, sidebar state, filter, date, and tag) back into the codeblock.
- If writing the codeblock isn’t possible (e.g., missing block ID), the plugin copies the updated block content to the clipboard and shows a notification.

## Development

- Build: `pnpm install` then `pnpm run build`
- Dev: `pnpm run dev`
- Release helper: `pnpm run release` (tags and triggers GitHub Action)

### Web App (Standalone)

- Optional: create `web/.env.local` with:
  - `VITE_SIYUAN_BASE_URL=http://127.0.0.1:6806`
  - `VITE_SIYUAN_TOKEN=your_kernel_token`
- Dev: `npm run web:dev` (serves a standalone TaskMaster UI at http://localhost:5174)
- Build: `npm run web:build` (outputs to `web/dist`)
- Behavior: same UI and filtering as the plugin; if no Siyuan API config is provided, the web UI loads but cannot fetch or persist tasks.

Deep links
- Optional: set `VITE_SIYUAN_DEEPLINK` to a URL pattern to open documents directly from the web UI.
- Placeholders: `{rootId}`, `{blockId}`. Examples:
  - Desktop scheme (example, verify with your setup): `siyuan://blocks/{rootId}`
  - Custom route: `http://127.0.0.1:6806/#/notebooks?doc={rootId}`
- If no deep link is configured, the app falls back to opening the base URL (if set) or copying IDs.

## License

MIT
