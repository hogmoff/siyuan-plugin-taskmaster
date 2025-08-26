import { Task } from '../../types/task';
import { TaskQueryRenderer } from '../TaskQueryRenderer';

export function createSidebar(rendererContext: TaskQueryRenderer, tasks: Task[]): HTMLElement {
    // Create container for sidebar and toggle button
    const container = document.createElement('div');
    container.style.cssText = `
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        z-index: 1;
    `;

    const sidebar = document.createElement('div');
    sidebar.className = 'task-sidebar';
    sidebar.style.cssText = `
        position: relative;
        width: 280px;
        height: 100%;
        background: var(--b3-theme-background);
        border-right: 1px solid var(--b3-border-color);
        display: flex;
        flex-direction: column;
        transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
        overflow: hidden;
    `;

    if (rendererContext.sidebarCollapsed) {
        sidebar.style.width = '0';
    }

    // Sidebar Content
    const sidebarContent = document.createElement('div');
    sidebarContent.style.cssText = `
        flex: 1;
        display: flex;
        flex-direction: column;
        padding: 24px 16px;
        overflow: hidden;
        min-width: 280px;
    `;

    // Header
    const header = document.createElement('div');
    header.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
        padding-bottom: 16px;
        border-bottom: 1px solid var(--b3-border-color);
    `;

    const title = document.createElement('h2');
    title.textContent = 'Tags';
    title.style.cssText = `
        font-size: 20px;
        font-weight: 700;
        margin: 0;
        color: var(--b3-theme-text);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        letter-spacing: -0.02em;
    `;

    header.appendChild(title);
    sidebarContent.appendChild(header);

    // Tags Section
    const tagsSection = createTagsSection(rendererContext, tasks);
    sidebarContent.appendChild(tagsSection);

    sidebar.appendChild(sidebarContent);

    // Toggle Button
    const toggleButton = document.createElement('button');
    toggleButton.className = 'sidebar-toggle';
    toggleButton.setAttribute('aria-label', 'Toggle sidebar');
    toggleButton.style.cssText = `
        position: absolute;
        top: 24px;
        left: ${rendererContext.sidebarCollapsed ? '0' : '280px'};
        width: 24px;
        height: 36px;
        background: var(--b3-theme-background);
        border: 1px solid var(--b3-border-color);
        border-radius: 0 50% 50% 0;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        z-index: 101;
    `;

    const toggleIcon = document.createElement('div');
    toggleIcon.style.cssText = `
        width: 18px;
        height: 18px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--b3-theme-text-lighter);
        transition: transform 0.3s ease;
    `;

    toggleIcon.innerHTML = rendererContext.sidebarCollapsed
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>'
        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>';

    toggleButton.appendChild(toggleIcon);

    toggleButton.addEventListener('click', () => {
        rendererContext.sidebarCollapsed = !rendererContext.sidebarCollapsed;

        if (rendererContext.sidebarCollapsed) {
            sidebar.style.width = '0';
            toggleButton.style.left = '0';
            toggleIcon.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>';
        } else {
            sidebar.style.width = '280px';
            toggleButton.style.left = '280px';
            toggleIcon.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>';
        }

        // Update main content margin
        const mainContent = document.querySelector('.main-content') as HTMLElement;
        if (mainContent) {
            mainContent.style.marginLeft = rendererContext.sidebarCollapsed ? '0' : '280px';
        }

        // Update backdrop visibility
        updateBackdrop();
    });

    // Keep backdrop state in sync on resize
    window.addEventListener('resize', updateBackdrop);

    toggleButton.addEventListener('mouseenter', () => {
        toggleButton.style.backgroundColor = 'var(--b3-theme-surface-light)';
        toggleButton.style.transform = 'scale(1.05)';
    });

    toggleButton.addEventListener('mouseleave', () => {
        toggleButton.style.backgroundColor = 'var(--b3-theme-background)';
        toggleButton.style.transform = 'scale(1)';
    });

    container.appendChild(sidebar);
    container.appendChild(toggleButton);

    // Backdrop overlay (small screens) with fade
    const backdrop = document.createElement('div');
    backdrop.className = 'sidebar-backdrop';
    backdrop.style.cssText = `
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.2);
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.2s ease;
    `;
    container.appendChild(backdrop);

    function updateBackdrop() {
        const useBackdrop = window.innerWidth <= 768 && !rendererContext.sidebarCollapsed;
        backdrop.style.opacity = useBackdrop ? '1' : '0';
        backdrop.style.pointerEvents = useBackdrop ? 'auto' : 'none';
    }
    updateBackdrop();

    backdrop.addEventListener('click', () => {
        if (!rendererContext.sidebarCollapsed) {
            rendererContext.sidebarCollapsed = true;
            sidebar.style.width = '0';
            toggleButton.style.left = '0';
            toggleIcon.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>';
            const mainContent = document.querySelector('.main-content') as HTMLElement;
            if (mainContent) mainContent.style.marginLeft = '0';
            updateBackdrop();
        }
    });

    return container;

}

export function createTagsSection(rendererContext: TaskQueryRenderer, tasks: Task[]): HTMLElement {
    const container = document.createElement('div');
    container.style.cssText = `
        flex: 1;
        overflow-y: auto;
        padding-right: 8px;
    `;

    // Add custom scrollbar styles
    const scrollbarStyle = document.createElement('style');
    scrollbarStyle.textContent = `
        .tags-container::-webkit-scrollbar {
            width: 6px;
        }
        .tags-container::-webkit-scrollbar-track {
            background: transparent;
        }
        .tags-container::-webkit-scrollbar-thumb {
            background: var(--b3-border-color);
            border-radius: 3px;
        }
        .tags-container::-webkit-scrollbar-thumb:hover {
            background: var(--b3-border-color);
        }
    `;
    document.head.appendChild(scrollbarStyle);

    const allTags = tasks.flatMap(task => task.tags || []);
    const uniqueTags = [...new Set(allTags)].sort();

    // Create tags container
    const tagsContainer = document.createElement('div');
    tagsContainer.className = 'tags-container';
    tagsContainer.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 2px;
    `;

    // Add "All Projects" item
    tagsContainer.appendChild(rendererContext.createTagItem('Alle Tags', null, tasks.length));

    // Add "Untagged" item if needed
    const untaggedTasks = tasks.filter(task => !task.tags || task.tags.length === 0);
    if (untaggedTasks.length > 0) {
        tagsContainer.appendChild(rendererContext.createTagItem('Ohne Tag', '', untaggedTasks.length));
    }

    // Add individual tags
    uniqueTags.forEach(tag => {
        const count = tasks.filter(task => task.tags && task.tags.includes(tag)).length;
        tagsContainer.appendChild(rendererContext.createTagItem(tag, tag, count));
    });

    container.appendChild(tagsContainer);
    return container;
}
