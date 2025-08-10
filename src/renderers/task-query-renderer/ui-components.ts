import { Task } from '../../types/task';
import { getRelativeDateString } from '../../utils/dateUtils';
import { TaskQueryRenderer } from '../TaskQueryRenderer';
import { refreshQuery } from './query-handler';
import { openTab } from 'siyuan';
import { getRootId, updateBlock, pushMsg, pushErrMsg } from '../../api';

export function createHeader(rendererContext: TaskQueryRenderer, taskCount: number): HTMLElement {
    const header = document.createElement('div');
    header.style.cssText = `
        padding: 16px 20px;
        background: #fafbfc;
        border-bottom: 1px solid #e0e6e8;
        display: flex;
        justify-content: space-between;
        align-items: center;
    `;

    const title = document.createElement('h3');
    title.textContent = 'Aufgaben';
    title.style.cssText = `
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: #202020;
    `;

    if (rendererContext.selectedTag !== null) {
        const filterInfo = document.createElement('div');
        filterInfo.style.cssText = `
            font-size: 12px;
            color: #666;
            margin-top: 2px;
        `;

        if (rendererContext.selectedTag === '') {
            filterInfo.textContent = 'Projekt: Ohne Projekt';
        } else {
            filterInfo.textContent = `Projekt: #${rendererContext.selectedTag}`;
        }
        title.appendChild(filterInfo);
    }

    const count = document.createElement('span');
    count.textContent = `${taskCount} Aufgabe${taskCount !== 1 ? 'n' : ''}`;
    count.style.cssText = `
        font-size: 14px;
        color: #808080;
        font-weight: normal;
    `;

    header.appendChild(title);
    header.appendChild(count);

    // Attach rendererContext for updateFilterButtons usage
    (window as any).TaskQueryRendererContext = rendererContext;

    return header;
}

export function createFilterBar(rendererContext: TaskQueryRenderer): HTMLElement {
    const filterBar = document.createElement('div');
    filterBar.style.cssText = `
        padding: 12px 20px;
        background: #fafbfc;
        border-bottom: 1px solid #e0e6e8;
        display: flex;
        gap: 8px;
        align-items: center;
        flex-wrap: wrap;
    `;

    const todayButton = createFilterButton(rendererContext, 'Heute', 'today');
    const next7DaysButton = createFilterButton(rendererContext, 'Nächste 7 Tage', 'next7days');
    const allButton = createFilterButton(rendererContext, 'Alle', 'all');

    const datePicker = document.createElement('input');
    datePicker.type = 'date';
    datePicker.style.cssText = `
        padding: 6px 12px;
        border: 1px solid #e0e6e8;
        border-radius: 6px;
        font-size: 13px;
        background: white;
        cursor: pointer;
    `;

    // Vorbelegen, falls processTaskQuery bereits ein Datum gesetzt hat
    if (rendererContext.currentFilter === 'date' && rendererContext.selectedDate) {
        try {
            datePicker.value = rendererContext.selectedDate.toISOString().split('T')[0];
        } catch {
            // still fallback: leer lassen
        }
    }

    datePicker.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        if (target.value) {
            rendererContext.selectedDate = new Date(target.value);
            rendererContext.currentFilter = 'date';
            rendererContext.refreshCurrentView(rendererContext.currentTasks);
        }
    });

    filterBar.appendChild(todayButton);
    filterBar.appendChild(next7DaysButton);
    filterBar.appendChild(allButton);
    filterBar.appendChild(datePicker);

    return filterBar;
}

export function createFilterButton(rendererContext: TaskQueryRenderer, text: string, filter: 'today' | 'next7days' | 'all'): HTMLElement {
    const button = document.createElement('button');
    button.textContent = text;
    button.dataset.filter = filter;

    const isActive = rendererContext.currentFilter === filter;
    button.style.cssText = `
        padding: 6px 12px;
        border: 1px solid ${isActive ? '#dc4c3e' : '#e0e6e8'};
        border-radius: 6px;
        background: ${isActive ? '#dc4c3e' : 'white'};
        color: ${isActive ? 'white' : '#202020'};
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
    `;

    button.addEventListener('click', () => {
        rendererContext.currentFilter = filter;
        rendererContext.selectedDate = null;
        updateFilterButtons(rendererContext);
        rendererContext.refreshCurrentView(rendererContext.currentTasks);
    });

    button.addEventListener('mouseenter', () => {
        if (rendererContext.currentFilter !== filter) {
            button.style.backgroundColor = '#f5f5f5';
            button.style.borderColor = '#d0d0d0';
        }
    });

    button.addEventListener('mouseleave', () => {
        if (rendererContext.currentFilter !== filter) {
            button.style.backgroundColor = 'white';
            button.style.borderColor = '#e0e6e8';
        }
    });

    return button;
}

export function updateFilterButtons(rendererContext: TaskQueryRenderer) {
    const container = document.querySelector('.todo-task-container');
    if (!container) return;

    const buttons = container.querySelectorAll('[data-filter]') as NodeListOf<HTMLElement>;
    buttons.forEach(btn => {
        if (!rendererContext) return;
        const isActive = btn.dataset.filter === rendererContext.currentFilter;
        btn.style.background = isActive ? '#dc4c3e' : 'white';
        btn.style.color = isActive ? 'white' : '#202020';
        btn.style.borderColor = isActive ? '#dc4c3e' : '#e0e6e8';
    });

    // Datepicker
    const datePicker = container.querySelector('input[type="date"]') as HTMLInputElement | null;
    if (datePicker) {
        if (rendererContext.currentFilter === 'date' && rendererContext.selectedDate) {
            try {
                const v = rendererContext.selectedDate.toISOString().split('T')[0];
                if (datePicker.value !== v) datePicker.value = v;
            } catch {
                // ignore
            }
        } else if (rendererContext.currentFilter !== 'date') {
            datePicker.value = '';
        }
    }
}

export function createTaskItem(task: Task, rendererContext: TaskQueryRenderer): HTMLElement {
    const taskDiv = document.createElement('div');
    taskDiv.className = 'task-item';
    taskDiv.style.cssText = `
        display: flex;
        align-items: center;
        padding: 12px 20px;
        border-bottom: 1px solid #f5f5f5;
        transition: background-color 0.2s ease;
        cursor: pointer;
    `;

    taskDiv.addEventListener('mouseenter', () => {
        taskDiv.style.backgroundColor = '#fafbfc';
    });
    taskDiv.addEventListener('mouseleave', () => {
        taskDiv.style.backgroundColor = 'transparent';
    });

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.status === 'done';
    checkbox.style.cssText = `
        margin-right: 12px;
        width: 18px;
        height: 18px;
        cursor: pointer;
        accent-color: #dc4c3e;
    `;

    checkbox.addEventListener('change', async (e) => {
        e.stopPropagation();
        task.status = checkbox.checked ? 'done' : 'todo';
        await rendererContext.taskService.updateTask(task);

        const description = taskDiv.querySelector('.task-description') as HTMLElement;
        if (description) {
            description.style.textDecoration = task.status === 'done' ? 'line-through' : 'none';
            description.style.color = task.status === 'done' ? '#808080' : '#202020';
        }
    });

    const priorityIndicator = document.createElement('div');
    if (task.priority) {
        const colors = {
            urgent: '#dc4c3e',
            high: '#ff8800',
            medium: '#f4c842',
            low: '#4c9aff'
        };
        priorityIndicator.style.cssText = `
            width: 4px;
            height: 18px;
            background-color: ${colors[task.priority]};
            margin-right: 12px;
            border-radius: 2px;
        `;
    } else {
        priorityIndicator.style.cssText = `
            width: 4px;
            height: 18px;
            margin-right: 12px;
        `;
    }

    const content = document.createElement('div');
    content.style.cssText = `
        flex: 1;
        display: flex;
        flex-direction: column;
        min-width: 0;
    `;

    const description = document.createElement('div');
    description.textContent = task.description;
    description.className = 'task-description';
    description.style.cssText = `
        font-size: 14px;
        color: ${task.status === 'done' ? '#808080' : '#202020'};
        text-decoration: ${task.status === 'done' ? 'line-through' : 'none'};
        line-height: 1.4;
        margin-bottom: 2px;
    `;

    if (task.dueDate) {
        const dateInfo = getRelativeDateString(task.dueDate);
        const dueDateSpan = document.createElement('div');
        dueDateSpan.textContent = dateInfo.text;
        dueDateSpan.style.cssText = `
            font-size: 12px;
            color: ${dateInfo.isOverdue ? '#dc4c3e' : '#808080'};
            margin-top: 2px;
        `;
        content.appendChild(dueDateSpan);
    }

    content.appendChild(description);

    const tagsContainer = document.createElement('div');
    tagsContainer.style.cssText = `
        display: flex;
        gap: 4px;
        flex-wrap: wrap;
        margin-left: 12px;
    `;

    if (task.tags && task.tags.length > 0) {
        task.tags.forEach(tag => {
            const tagSpan = document.createElement('span');
            tagSpan.textContent = `#${tag}`;
            tagSpan.style.cssText = `
                background: #f0f0f0;
                color: #666;
                padding: 2px 6px;
                border-radius: 12px;
                font-size: 11px;
                font-weight: 500;
            `;
            tagsContainer.appendChild(tagSpan);
        });
    }

    const openInNewTabIcon = document.createElement('div');
    openInNewTabIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-up-right-from-square"><path d="M21 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6"/><path d="m21 3-9 9"/><path d="M15 3h6v6"/></svg>`;
    openInNewTabIcon.style.cssText = `
        margin-left: 12px;
        color: #808080;
        display: flex;
        align-items: center;
    `;
    openInNewTabIcon.addEventListener('click', async (e) => {
        const root_id = await getRootId(task.blockId);
        e.stopPropagation();
        openTab({
            app: rendererContext.app,
            doc: {
                id: root_id,
                action: ['cb-get-focus']
            },
        });
    });

    taskDiv.addEventListener('click', (e) => {
        if (e.target !== checkbox && !openInNewTabIcon.contains(e.target as Node)) {
            openTaskEditModal(task, rendererContext);
        }
    });

    taskDiv.appendChild(checkbox);
    taskDiv.appendChild(priorityIndicator);
    taskDiv.appendChild(content);
    taskDiv.appendChild(tagsContainer);
    taskDiv.appendChild(openInNewTabIcon);

    return taskDiv;
}


export function openTaskEditModal(task: Task, rendererContext: TaskQueryRenderer) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
    `;

    const modal = document.createElement('div');
    modal.style.cssText = `
        background: white;
        border-radius: 12px;
        padding: 24px;
        width: 90%;
        max-width: 500px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    `;

    const title = document.createElement('h3');
    title.textContent = 'Aufgabe bearbeiten';
    title.style.cssText = `
        margin: 0 0 20px 0;
        font-size: 18px;
        color: #202020;
    `;

    const descLabel = document.createElement('label');
    descLabel.textContent = 'Beschreibung:';
    descLabel.style.cssText = `
        display: block;
        margin-bottom: 8px;
        font-weight: 500;
        color: #202020;
    `;

    const descInput = document.createElement('textarea');
    descInput.value = task.description;
    descInput.style.cssText = `
        width: 100%;
        padding: 12px;
        border: 1px solid #e0e6e8;
        border-radius: 6px;
        font-size: 14px;
        font-family: inherit;
        resize: vertical;
        min-height: 80px;
        margin-bottom: 16px;
    `;

    const priorityLabel = document.createElement('label');
    priorityLabel.textContent = 'Priorität:';
    priorityLabel.style.cssText = `
        display: block;
        margin-bottom: 8px;
        font-weight: 500;
        color: #202020;
    `;

    const prioritySelect = document.createElement('select');
    prioritySelect.innerHTML = `
        <option value="">Keine Priorität</option>
        <option value="low">Niedrig</option>
        <option value="medium">Medium</option>
        <option value="high">Hoch</option>
        <option value="urgent">Dringend</option>
    `;
    prioritySelect.value = task.priority || '';
    prioritySelect.style.cssText = `
        width: 100%;
        padding: 12px;
        border: 1px solid #e0e6e8;
        border-radius: 6px;
        font-size: 14px;
        margin-bottom: 16px;
    `;

    const dueDateLabel = document.createElement('label');
    dueDateLabel.textContent = 'Fälligkeitsdatum:';
    dueDateLabel.style.cssText = `
        display: block;
        margin-bottom: 8px;
        font-weight: 500;
        color: #202020;
    `;

    const dueDateInput = document.createElement('input');
    dueDateInput.type = 'date';
    if (task.dueDate) {
        dueDateInput.value = task.dueDate.toISOString().split('T')[0];
    }
    dueDateInput.style.cssText = `
        width: 100%;
        padding: 12px;
        border: 1px solid #e0e6e8;
        border-radius: 6px;
        font-size: 14px;
        margin-bottom: 16px;
    `;

    const tagsLabel = document.createElement('label');
    tagsLabel.textContent = 'Tags (kommagetrennt):';
    tagsLabel.style.cssText = `
        display: block;
        margin-bottom: 8px;
        font-weight: 500;
        color: #202020;
    `;

    const tagsInput = document.createElement('input');
    tagsInput.type = 'text';
    tagsInput.value = task.tags?.join(', ') || '';
    tagsInput.style.cssText = `
        width: 100%;
        padding: 12px;
        border: 1px solid #e0e6e8;
        border-radius: 6px;
        font-size: 14px;
        margin-bottom: 20px;
    `;

    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
        display: flex;
        gap: 12px;
        justify-content: flex-end;
    `;

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Abbrechen';
    cancelBtn.style.cssText = `
        padding: 10px 20px;
        border: 1px solid #e0e6e8;
        border-radius: 6px;
        background: white;
        color: #202020;
        font-size: 14px;
        cursor: pointer;
    `;

    const saveBtn = document.createElement('button');
    saveBtn.textContent = 'Speichern';
    saveBtn.style.cssText = `
        padding: 10px 20px;
        border: none;
        border-radius: 6px;
        background: #dc4c3e;
        color: white;
        font-size: 14px;
        cursor: pointer;
    `;

    cancelBtn.addEventListener('click', () => {
        document.body.removeChild(overlay);
    });

    saveBtn.addEventListener('click', async () => {
        task.description = descInput.value.trim();
        task.priority = prioritySelect.value as any;
        task.dueDate = dueDateInput.value ? new Date(dueDateInput.value) : undefined;
        task.tags = tagsInput.value.split(',').map(tag => tag.trim()).filter(tag => tag);

        try {
            await rendererContext.taskService.updateTask(task);
            rendererContext.refreshCurrentView(rendererContext.currentTasks);
            document.body.removeChild(overlay);
        } catch (error) {
            console.error('Error updating task:', error);
        }
    });

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            document.body.removeChild(overlay);
        }
    });

    modal.appendChild(title);
    modal.appendChild(descLabel);
    modal.appendChild(descInput);
    modal.appendChild(priorityLabel);
    modal.appendChild(prioritySelect);
    modal.appendChild(dueDateLabel);
    modal.appendChild(dueDateInput);
    modal.appendChild(tagsLabel);
    modal.appendChild(tagsInput);

    buttonContainer.appendChild(cancelBtn);
    buttonContainer.appendChild(saveBtn);
    modal.appendChild(buttonContainer);

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    setTimeout(() => descInput.focus(), 100);
}

export function createRefreshButton(rendererContext: TaskQueryRenderer, queryString: string): HTMLElement {
    const refreshContainer = document.createElement('div');
    refreshContainer.style.cssText = `
        padding: 12px 20px;
        border-top: 1px solid #e0e6e8;
        background: #fafbfc;
        display: flex;
        gap: 8px;
    `;

    const buttonBaseCss = `
        padding: 8px 12px;
        font-size: 13px;
        border: 1px solid #e0e6e8;
        border-radius: 6px;
        background: white;
        color: #202020;
        cursor: pointer;
        transition: all 0.2s ease;
    `;

    const refreshButton = document.createElement('button');
    refreshButton.innerHTML = '🔄 Aktualisieren';
    refreshButton.style.cssText = buttonBaseCss;

    refreshButton.addEventListener('mouseenter', () => {
        refreshButton.style.backgroundColor = '#f5f5f5';
    });

    refreshButton.addEventListener('mouseleave', () => {
        refreshButton.style.backgroundColor = 'white';
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
        saveButton.style.backgroundColor = '#f5f5f5';
    });

    saveButton.addEventListener('mouseleave', () => {
        saveButton.style.backgroundColor = 'white';
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
