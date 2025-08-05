import { Task } from '../../types/task';

export function createSidebar(this: any, tasks: Task[]): HTMLElement {
    const sidebar = document.createElement('div');
    sidebar.className = 'task-sidebar';
    sidebar.style.cssText = `
        width: 200px;
        background: #fafbfc;
        border-right: 1px solid #e0e6e8;
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        z-index: 100;
        display: flex;
        flex-direction: column;
        transform: translateX(${this.sidebarCollapsed ? '-200px' : '0'});
        transition: transform 0.3s ease;
    `;

    const sidebarHeader = document.createElement('div');
    sidebarHeader.style.cssText = `
        padding: 16px;
        background: #f4f6f8;
        border-bottom: 1px solid #e0e6e8;
        display: flex;
        justify-content: space-between;
        align-items: center;
    `;

    const sidebarTitle = document.createElement('h4');
    sidebarTitle.textContent = 'Projekte';
    sidebarTitle.style.cssText = `
        margin: 0;
        font-size: 14px;
        font-weight: 600;
        color: #202020;
    `;

    const toggleButton = document.createElement('button');
    toggleButton.innerHTML = this.sidebarCollapsed ? '▶' : '◀';
    toggleButton.className = 'sidebar-toggle-button';
    toggleButton.style.cssText = `
        background: none;
        border: none;
        font-size: 16px;
        cursor: pointer;
        color: #666;
        padding: 4px;
        border-radius: 4px;
        transition: background-color 0.2s ease;
    `;

    toggleButton.addEventListener('click', () => {
        this.toggleSidebar();
    });

    toggleButton.addEventListener('mouseenter', () => {
        toggleButton.style.backgroundColor = '#e0e6e8';
    });

    toggleButton.addEventListener('mouseleave', () => {
        toggleButton.style.backgroundColor = 'transparent';
    });

    sidebarHeader.appendChild(sidebarTitle);
    sidebarHeader.appendChild(toggleButton);
    sidebar.appendChild(sidebarHeader);

    const tagsSection = createTagsSection.call(this, tasks);
    sidebar.appendChild(tagsSection);

    const collapsedToggle = document.createElement('button');
    collapsedToggle.className = 'collapsed-toggle';
    collapsedToggle.innerHTML = '▶';
    collapsedToggle.style.cssText = `
        position: absolute;
        left: ${this.sidebarCollapsed ? '8px' : '-40px'};
        top: 16px;
        width: 32px;
        height: 32px;
        background: #fafbfc;
        border: 1px solid #e0e6e8;
        border-radius: 6px;
        cursor: pointer;
        font-size: 12px;
        color: #666;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background-color 0.3s ease, left 0.3s ease, box-shadow 0.3s ease;
        z-index: 101;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    `;

    collapsedToggle.addEventListener('click', () => {
        this.toggleSidebar();
    });

    collapsedToggle.addEventListener('mouseenter', () => {
        collapsedToggle.style.backgroundColor = '#e0e6e8';
        collapsedToggle.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
    });

    collapsedToggle.addEventListener('mouseleave', () => {
        collapsedToggle.style.backgroundColor = '#fafbfc';
        collapsedToggle.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
    });

    sidebar.appendChild(collapsedToggle);
    return sidebar;
}

export function createTagsSection(this: any, tasks: Task[]): HTMLElement {
    const section = document.createElement('div');
    section.className = 'tags-section';
    section.style.cssText = `
        flex: 1;
        overflow-y: auto;
        padding: 8px 0;
    `;

    const allTags = new Set<string>();
    tasks.forEach(task => {
        if (task.tags) {
            task.tags.forEach(tag => allTags.add(tag));
        }
    });

    const allProjectsItem = createTagItem.call(this, 'Alle Projekte', null, tasks.length);
    section.appendChild(allProjectsItem);

    const untaggedCount = tasks.filter(task => !task.tags || task.tags.length === 0).length;
    if (untaggedCount > 0) {
        const untaggedItem = createTagItem.call(this, 'Ohne Projekt', '', untaggedCount);
        section.appendChild(untaggedItem);
    }

    const sortedTags = Array.from(allTags).sort();
    sortedTags.forEach(tag => {
        const tagCount = tasks.filter(task => task.tags && task.tags.includes(tag)).length;
        const tagItem = createTagItem.call(this, `#${tag}`, tag, tagCount);
        section.appendChild(tagItem);
    });

    return section;
}

export function createTagItem(this: any, label: string, tag: string | null, count: number): HTMLElement {
    const item = document.createElement('div');
    item.className = 'tag-item';
    const isSelected = this.selectedTag === tag;

    item.style.cssText = `
        padding: 8px 16px;
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
        transition: background-color 0.2s ease;
        background-color: ${isSelected ? '#dc4c3e' : 'transparent'};
        color: ${isSelected ? 'white' : '#202020'};
    `;

    const tagLabel = document.createElement('span');
    tagLabel.textContent = label;
    tagLabel.style.cssText = `
        font-size: 13px;
        font-weight: ${isSelected ? '600' : '400'};
    `;

    const countSpan = document.createElement('span');
    countSpan.textContent = count.toString();
    countSpan.style.cssText = `
        font-size: 12px;
        color: ${isSelected ? 'rgba(255,255,255,0.8)' : '#808080'};
        background: ${isSelected ? 'rgba(255,255,255,0.2)' : '#f0f0f0'};
        padding: 2px 6px;
        border-radius: 10px;
        min-width: 20px;
        text-align: center;
    `;

    item.addEventListener('click', () => {
        this.selectedTag = tag;
        this.refreshCurrentView();
    });

    item.addEventListener('mouseenter', () => {
        if (!isSelected) {
            item.style.backgroundColor = '#f5f5f5';
        }
    });

    item.addEventListener('mouseleave', () => {
        if (!isSelected) {
            item.style.backgroundColor = 'transparent';
        }
    });

    item.appendChild(tagLabel);
    item.appendChild(countSpan);
    return item;
}
