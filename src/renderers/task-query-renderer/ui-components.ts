import { Task, TaskGroup } from '../../types/task';
import { getRelativeDateString } from '../../utils/dateUtils';
import { TaskQueryRenderer } from '../TaskQueryRenderer';

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

    datePicker.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        if (target.value) {
            rendererContext.selectedDate = new Date(target.value);
            rendererContext.currentFilter = 'date';
            rendererContext.refreshCurrentView();
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
        updateFilterButtons();
        rendererContext.refreshCurrentView();
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

export function updateFilterButtons() {
    const container = document.querySelector('.todoist-task-container');
    if (!container) return;

    const buttons = container.querySelectorAll('[data-filter]') as NodeListOf<HTMLElement>;
    buttons.forEach(btn => {
        const rendererContext = (window as any).TaskQueryRendererContext as TaskQueryRenderer;
        if (!rendererContext) return;
        const isActive = btn.dataset.filter === rendererContext.currentFilter;
        btn.style.background = isActive ? '#dc4c3e' : 'white';
        btn.style.color = isActive ? 'white' : '#202020';
        btn.style.borderColor = isActive ? '#dc4c3e' : '#e0e6e8';
    });
}
