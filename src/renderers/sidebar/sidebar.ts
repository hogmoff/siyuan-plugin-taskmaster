import { Task } from '../../types/task';

import { TaskQueryRenderer } from '../TaskQueryRenderer';

export function createSidebar(rendererContext: TaskQueryRenderer, tasks: Task[]): HTMLElement {
    const sidebar = document.createElement('div');
    sidebar.className = 'sidebar';
    sidebar.style.cssText = `
        width: 280px;
        height: 100%;
        background-color: var(--b3-theme-background);
        border-left: 1px solid var(--b3-theme-surface-lighter);
        padding: 16px;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        overflow: hidden;
    `;

    if (rendererContext.sidebarCollapsed) {
        sidebar.classList.add('collapsed');
    }

    const header = document.createElement('div');
    header.className = 'sidebar-header';
    header.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 12px;
        border-bottom: 1px solid var(--b3-theme-surface-lighter);
    `;

    const title = document.createElement('h2');
    title.textContent = 'Projects';
    title.style.cssText = `
        font-size: 18px;
        font-weight: 600;
        margin: 0;
        color: var(--b3-theme-on-background);
        opacity: 1;
        transition: opacity 0.3s ease;
    `;

    const toggleButton = document.createElement('div');
    toggleButton.className = 'sidebar-toggle-button';
    toggleButton.style.cssText = `
        cursor: pointer;
        width: 32px;
        height: 32px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        background-color: var(--b3-theme-background);
        border: 1px solid var(--b3-theme-surface-lighter);
        color: var(--b3-theme-on-surface);
        position: absolute;
        top: 16px;
        left: -16px;
        z-index: 102;
    `;

    toggleButton.innerHTML = rendererContext.sidebarCollapsed
        ? `<svg width="16" height="16"><use xlink:href="#iconLeft"></use></svg>`
        : `<svg width="16" height="16"><use xlink:href="#iconRight"></use></svg>`;
    toggleButton.setAttribute('aria-label', rendererContext.sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar');
    toggleButton.style.transform = rendererContext.sidebarCollapsed ? 'translateX(-100%)' : 'translateX(0)';

    toggleButton.addEventListener('click', () => {
        rendererContext.sidebarCollapsed = !rendererContext.sidebarCollapsed;
        sidebar.classList.toggle('collapsed');
        toggleButton.innerHTML = rendererContext.sidebarCollapsed
            ? `<svg width="16" height="16"><use xlink:href="#iconLeft"></use></svg>`
            : `<svg width="16" height="16"><use xlink:href="#iconRight"></use></svg>`;
        toggleButton.setAttribute('aria-label', rendererContext.sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar');
        toggleButton.style.transform = rendererContext.sidebarCollapsed ? 'translateX(-100%)' : 'translateX(0)';
        const mainContent = document.querySelector('.main-content') as HTMLElement;
        if (mainContent) {
            mainContent.style.marginLeft = rendererContext.sidebarCollapsed ? '0' : '250px';
        }
        title.style.opacity = rendererContext.sidebarCollapsed ? '0' : '1';
    });

    toggleButton.addEventListener('mouseenter', () => {
        toggleButton.style.backgroundColor = 'var(--b3-theme-surface-light)';
        toggleButton.style.borderColor = 'var(--b3-theme-primary-light)';
        toggleButton.style.transform = rendererContext.sidebarCollapsed ? 'translateX(-100%) scale(1.05)' : 'translateX(0) scale(1.05)';
    });

    toggleButton.addEventListener('mouseleave', () => {
        toggleButton.style.backgroundColor = 'var(--b3-theme-background)';
        toggleButton.style.borderColor = 'var(--b3-theme-surface-lighter)';
        toggleButton.style.transform = rendererContext.sidebarCollapsed ? 'translateX(-100%)' : 'translateX(0)';
    });

    header.appendChild(title);
    header.appendChild(toggleButton);

    sidebar.appendChild(header);

    const tagsSection = createTagsSection(rendererContext, tasks);
    sidebar.appendChild(tagsSection);

    return sidebar;
}

export function createTagsSection(rendererContext: TaskQueryRenderer, tasks: Task[]): HTMLElement {
    const tagsContainer = document.createElement('div');
    tagsContainer.className = 'tags-container';
    tagsContainer.style.cssText = `
        overflow-y: auto;
        flex-grow: 1;
        padding-right: 4px;
    `;

    // Custom scrollbar styling
    const style = document.createElement('style');
    style.textContent = `
        .tags-container::-webkit-scrollbar {
            width: 6px;
        }
        .tags-container::-webkit-scrollbar-track {
            background: transparent;
        }
        .tags-container::-webkit-scrollbar-thumb {
            background: var(--b3-theme-surface-lighter);
            border-radius: 3px;
        }
        .tags-container::-webkit-scrollbar-thumb:hover {
            background: var(--b3-theme-surface);
        }
    `;
    document.head.appendChild(style);

    const allTags = tasks.flatMap(task => task.tags || []);
    const uniqueTags = [...new Set(allTags)].sort();

    tagsContainer.appendChild(rendererContext.createTagItem('All Projects', null, tasks.length));

    const untaggedTasks = tasks.filter(task => !task.tags || task.tags.length === 0);
    if (untaggedTasks.length > 0) {
        tagsContainer.appendChild(rendererContext.createTagItem('Untagged', 'untagged', untaggedTasks.length));
    }

    uniqueTags.forEach(tag => {
        const count = tasks.filter(task => task.tags && task.tags.includes(tag)).length;
        tagsContainer.appendChild(rendererContext.createTagItem(tag, tag, count));
    });

    return tagsContainer;
}


