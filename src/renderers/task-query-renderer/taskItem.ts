import { Task } from '../../types/task';
import { getRelativeDateString } from '../../utils/dateUtils';
import { TaskQueryRenderer } from '../TaskQueryRenderer';
import { openTab } from 'siyuan';
import { getRootId } from '../../api';
import { openTaskEditModal } from './taskEditModal';

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