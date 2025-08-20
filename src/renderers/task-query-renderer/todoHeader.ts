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