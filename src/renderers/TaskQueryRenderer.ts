import { createSidebar, createTagsSection, createTagItem } from './sidebar/sidebar';
import { Task, TaskGroup } from '../types/task';
import { formatDateGroup, isToday, isWithinDays, getRelativeDateString } from '../utils/dateUtils';
import { applyCurrentFilter, sortTasks, groupTasksByDate } from './task-query-renderer/task-operations';
import { createHeader, createFilterBar, updateFilterButtons } from './task-query-renderer/ui-components';
import { processTaskQuery, refreshQuery } from './task-query-renderer/query-handler';

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
        this.taskQueryEngine = null;
        (window as any).TaskQueryRendererContext = this;
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

        const sidebar = this.createSidebar(tasks);
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

        this.renderTasks(content, tasks);
        mainContent.appendChild(content);

        const refreshButton = this.createRefreshButton(queryString);
        mainContent.appendChild(refreshButton);

        container.appendChild(mainContent);
        return container;
    }

    private createSidebar = createSidebar;
    private createTagsSection = createTagsSection;
    private createTagItem = createTagItem;

    private renderTasks(container: HTMLElement, tasks: Task[]) {
        container.innerHTML = '';

        let filteredTasks = applyCurrentFilter(tasks, this.currentFilter, this.selectedDate, this.selectedTag);
        const sortedTasks = sortTasks(filteredTasks);
        const groupedTasks = groupTasksByDate(sortedTasks);

        if (groupedTasks.length === 0) {
            const noTasks = document.createElement('div');
            noTasks.style.cssText = `
                text-align: center;
                padding: 40px 20px;
                color: #808080;
                font-size: 16px;
            `;
            noTasks.textContent = 'Keine Aufgaben gefunden';
            container.appendChild(noTasks);
            return;
        }

        groupedTasks.forEach(group => {
            const groupHeader = document.createElement('div');
            groupHeader.style.cssText = `
                padding: 16px 20px 8px;
                font-weight: 600;
                font-size: 14px;
                color: #202020;
                background: #ffffff;
                border-bottom: 1px solid #f0f0f0;
                position: sticky;
                top: 0;
                z-index: 10;
            `;
            groupHeader.textContent = `${group.label} (${group.tasks.length})`;
            container.appendChild(groupHeader);

            group.tasks.forEach(task => {
                const taskElement = this.createTaskItem(task);
                container.appendChild(taskElement);
            });
        });
    }

    private createTaskItem(task: Task): HTMLElement {
        const taskDiv = document.createElement('div');
        taskDiv.className = 'task-item';
        taskDiv.style.cssText = `
            display: flex;
            align-items: center;
            padding: 12px 20px;
            border-bottom: 1px solid #f5f5f5;
            transition: background-color 0.2s ease;
            cursor: pointer;
        `;

        taskDiv.addEventListener('mouseenter', () => {
            taskDiv.style.backgroundColor = '#fafbfc';
        });
        taskDiv.addEventListener('mouseleave', () => {
            taskDiv.style.backgroundColor = 'transparent';
        });

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = task.status === 'done';
        checkbox.style.cssText = `
            margin-right: 12px;
            width: 18px;
            height: 18px;
            cursor: pointer;
            accent-color: #dc4c3e;
        `;

        checkbox.addEventListener('change', async (e) => {
            e.stopPropagation();
            task.status = checkbox.checked ? 'done' : 'todo';
            await this.taskService.updateTask(task);

            const description = taskDiv.querySelector('.task-description') as HTMLElement;
            if (description) {
                description.style.textDecoration = task.status === 'done' ? 'line-through' : 'none';
                description.style.color = task.status === 'done' ? '#808080' : '#202020';
            }
        });

        const priorityIndicator = document.createElement('div');
        if (task.priority) {
            const colors = {
                urgent: '#dc4c3e',
                high: '#ff8800',
                medium: '#f4c842',
                low: '#4c9aff'
            };
            priorityIndicator.style.cssText = `
                width: 4px;
                height: 18px;
                background-color: ${colors[task.priority]};
                margin-right: 12px;
                border-radius: 2px;
            `;
        } else {
            priorityIndicator.style.cssText = `
                width: 4px;
                height: 18px;
                margin-right: 12px;
            `;
        }

        const content = document.createElement('div');
        content.style.cssText = `
            flex: 1;
            display: flex;
            flex-direction: column;
            min-width: 0;
        `;

        const description = document.createElement('div');
        description.textContent = task.description;
        description.className = 'task-description';
        description.style.cssText = `
            font-size: 14px;
            color: ${task.status === 'done' ? '#808080' : '#202020'};
            text-decoration: ${task.status === 'done' ? 'line-through' : 'none'};
            line-height: 1.4;
            margin-bottom: 2px;
        `;

        if (task.dueDate) {
            const dateInfo = getRelativeDateString(task.dueDate);
            const dueDateSpan = document.createElement('div');
            dueDateSpan.textContent = dateInfo.text;
            dueDateSpan.style.cssText = `
                font-size: 12px;
                color: ${dateInfo.isOverdue ? '#dc4c3e' : '#808080'};
                margin-top: 2px;
            `;
            content.appendChild(dueDateSpan);
        }

        content.appendChild(description);

        const tagsContainer = document.createElement('div');
        tagsContainer.style.cssText = `
            display: flex;
            gap: 4px;
            flex-wrap: wrap;
            margin-left: 12px;
        `;

        if (task.tags && task.tags.length > 0) {
            task.tags.forEach(tag => {
                const tagSpan = document.createElement('span');
                tagSpan.textContent = `#${tag}`;
                tagSpan.style.cssText = `
                    background: #f0f0f0;
                    color: #666;
                    padding: 2px 6px;
                    border-radius: 12px;
                    font-size: 11px;
                    font-weight: 500;
                `;
                tagsContainer.appendChild(tagSpan);
            });
        }

        taskDiv.addEventListener('click', (e) => {
            if (e.target !== checkbox) {
                this.openTaskEditModal(task);
            }
        });

        taskDiv.appendChild(checkbox);
        taskDiv.appendChild(priorityIndicator);
        taskDiv.appendChild(content);
        taskDiv.appendChild(tagsContainer);

        return taskDiv;
    }
    private openTaskEditModal(task: Task) {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        const modal = document.createElement('div');
        modal.style.cssText = `
            background: white;
            border-radius: 12px;
            padding: 24px;
            width: 90%;
            max-width: 500px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        `;

        const title = document.createElement('h3');
        title.textContent = 'Aufgabe bearbeiten';
        title.style.cssText = `
            margin: 0 0 20px 0;
            font-size: 18px;
            color: #202020;
        `;

        const descLabel = document.createElement('label');
        descLabel.textContent = 'Beschreibung:';
        descLabel.style.cssText = `
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
            color: #202020;
        `;

        const descInput = document.createElement('textarea');
        descInput.value = task.description;
        descInput.style.cssText = `
            width: 100%;
            padding: 12px;
            border: 1px solid #e0e6e8;
            border-radius: 6px;
            font-size: 14px;
            font-family: inherit;
            resize: vertical;
            min-height: 80px;
            margin-bottom: 16px;
        `;

        const priorityLabel = document.createElement('label');
        priorityLabel.textContent = 'Priorität:';
        priorityLabel.style.cssText = `
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
            color: #202020;
        `;

        const prioritySelect = document.createElement('select');
        prioritySelect.innerHTML = `
            <option value="">Keine Priorität</option>
            <option value="low">Niedrig</option>
            <option value="medium">Medium</option>
            <option value="high">Hoch</option>
            <option value="urgent">Dringend</option>
        `;
        prioritySelect.value = task.priority || '';
        prioritySelect.style.cssText = `
            width: 100%;
            padding: 12px;
            border: 1px solid #e0e6e8;
            border-radius: 6px;
            font-size: 14px;
            margin-bottom: 16px;
        `;

        const dueDateLabel = document.createElement('label');
        dueDateLabel.textContent = 'Fälligkeitsdatum:';
        dueDateLabel.style.cssText = `
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
            color: #202020;
        `;

        const dueDateInput = document.createElement('input');
        dueDateInput.type = 'date';
        if (task.dueDate) {
            dueDateInput.value = task.dueDate.toISOString().split('T')[0];
        }
        dueDateInput.style.cssText = `
            width: 100%;
            padding: 12px;
            border: 1px solid #e0e6e8;
            border-radius: 6px;
            font-size: 14px;
            margin-bottom: 16px;
        `;

        const tagsLabel = document.createElement('label');
        tagsLabel.textContent = 'Tags (kommagetrennt):';
        tagsLabel.style.cssText = `
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
            color: #202020;
        `;

        const tagsInput = document.createElement('input');
        tagsInput.type = 'text';
        tagsInput.value = task.tags?.join(', ') || '';
        tagsInput.style.cssText = `
            width: 100%;
            padding: 12px;
            border: 1px solid #e0e6e8;
            border-radius: 6px;
            font-size: 14px;
            margin-bottom: 20px;
        `;

        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            display: flex;
            gap: 12px;
            justify-content: flex-end;
        `;

        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Abbrechen';
        cancelBtn.style.cssText = `
            padding: 10px 20px;
            border: 1px solid #e0e6e8;
            border-radius: 6px;
            background: white;
            color: #202020;
            font-size: 14px;
            cursor: pointer;
        `;

        const saveBtn = document.createElement('button');
        saveBtn.textContent = 'Speichern';
        saveBtn.style.cssText = `
            padding: 10px 20px;
            border: none;
            border-radius: 6px;
            background: #dc4c3e;
            color: white;
            font-size: 14px;
            cursor: pointer;
        `;

        cancelBtn.addEventListener('click', () => {
            document.body.removeChild(overlay);
        });

        saveBtn.addEventListener('click', async () => {
            task.description = descInput.value.trim();
            task.priority = prioritySelect.value as any;
            task.dueDate = dueDateInput.value ? new Date(dueDateInput.value) : undefined;
            task.tags = tagsInput.value.split(',').map(tag => tag.trim()).filter(tag => tag);

            try {
                await this.taskService.updateTask(task);
                this.refreshCurrentView();
                document.body.removeChild(overlay);
            } catch (error) {
                console.error('Error updating task:', error);
            }
        });

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                document.body.removeChild(overlay);
            }
        });

        modal.appendChild(title);
        modal.appendChild(descLabel);
        modal.appendChild(descInput);
        modal.appendChild(priorityLabel);
        modal.appendChild(prioritySelect);
        modal.appendChild(dueDateLabel);
        modal.appendChild(dueDateInput);
        modal.appendChild(tagsLabel);
        modal.appendChild(tagsInput);

        buttonContainer.appendChild(cancelBtn);
        buttonContainer.appendChild(saveBtn);
        modal.appendChild(buttonContainer);

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        setTimeout(() => descInput.focus(), 100);
    }

    private createRefreshButton(queryString: string): HTMLElement {
        const refreshContainer = document.createElement('div');
        refreshContainer.style.cssText = `
            padding: 12px 20px;
            border-top: 1px solid #e0e6e8;
            background: #fafbfc;
        `;

        const refreshButton = document.createElement('button');
        refreshButton.innerHTML = '🔄 Aktualisieren';
        refreshButton.style.cssText = `
            padding: 8px 16px;
            font-size: 13px;
            border: 1px solid #e0e6e8;
            border-radius: 6px;
            background: white;
            color: #202020;
            cursor: pointer;
            transition: all 0.2s ease;
        `;

        refreshButton.addEventListener('mouseenter', () => {
            refreshButton.style.backgroundColor = '#f5f5f5';
        });

        refreshButton.addEventListener('mouseleave', () => {
            refreshButton.style.backgroundColor = 'white';
        });

        refreshButton.addEventListener('click', () => {
            refreshQuery(this, refreshButton.closest('.todoist-task-container') as HTMLElement, queryString);
        });

        refreshContainer.appendChild(refreshButton);
        return refreshContainer;
    }

    public async refreshCurrentView() {
        const container = document.querySelector('.todoist-task-container');
        if (!container) return;

        const content = container.querySelector('.task-content') as HTMLElement;
        const sidebar = container.querySelector('.task-sidebar');

        if (content) {
            this.renderTasks(content, this.currentTasks);
        }

        if (sidebar) {
            const tagsSection = sidebar.querySelector('.tags-section');
            if (tagsSection) {
                const newTagsSection = this.createTagsSection(this.currentTasks);
                tagsSection.parentNode?.replaceChild(newTagsSection, tagsSection);
            }
        }

        updateFilterButtons();
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
