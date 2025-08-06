import { createSidebar, createTagsSection } from './sidebar/sidebar';
import { Task } from '../types/task';
import { createHeader, createFilterBar, updateFilterButtons, createRefreshButton } from './task-query-renderer/ui-components';
import { processTaskQuery } from './task-query-renderer/query-handler';
import { renderTasks } from './task-query-renderer/dom-manipulation';

export class TaskQueryRenderer {
    public taskService: any;
    public taskQueryEngine: any;
    public currentFilter: 'today' | 'next7days' | 'all' | 'date' = 'today';
    public selectedDate: Date | null = null;
    public selectedTag: string | null = null;
    public sidebarCollapsed: boolean = false;
    public currentTasks: Task[] = [];
    public currentQueryString: string = '';

    constructor(taskService: any) {
        this.taskService = taskService;
        this.initialize();
        this.taskQueryEngine = null;
    }

    async initialize() {
        try {
            const module = await import('../components/tasks/taskQuery');
            this.taskQueryEngine = module.TaskQueryEngine;
        } catch (error) {
            console.warn('TaskQueryEngine not available:', error);
        }
    }

    public processQueries(element: HTMLElement) {
        if (!this.taskQueryEngine) return;

        const codeBlocks = element.querySelectorAll('div[data-type="NodeCodeBlock"]');
        
        codeBlocks.forEach((block: HTMLElement) => {
            const textContent = block.textContent || '';
            const trimmedContent = textContent.trim();

            if (trimmedContent.startsWith('tasks')) {
                processTaskQuery(this, block, trimmedContent);
            }
        });
    }

    public createTodoistLikeContainer(tasks: Task[], queryString: string): HTMLElement {
        this.currentTasks = tasks;
        this.currentQueryString = queryString;

        this.injectSidebarStyles();

        const container = document.createElement('div');
        container.className = 'todoist-task-container';
        container.style.cssText = `
            background: #ffffff;
            border: 1px solid #e0e6e8;
            border-radius: 10px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);
            margin: 16px 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            overflow: hidden;
            display: flex;
            position: relative;
        `;

        const sidebar = createSidebar(this, tasks);
        container.appendChild(sidebar);

        const mainContent = document.createElement('div');
        mainContent.className = 'main-content';
        mainContent.style.cssText = `
            flex: 1;
            display: flex;
            flex-direction: column;
            transition: margin-left 0.3s ease;
            margin-left: ${this.sidebarCollapsed ? '0' : '200px'};
        `;

        const header = createHeader(this, tasks.length);
        mainContent.appendChild(header);

        const filterBar = createFilterBar(this);
        mainContent.appendChild(filterBar);

        const content = document.createElement('div');
        content.className = 'task-content';
        content.style.cssText = `
            padding: 0;
            min-height: 200px;
        `;

        renderTasks(content, tasks, this);
        mainContent.appendChild(content);

        const refreshButton = createRefreshButton(this, queryString);
        mainContent.appendChild(refreshButton);

        container.appendChild(mainContent);
        return container;
    }

    public async refreshCurrentView() {
        const container = document.querySelector('.todoist-task-container');
        if (!container) return;

        const content = container.querySelector('.task-content') as HTMLElement;
        const sidebar = container.querySelector('.task-sidebar');

        if (content) {
            renderTasks(content, this.currentTasks, this);
        }

        if (sidebar) {
            const tagsSection = sidebar.querySelector('.tags-section');
            if (tagsSection) {
                const newTagsSection = createTagsSection(this, this.currentTasks);
                tagsSection.parentNode?.replaceChild(newTagsSection, tagsSection);
            }
        }

        updateFilterButtons(this);

        // Replace sidebar to ensure event handlers and state are updated
        const newSidebar = createSidebar(this, this.currentTasks);
        container.replaceChild(newSidebar, sidebar);
    }

    public createTagItem(label: string, tag: string | null, count: number): HTMLElement {
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

    public showError(block: HTMLElement, message: string) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'task-query-error';
        errorDiv.style.cssText = `
            border: 1px solid #dc4c3e;
            border-radius: 10px;
            padding: 16px;
            margin: 8px 0;
            background: #fff5f5;
            color: #dc4c3e;
            font-family: monospace;
        `;
        errorDiv.innerHTML = `<strong>Task Query Fehler:</strong><br>${this.escapeHtml(message)}`;

        block.parentNode?.replaceChild(errorDiv, block);
    }

    private escapeHtml(text: string): string {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    public injectSidebarStyles() {
        if (document.getElementById('todoist-sidebar-styles')) return;

        const style = document.createElement('style');
        style.id = 'todoist-sidebar-styles';
        style.textContent = `
            .todoist-task-container {
                position: relative !important;
                overflow: visible !important;
            }

            .task-sidebar {
                position: absolute !important;
                z-index: 100 !important;
            }

            .collapsed-toggle {
                position: absolute !important;
                z-index: 101 !important;
            }

            @media (max-width: 768px) {
                .task-sidebar {
                    width: 250px !important;
                }

                .main-content {
                    margin-left: 0 !important;
                }

                .collapsed-toggle {
                    left: 8px !important;
                }
            }

            .task-sidebar::-webkit-scrollbar {
                width: 4px;
            }

            .task-sidebar::-webkit-scrollbar-track {
                background: #f1f1f1;
            }

            .task-sidebar::-webkit-scrollbar-thumb {
                background: #c1c1c1;
                border-radius: 2px;
            }

            .task-sidebar::-webkit-scrollbar-thumb:hover {
                background: #a8a8a8;
            }

            .task-sidebar, .main-content, .collapsed-toggle {
                transition: all 0.3s ease !important;
            }
        `;

        document.head.appendChild(style);
    }
}

