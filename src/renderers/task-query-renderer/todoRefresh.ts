import { TaskQueryRenderer } from '../TaskQueryRenderer';
import { refreshQuery } from './query-handler';
import { updateBlock, pushMsg, pushErrMsg } from '../../api';

export function createRefreshButton(rendererContext: TaskQueryRenderer, queryString: string): HTMLElement {
    const refreshContainer = document.createElement('div');
    refreshContainer.style.cssText = `
        padding: 12px 20px;
        border-top: 1px solid var(--b3-border-color);
        background: var(--b3-theme-background);
        display: flex;
        gap: 8px;
    `;

    const buttonBaseCss = `
        padding: 8px 12px;
        font-size: 13px;
        border: 1px solid var(--b3-border-color);
        border-radius: 6px;
        background: var(--b3-theme-background);
        color: var(--b3-theme-text);
        cursor: pointer;
        transition: all 0.2s ease;
    `;

    const refreshButton = document.createElement('button');
    refreshButton.innerHTML = '🔄 Aktualisieren';
    refreshButton.style.cssText = buttonBaseCss;

    refreshButton.addEventListener('mouseenter', () => {
        refreshButton.style.backgroundColor = 'var(--b3-theme-surface-light)';
    });

    refreshButton.addEventListener('mouseleave', () => {
        refreshButton.style.backgroundColor = 'var(--b3-theme-background)';
    });

    refreshButton.addEventListener('click', async () => {
        const container = refreshButton.closest('.todo-task-container') as HTMLElement;
        if (container) {
            await refreshQuery(rendererContext, container, queryString);
        }
    });

    const saveButton = document.createElement('button');
    saveButton.innerHTML = '💾 UI speichern';
    saveButton.style.cssText = buttonBaseCss;

    saveButton.addEventListener('mouseenter', () => {
        saveButton.style.backgroundColor = 'var(--b3-theme-surface-light)';
    });

    saveButton.addEventListener('mouseleave', () => {
        saveButton.style.backgroundColor = 'var(--b3-theme-background)';
    });

    saveButton.addEventListener('click', async () => {
        try {
            const container = saveButton.closest('.todo-task-container') as HTMLElement | null;
            const fullQuery = ((rendererContext as any).currentFullQueryString || rendererContext.currentQueryString || '').toString();
            const lines = fullQuery.split('\n').map(l => l.trim());
            const nonUi = lines.filter(l => !/^ui\./i.test(l) && l.length > 0);

            // Collect current UI state
            const heightPx = container ? Math.round(container.getBoundingClientRect().height) : undefined;
            const uiLines: string[] = [];
            if (heightPx && heightPx > 0) uiLines.push(`ui.height: ${heightPx}`);
            // Preserve maxHeight if originally provided via UI settings
            const existingUi = (rendererContext as any).uiSettings || {};
            if (existingUi && typeof existingUi.maxHeight === 'number' && existingUi.maxHeight > 0) {
                uiLines.push(`ui.maxHeight: ${existingUi.maxHeight}`);
            }
            if (existingUi && typeof existingUi.elements === 'string') {
                uiLines.push(`ui.elements: ${existingUi.elements}`);
            }
            uiLines.push(`ui.sidebar: ${rendererContext.sidebarCollapsed ? 'collapsed' : 'open'}`);
            uiLines.push(`ui.filter: ${rendererContext.currentFilter}`);
            if (rendererContext.currentFilter === 'date' && rendererContext.selectedDate) {
                uiLines.push(`ui.selectedDate: ${rendererContext.selectedDate.toISOString().split('T')[0]}`);
            }
            if (typeof rendererContext.selectedTag !== 'undefined') {
                const tag = rendererContext.selectedTag;
                uiLines.push(`ui.selectedTag: ${tag === null ? 'null' : tag}`);
            }

            const newBody = [...nonUi, ...uiLines].join('\n');
            const newContent = `tasks\n${newBody}`;

            if (!rendererContext.blockId) {
                await navigator.clipboard.writeText(newContent);
                await pushMsg('Block-ID fehlt. Inhalt in die Zwischenablage kopiert.');
                return;
            }

            await updateBlock('markdown', newContent, rendererContext.blockId);
            await pushMsg('UI-Einstellungen im Codeblock gespeichert.');

            // Trigger a re-render of the nearest container
            if (container) rendererContext.refreshContainerFromElement(container);
        } catch (err: any) {
            console.error('Fehler beim Speichern der UI-Einstellungen:', err);
            await pushErrMsg('Konnte nicht speichern. Siehe Konsole.');
        }
    });

    refreshContainer.appendChild(refreshButton);
    refreshContainer.appendChild(saveButton);
    return refreshContainer;
}
