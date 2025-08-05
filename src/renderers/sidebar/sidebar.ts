import { Task } from '../../types/task';

export function createSidebar(this: any, tasks: Task[]): HTMLElement {
    const sidebarContainer = document.createElement('div');
    sidebarContainer.className = 'sidebar-container';
    sidebarContainer.style.cssText = `
        position: relative;
        height: 100%;
        display: flex;
        flex-direction: row;
        align-items: stretch;
    `;

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
        overflow: hidden;
        position: relative;
    `;

    const sidebarHeader = document.createElement('div');
    sidebarHeader.className = 'sidebar-header';
    sidebarHeader.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 12px;
        border-bottom: 1px solid var(--b3-theme-surface-lighter);
    `;

    const sidebarTitle = document.createElement('h2');
    sidebarTitle.textContent = 'Projects';
    sidebarTitle.style.cssText = `
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
        background-color: transparent;
        border: 1px solid var(--b3-theme-surface-lighter);
        color: var(--b3-theme-on-surface);
        position: absolute;
        top: 16px;
        left: -16px;
        z-index: 102;
        background-color: var(--b3-theme-background);
    `;

    const updateSidebarState = () => {
        if (this.sidebarCollapsed) {
            sidebar.style.width = '0px';
            sidebar.style.padding = '0px';
            sidebar.style.borderLeft = 'none';
            sidebarTitle.style.opacity = '0';
            toggleButton.innerHTML = `<svg width="16" height="16"><use xlink:href="#iconLeft"></use></svg>`;
            toggleButton.setAttribute('aria-label', 'Expand sidebar');
            toggleButton.style.left = '-16px';
            toggleButton.style.transform = 'translateX(-100%)';
        } else {
            sidebar.style.width = '280px';
            sidebar.style.padding = '16px';
            sidebar.style.borderLeft = '1px solid var(--b3-theme-surface-lighter)';
            sidebarTitle.style.opacity = '1';
            toggleButton.innerHTML = `<svg width="16" height="16"><use xlink:href="#iconRight"></use></svg>`;
            toggleButton.setAttribute('aria-label', 'Collapse sidebar');
            toggleButton.style.left = '-16px';
            toggleButton.style.transform = 'translateX(0)';
        }
    };

    toggleButton.addEventListener('click', () => {
        this.sidebarCollapsed = !this.sidebarCollapsed;
        updateSidebarState();
    });

    toggleButton.addEventListener('mouseenter', () => {
        toggleButton.style.backgroundColor = 'var(--b3-theme-surface-light)';
        toggleButton.style.borderColor = 'var(--b3-theme-primary-light)';
        toggleButton.style.transform = this.sidebarCollapsed ? 'translateX(-100%) scale(1.05)' : 'translateX(0) scale(1.05)';
    });

    toggleButton.addEventListener('mouseleave', () => {
        toggleButton.style.backgroundColor = 'var(--b3-theme-background)';
        toggleButton.style.borderColor = 'var(--b3-theme-surface-lighter)';
        toggleButton.style.transform = this.sidebarCollapsed ? 'translateX(-100%)' : 'translateX(0)';
    });

    sidebarHeader.appendChild(sidebarTitle);
    sidebar.appendChild(sidebarHeader);

    const tagsSection = this.createTagsSection(tasks);
    sidebar.appendChild(tagsSection);

    sidebarContainer.appendChild(sidebar);
    sidebarContainer.appendChild(toggleButton);

    // Initialize collapsed state if not set
    if (this.sidebarCollapsed === undefined) {
        this.sidebarCollapsed = false;
    }

    updateSidebarState();

    return sidebarContainer;
}

export function createTagsSection(this: any, tasks: Task[]): HTMLElement {
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

    const allTags = new Set<string>();
    tasks.forEach(task => {
        if (task.tags) {
            task.tags.forEach(tag => allTags.add(tag));
        }
    });

    const sortedTags = Array.from(allTags).sort();

    const allProjectsCount = tasks.length;
    tagsContainer.appendChild(this.createTagItem('All Projects', null, allProjectsCount));

    const untaggedTasks = tasks.filter(task => !task.tags || task.tags.length === 0);
    if (untaggedTasks.length > 0) {
        tagsContainer.appendChild(this.createTagItem('Untagged', 'untagged', untaggedTasks.length));
    }

    sortedTags.forEach(tag => {
        const taskCount = tasks.filter(task => task.tags && task.tags.includes(tag)).length;
        tagsContainer.appendChild(this.createTagItem(tag, tag, taskCount));
    });

    return tagsContainer;
}

export function createTagItem(this: any, label: string, tag: string | null, count: number): HTMLElement {
    const item = document.createElement('div');
    item.className = 'tag-item';
    item.dataset.tag = tag === null ? 'all' : tag;
    item.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 12px;
        cursor: pointer;
        border-radius: 6px;
        font-size: 14px;
        margin-bottom: 4px;
        transition: all 0.2s ease;
        border: 1px solid transparent;
    `;

    const tagLabel = document.createElement('span');
    tagLabel.textContent = label;
    tagLabel.style.cssText = `
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        margin-right: 8px;
        color: var(--b3-theme-on-background);
    `;

    const taskCount = document.createElement('span');
    taskCount.textContent = count.toString();
    taskCount.style.cssText = `
        background-color: var(--b3-theme-surface-lighter);
        color: var(--b3-theme-on-surface);
        padding: 3px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 500;
        min-width: 20px;
        text-align: center;
        transition: all 0.2s ease;
    `;

    item.appendChild(tagLabel);
    item.appendChild(taskCount);

    const updateSelection = () => {
        const currentTag = this.selectedTag === null ? 'all' : this.selectedTag;
        if (item.dataset.tag === currentTag) {
            item.style.backgroundColor = 'var(--b3-theme-primary-light)';
            item.style.borderColor = 'var(--b3-theme-primary)';
            item.style.fontWeight = '600';
            tagLabel.style.color = 'var(--b3-theme-primary)';
            taskCount.style.backgroundColor = 'var(--b3-theme-primary)';
            taskCount.style.color = 'var(--b3-theme-on-primary)';
        } else {
            item.style.backgroundColor = 'transparent';
            item.style.borderColor = 'transparent';
            item.style.fontWeight = 'normal';
            tagLabel.style.color = 'var(--b3-theme-on-background)';
            taskCount.style.backgroundColor = 'var(--b3-theme-surface-lighter)';
            taskCount.style.color = 'var(--b3-theme-on-surface)';
        }
    };

    item.addEventListener('click', () => {
        this.selectedTag = tag;
        this.refreshCurrentView();
    });

    item.addEventListener('mouseenter', () => {
        const currentTag = this.selectedTag === null ? 'all' : this.selectedTag;
        if (item.dataset.tag !== currentTag) {
            item.style.backgroundColor = 'var(--b3-theme-surface-light)';
            item.style.borderColor = 'var(--b3-theme-surface)';
            item.style.transform = 'translateX(-2px)';
        }
    });

    item.addEventListener('mouseleave', () => {
        const currentTag = this.selectedTag === null ? 'all' : this.selectedTag;
        if (item.dataset.tag !== currentTag) {
            item.style.backgroundColor = 'transparent';
            item.style.borderColor = 'transparent';
            item.style.transform = 'translateX(0)';
        }
    });

    // Set initial state
    updateSelection();
    
    // Observer for updating selection state
    const observer = new MutationObserver(() => {
        updateSelection();
    });
    
    // Observe changes in the parent container
    if (item.parentElement?.parentElement?.parentElement) {
        observer.observe(item.parentElement.parentElement.parentElement, { 
            attributes: true, 
            childList: true, 
            subtree: true 
        });
    }

    return item;
}