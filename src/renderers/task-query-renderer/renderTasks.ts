import { Task } from '../../types/task';
import { applyCurrentFilter, sortTasks, groupTasksByDate } from './task-operations';
import { createTaskItem } from './taskItem';

export function renderTasks(container: HTMLElement, tasks: Task[], rendererContext: any) {
    container.innerHTML = '';
    let filteredTasks = applyCurrentFilter(tasks, rendererContext.currentFilter, rendererContext.selectedDate, rendererContext.selectedTag);
    const sortedTasks = sortTasks(filteredTasks);
    const groupedTasks = groupTasksByDate(sortedTasks);

    if (groupedTasks.length === 0) {
        const noTasks = document.createElement('div');
        noTasks.style.cssText = `
            text-align: center;
            padding: 40px 20px;
            color: var(--b3-theme-text-lighter);
            background: var(--b3-theme-surface);
            font-size: 16px;
        `;
        noTasks.textContent = 'Keine Aufgaben gefunden';
        container.appendChild(noTasks);
        return;
    }

    groupedTasks.forEach(group => {
        const groupHeader = document.createElement('div');
        groupHeader.style.cssText = `
            padding: 16px 20px 8px;
            font-weight: 600;
            font-size: 14px;
            color: var(--b3-theme-text);
            background: var(--b3-theme-surface);
            border-bottom: 1px solid var(--b3-border-color-light);
            position: sticky;
            top: 0;
            z-index: 1;
        `;
        groupHeader.textContent = `${group.label} (${group.tasks.length})`;
        container.appendChild(groupHeader);

        group.tasks.forEach(task => {
            const taskElement = createTaskItem(task, rendererContext);
            container.appendChild(taskElement);
        });
    });
}
