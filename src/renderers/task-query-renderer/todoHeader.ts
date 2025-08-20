import { TaskQueryRenderer } from '../TaskQueryRenderer';

export function createHeader(rendererContext: TaskQueryRenderer, taskCount: number): HTMLElement {
    const header = document.createElement('div');
    header.style.cssText = `
        padding: 16px 20px;
        background: var(--b3-theme-background);
        border-bottom: 1px solid var(--b3-border-color);
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
        color: var(--b3-theme-text);
    `;

    if (rendererContext.selectedTag !== null) {
        const filterInfo = document.createElement('div');
        filterInfo.style.cssText = `
            font-size: 12px;
            color: var(--b3-theme-text-lighter);
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
        color: var(--b3-theme-text-lighter);
        font-weight: normal;
    `;

    header.appendChild(title);
    header.appendChild(count);

    // Attach rendererContext for updateFilterButtons usage
    (window as any).TaskQueryRendererContext = rendererContext;

    return header;
}
