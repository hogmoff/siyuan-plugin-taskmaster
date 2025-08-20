import { TaskQueryRenderer } from '../TaskQueryRenderer';

export function createFilterBar(rendererContext: TaskQueryRenderer): HTMLElement {
    const filterBar = document.createElement('div');
    filterBar.style.cssText = `
        padding: 12px 20px;
        background: var(--b3-theme-background);
        border-bottom: 1px solid var(--b3-border-color);
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
        border: 1px solid var(--b3-border-color);
        border-radius: 6px;
        font-size: 13px;
        background: var(--b3-theme-background);
        color: var(--b3-theme-text);
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
        border: 1px solid ${isActive ? 'var(--b3-theme-primary)' : 'var(--b3-border-color)'};
        border-radius: 6px;
        background: ${isActive ? 'var(--b3-theme-primary)' : 'var(--b3-theme-background)'};
        color: ${isActive ? 'var(--b3-theme-on-primary)' : 'var(--b3-theme-text)'};
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
            button.style.backgroundColor = 'var(--b3-theme-surface-light)';
            button.style.borderColor = 'var(--b3-border-color)';
        }
    });

    button.addEventListener('mouseleave', () => {
        if (rendererContext.currentFilter !== filter) {
            button.style.backgroundColor = 'var(--b3-theme-background)';
            button.style.borderColor = 'var(--b3-border-color)';
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
        btn.style.background = isActive ? 'var(--b3-theme-primary)' : 'var(--b3-theme-background)';
        btn.style.color = isActive ? 'var(--b3-theme-on-primary)' : 'var(--b3-theme-text)';
        btn.style.borderColor = isActive ? 'var(--b3-theme-primary)' : 'var(--b3-border-color)';
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
