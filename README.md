# Siyuan Plugin Template - Vite & Vue3

[简体中文](./README_zh_CN.md)

> Consistent with [siyuan/plugin-sample](https://github.com/siyuan-note/plugin-sample).

1. Use Vite for packaging
2. Use Vue3 for development
3. Provides a github action template to automatically generate package.zip and upload to new release
4. Provides a script to auto create tag and release. [link](#release-script)

> [!NOTE]
>
> Before your start, you need install [NodeJS](https://nodejs.org/en/download) and [pnpm](https://pnpm.io/installation) first.

> [!WARNING]
>
> For your first attempt, please do not modify anything. Load the plugin template in Siyuan as described below before making any changes.
>
> For example, deleting README_zh_CN.md will also cause the plugin to fail to load.

## Get started

1. Use the `Use the template` button to make a copy of this repo as template.  
> [!WARNING]
>
> That the repository name should match the plugin name, and the default branch must be `main`.


2. Use `git clone` to clone the repository to local.

3. Run `pnpm install` to install dependencies.

4. Modify `plugin.json` to your plugin information.

5. Run `pnpm run dev` to start development.

6. Run `pnpm run build` to build the plugin.

7. Load the plugin in Siyuan as described below.

## Load plugin in Siyuan

1. Open Siyuan settings.
2. Go to `Settings` -> `About` -> `Advanced` -> `Plugin`.
3. Click `Load plugin` and select the `dist` folder.

## Task Query Feature

This plugin now includes a powerful task query feature similar to Obsidian Tasks plugin. You can create task queries directly in your documents using the following syntax:

### Basic Usage

Create a code block with language `tasks`:

```tasks
status: todo, in-progress
priority: high, urgent
due: <2024-12-31
tag: work,important
sort: dueDate desc
limit: 10
```

### Available Filters

- **Status**: `status: todo`, `status: done`, `status: todo,in-progress`
- **Priority**: `priority: low`, `priority: medium`, `priority: high`, `priority: urgent`
- **Due Date**: `due: 2024-12-31`, `due: <2024-12-31`, `due: >2024-12-31`
- **Start Date**: `starts: 2024-12-31`, `starts: <2024-12-31`, `starts: >2024-12-31`
- **Tags**: `tag: work`, `tag: work,important`, `-tag: archive`
- **Path**: `path: projects/work*`
- **Sort**: `sort: dueDate`, `sort: priority desc`, `sort: startDate`
- **Limit**: `limit: 5`
- **Text Search**: `meeting project` (searches in task descriptions)

### Examples

**All open tasks sorted by due date:**
```tasks
status: todo,in-progress
sort: dueDate
```

**Urgent tasks due this week:**
```tasks
priority: urgent
status: todo
due: >today
due: <next week
```

**Tasks with specific tags:**
```tasks
tag: work,important
-tag: archive
status: todo
sort: priority desc
limit: 20
```

### Interactive Features

- Click checkboxes to mark tasks as complete/incomplete
- Use the refresh button to update query results
- Error messages are displayed directly in the query block
- Queries are automatically updated when documents change

For more examples and detailed documentation, see [TASK_QUERY_README.md](./TASK_QUERY_README.md) and [examples/task-queries.md](./examples/task-queries.md).

## Release Script

After you have modified the plugin information in `plugin.json`, you can use the release script to automatically create a tag and release.

```bash
pnpm run release
```

This script will:
1. Read the version from `plugin.json`
2. Create a git tag with the version
3. Push the tag to GitHub
4. GitHub Actions will automatically build and create a release

## Development

### Project Structure

```
src/
├── api.ts              # API wrapper for Siyuan
├── components/         # Vue components
├── index.ts           # Plugin entry point
├── index.scss         # Styles
├── renderer.ts        # Task rendering and query processing
├── taskModal.ts       # Task editing modal
├── taskModels.ts      # Task data models
├── taskParser.ts      # Task parsing utilities
├── taskQuery.ts       # Task query engine
├── taskQueryResults.ts # Task query results display
├── taskService.ts     # Task data service
├── types/             # TypeScript type definitions
└── utils/             # Utility functions
```

### Available Scripts

- `pnpm run dev` - Start development server
- `pnpm run build` - Build for production
- `pnpm run release` - Create release
- `pnpm run lint` - Run ESLint
- `pnpm run type-check` - Run TypeScript type checking

## License

MIT