import { TaskQueryRenderer } from '../TaskQueryRenderer';

type UiSettings = {
    height?: number | 'auto';
    maxHeight?: number;
    sidebar?: 'open' | 'collapsed';
    filter?: 'today' | 'next7days' | 'all' | 'date';
    selectedDate?: string; // YYYY-MM-DD for 'date' filter
    selectedTag?: string | null; // '' means untagged
};

function parseUiSettingsAndStrip(content: string): { ui: UiSettings, stripped: string } {
    const lines = content.split('\n');
    const ui: UiSettings = {};
    const kept: string[] = [];

    for (const raw of lines) {
        const line = raw.trim();
        if (/^ui\./i.test(line)) {
            const [keyRaw, valueRaw = ''] = line.split(':');
            const key = keyRaw.trim().toLowerCase();
            const value = valueRaw.trim();
            switch (key) {
                case 'ui.height': {
                    if (value.toLowerCase() === 'auto') ui.height = 'auto';
                    else {
                        const n = parseInt(value, 10);
                        if (!Number.isNaN(n) && n > 0) ui.height = n;
                    }
                    break;
                }
                case 'ui.maxheight': {
                    const n = parseInt(value, 10);
                    if (!Number.isNaN(n) && n > 0) ui.maxHeight = n;
                    break;
                }
                case 'ui.sidebar': {
                    const v = value.toLowerCase();
                    if (v === 'collapsed' || v === 'open') ui.sidebar = v as any;
                    break;
                }
                case 'ui.filter': {
                    const v = value.toLowerCase();
                    if (v === 'today' || v === 'next7days' || v === 'all' || v === 'date') ui.filter = v as any;
                    break;
                }
                case 'ui.selecteddate': {
                    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) ui.selectedDate = value;
                    break;
                }
                case 'ui.selectedtag': {
                    // empty string means untagged
                    ui.selectedTag = value === 'all' ? null : value;
                    break;
                }
                default:
                    // Unknown ui.* directive — ignore silently
                    break;
            }
        } else if (line.length > 0) {
            kept.push(raw);
        }
    }

    return { ui, stripped: kept.join('\n') };
}

export async function processTaskQuery(renderer: TaskQueryRenderer, block: HTMLElement, content: string) {
    try {
        const queryMatch = content.match(/tasks\s*\n?([\s\S]*)/);
        if (!queryMatch) return;

        const queryString = queryMatch[1].trim();
        const cleanQueryString = queryString.replace(/\u200B/g, '').replace(/\uFEFF/g, '');

        // Keep full original for saving back later
        (renderer as any).currentFullQueryString = cleanQueryString;

        // Parse UI directives and strip them from the filter query
        const { ui, stripped } = parseUiSettingsAndStrip(cleanQueryString);

        // Apply UI defaults to renderer
        if (ui.sidebar) renderer.sidebarCollapsed = ui.sidebar === 'collapsed';
        if (ui.filter) renderer.currentFilter = ui.filter;
        if (ui.selectedDate && ui.filter === 'date') renderer.selectedDate = new Date(ui.selectedDate);
        if (typeof ui.selectedTag !== 'undefined') renderer.selectedTag = ui.selectedTag;
        (renderer as any).uiSettings = ui;

        // If there is an exact due date filter in the code block (e.g., "due: 2024-12-31"),
        // prefill the UI datepicker to match it when no explicit UI override was provided.
        // This helps keep the UI in sync with the query.
        try {
            const lines = stripped.split('\n').map(l => l.trim()).filter(Boolean);
            const dueExactLine = lines.find(l => /^due:\s*\d{4}-\d{2}-\d{2}$/i.test(l));
            if (dueExactLine) {
                const dateStr = dueExactLine.split(':')[1].trim();
                const exactDate = new Date(dateStr);
                // Only set if UI did not explicitly set something else
                if (!ui.filter) {
                    renderer.currentFilter = 'date';
                }
                if (!ui.selectedDate && (!renderer.selectedDate || renderer.currentFilter === 'date')) {
                    renderer.selectedDate = exactDate;
                }
            }
        } catch {
            // ignore best-effort UI prefill
        }

        await renderer.taskService.refreshTasks();
        const allTasks = await renderer.taskService.getAllTasks(); 
        const filteredTasks = stripped
            ? renderer.taskQueryEngine.filterTasks(allTasks, renderer.taskQueryEngine.parseQueryString(stripped))
            : allTasks;

        // Use the stripped (filter-only) query for refresh calls, but persist full query on the element
        const resultContainer = renderer.createTodoContainer(filteredTasks, stripped);
        resultContainer.dataset.taskQuery = "```tasks\n" + cleanQueryString;
        resultContainer.dataset.taskQueryBlockId = renderer.blockId || '';
        block.parentNode?.replaceChild(resultContainer, block);
    } catch (error) {
        console.error('Error processing task query:', error);
        renderer.showError(block, error.message);
    }
}

export async function refreshQuery(rendererContext: TaskQueryRenderer, container: HTMLElement, queryString: string) {
    try {
        const content = container.querySelector('.task-content') as HTMLElement;
        if (content) {
            content.innerHTML = '<div style="padding: 20px; text-align: center; color: #666;">Lade...</div>';
        }

        const tasks = await rendererContext.taskService.getTasksByQueryString(queryString);
        rendererContext.currentTasks = tasks;        
        await rendererContext.refreshCurrentView(tasks);
        
    } catch (error) {
        console.error('Fehler beim Aktualisieren der Tasks:', error);
        
        // Zeige Fehler an
        const content = container.querySelector('.task-content') as HTMLElement;
        if (content) {
            content.innerHTML = `
                <div style="padding: 20px; text-align: center; color: #e74c3c;">
                    <strong>Fehler beim Laden der Tasks:</strong><br>
                    ${error.message || 'Unbekannter Fehler'}
                </div>
            `;
        }
    }
}
