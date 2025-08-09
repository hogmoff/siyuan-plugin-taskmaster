import { createSidebar, createTagsSection } from './sidebar/sidebar';
import { Task } from '../types/task';
import { createHeader, createFilterBar, updateFilterButtons, createRefreshButton } from './task-query-renderer/ui-components';
import { processTaskQuery } from './task-query-renderer/query-handler';
import { renderTasks } from './task-query-renderer/dom-manipulation';
export class TaskQueryRenderer {
    public isEnabled: boolean = false;
    public blockId: string;
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
            this.blockId = '';
        } catch (error) {
            console.warn('TaskQueryEngine not available:', error);
        }
    }

    public processQueries(element: HTMLElement) {
        if (!this.taskQueryEngine || !this.isEnabled) return;

        const codeBlocks = element.querySelectorAll('div[data-type="NodeCodeBlock"]');
        
        codeBlocks.forEach((block: HTMLElement) => {
            const textContent = block.textContent || '';
            const trimmedContent = textContent.trim();

            if (trimmedContent.startsWith('tasks')) {
                this.blockId = block.getAttribute('data-node-id'); 
                console.log('Processing task query for block:', this.blockId);
                processTaskQuery(this, block, trimmedContent);
            }
        });
    }

    public createTodoContainer(tasks: Task[], queryString: string): HTMLElement {
        this.currentTasks = tasks;
        this.currentQueryString = queryString;

        this.injectSidebarStyles();

        const container = document.createElement('div');
        container.className = 'todo-task-container';
        container.style.cssText = `
            background: #ffffff;
            border: 1px solid #e0e6e8;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            margin: 16px 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            overflow: auto;
            display: flex;
            position: relative;
            height: 500px;
        `;

        const sidebar = createSidebar(this, tasks);
        container.appendChild(sidebar);

        const mainContent = document.createElement('div');
        mainContent.className = 'main-content';
        mainContent.style.cssText = `
            flex: 1;
            display: flex;
            flex-direction: column;
            transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            margin-left: ${this.sidebarCollapsed ? '0' : '280px'};
            min-width: 0;
        `;

        const header = createHeader(this, tasks.length);
        mainContent.appendChild(header);

        const filterBar = createFilterBar(this);
        mainContent.appendChild(filterBar);

        const content = document.createElement('div');
        content.className = 'task-content';
        content.style.cssText = `
            padding: 0;
            flex: 1;
            overflow-y: auto;
        `;

        renderTasks(content, tasks, this);
        mainContent.appendChild(content);

        const refreshButton = createRefreshButton(this, queryString);
        mainContent.appendChild(refreshButton);

        container.appendChild(mainContent);
        return container;
    }

    public async refreshCurrentView(tasks: Task[]) {
        this.currentTasks = tasks;
        const container = document.querySelector('.todo-task-container');
        if (!container) return;

        const content = container.querySelector('.task-content') as HTMLElement;
        const sidebar = container.querySelector('.task-sidebar');

        if (content) {
            renderTasks(content, tasks, this);
        }

        if (sidebar) {
            const tagsSection = sidebar.querySelector('.tags-section');
            if (tagsSection) {
                const newTagsSection = createTagsSection(this, tasks);
                tagsSection.parentNode?.replaceChild(newTagsSection, tagsSection);
            }
        }

        updateFilterButtons(this);

        // Update sidebar state without replacing the entire sidebar
        if (sidebar) {
            sidebar.classList.toggle('collapsed', this.sidebarCollapsed);
            const mainContent = container.querySelector('.main-content');
            if (mainContent) {
                mainContent.classList.toggle('sidebar-collapsed', this.sidebarCollapsed);
            }
        }
    }

    public createTagItem(label: string, tag: string | null, count: number): HTMLElement {
        const item = document.createElement('div');
        item.className = 'tag-item';
        const isSelected = this.selectedTag === tag;

        item.style.cssText = `
            padding: 10px 16px;
            margin: 2px 0;
            cursor: pointer;
            display: flex;
            justify-content: space-between;
            align-items: center;
            transition: all 0.2s ease;
            background-color: ${isSelected ? '#e8f2ff' : 'transparent'};
            color: ${isSelected ? '#0066cc' : '#202020'};
            border-radius: 8px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            line-height: 20px;
        `;

        const tagLabel = document.createElement('span');
        tagLabel.textContent = label;
        tagLabel.style.cssText = `
            font-weight: ${isSelected ? '600' : '500'};
            flex: 1;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        `;

        const countSpan = document.createElement('span');
        countSpan.textContent = count.toString();
        countSpan.style.cssText = `
            font-size: 12px;
            font-weight: 600;
            color: ${isSelected ? '#0066cc' : '#666666'};
            background: ${isSelected ? '#cce5ff' : '#f5f5f5'};
            padding: 2px 8px;
            border-radius: 12px;
            min-width: 20px;
            text-align: center;
            margin-left: 8px;
        `;

        item.addEventListener('click', () => {
            this.selectedTag = tag;
            this.refreshCurrentView(this.currentTasks);
        });

        item.addEventListener('mouseenter', () => {
            if (!isSelected) {
                item.style.backgroundColor = '#f8f9fa';
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
        if (document.getElementById('todo-sidebar-styles')) return;

        const style = document.createElement('style');
        style.id = 'todo-sidebar-styles';
        style.textContent = `
            .todo-task-container {
                position: relative !important;
                overflow: visible !important;
            }

            .task-sidebar {
                position: absolute !important;
                z-index: 100 !important;
                background: #fafafa !important;
                border-right: 1px solid #e0e6e8 !important;
                box-shadow: 2px 0 8px rgba(0, 0, 0, 0.08) !important;
            }

            .task-sidebar.collapsed {
                transform: translateX(-100%) !important;
            }

            .collapsed-toggle {
                position: absolute !important;
                z-index: 101 !important;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
            }

            .collapsed-toggle:hover {
                transform: scale(1.05) !important;
            }

            .main-content {
                transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
            }

            @media (max-width: 768px) {
                .task-sidebar {
                    width: 260px !important;
                }

                .main-content {
                    margin-left: 0 !important;
                }

                .collapsed-toggle {
                    right: -18px !important;
                    left: auto !important;
                }

                .task-sidebar:not(.collapsed) + .main-content {
                    margin-left: 260px !important;
                }
            }

            @media (max-width: 480px) {
                .task-sidebar {
                    width: 100% !important;
                    border-radius: 0 !important;
                }

                .collapsed-toggle {
                    right: 16px !important;
                    top: 16px !important;
                }
            }

            .task-sidebar::-webkit-scrollbar {
                width: 6px;
            }

            .task-sidebar::-webkit-scrollbar-track {
                background: transparent;
            }

            .task-sidebar::-webkit-scrollbar-thumb {
                background: #e0e6e8;
                border-radius: 3px;
            }

            .task-sidebar::-webkit-scrollbar-thumb:hover {
                background: #d0d0d0;
            }

            .tag-item {
                user-select: none;
                -webkit-user-select: none;
                -moz-user-select: none;
                -ms-user-select: none;
            }

            .tag-item:active {
                transform: scale(0.98);
                transition: transform 0.1s ease;
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

    public refreshAll(root: HTMLElement = document.body) {
      if (!this.taskQueryEngine || !this.isEnabled) return;

      // 1) Re-process already rendered containers (they now carry the query string)
      const containers = root.querySelectorAll<HTMLElement>('.todo-task-container[data-task-query]');
      containers.forEach((container) => {
        const query = (container.dataset.taskQuery || '').trim();
        if (query && query.startsWith('tasks')) {
          // Keep the last seen blockId for context (if present)
          this.blockId = container.dataset.taskQueryBlockId || this.blockId || '';
          // processTaskQuery replaces the given element with a fresh, re-rendered container
          processTaskQuery(this, container, query);
        }
      });

      // 2) Process any code blocks that might not have been rendered yet
      this.processQueries(root);
    }

    // NEW: Refresh the nearest todo container for a given element (e.g., a button inside)
    public refreshContainerFromElement(el: HTMLElement) {
      const container = el.closest<HTMLElement>('.todo-task-container');
      if (!container) return;
      const query = (container.dataset.taskQuery || '').trim();
      if (query && query.startsWith('tasks')) {
        this.blockId = container.dataset.taskQueryBlockId || this.blockId || '';
        processTaskQuery(this, container, query);
      }
    }
}

