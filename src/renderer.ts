export function parseSiyuanDate(siyuanDate: string): Date | null {
    if (!siyuanDate || siyuanDate.length < 14) return null;
    
    const year = parseInt(siyuanDate.substring(0, 4));
    const month = parseInt(siyuanDate.substring(4, 6)) - 1;
    const day = parseInt(siyuanDate.substring(6, 8));
    const hour = parseInt(siyuanDate.substring(8, 10));
    const minute = parseInt(siyuanDate.substring(10, 12));
    const second = parseInt(siyuanDate.substring(12, 14));
    
    const date = new Date(year, month, day, hour, minute, second);
    return isNaN(date.getTime()) ? null : date;
}

export function getRelativeDateString(date: Date): { text: string; isOverdue: boolean } {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return { text: "heute", isOverdue: false };
    if (diffDays === 1) return { text: "morgen", isOverdue: false };
    if (diffDays === -1) return { text: "gestern", isOverdue: true };
    if (diffDays > 1) return { text: `in ${diffDays} Tagen`, isOverdue: false };
    return { text: `vor ${Math.abs(diffDays)} Tagen`, isOverdue: true };
}

export class TaskRenderer {
    public process(element: HTMLElement) {
        const taskItems = element.querySelectorAll('div[data-type="NodeListItem"][data-subtype="t"]') as NodeListOf<HTMLElement>;
        
        taskItems.forEach((taskNode: HTMLElement) => {
            taskNode.querySelectorAll('.task-master-priority, .task-master-duedate').forEach(el => el.remove());
            
            const priority = taskNode.getAttribute('custom-task-priority');
            const dueDateStr = taskNode.getAttribute('custom-handle-time');
            
            if (priority) {
                const priorityIcon = document.createElement('span');
                priorityIcon.className = 'task-master-priority';
                priorityIcon.style.marginRight = '4px';
                
                switch (priority) {
                    case 'urgent':
                        priorityIcon.textContent = '🚨';
                        break;
                    case 'high':
                        priorityIcon.textContent = '📈';
                        break;
                    case 'medium':
                        priorityIcon.textContent = '📊';
                        break;
                    case 'low':
                        priorityIcon.textContent = '📉';
                        break;
                }
                taskNode.insertBefore(priorityIcon, taskNode.firstChild);
            }
            
            if (dueDateStr) {
                const dueDate = parseSiyuanDate(dueDateStr);
                if (dueDate) {
                    const dateInfo = getRelativeDateString(dueDate);
                    const dateSpan = document.createElement('span');
                    dateSpan.className = 'task-master-duedate';
                    dateSpan.style.cssText = `
                        margin-left: 8px;
                        font-size: 12px;
                        color: ${dateInfo.isOverdue ? '#e74c3c' : '#3498db'};
                    `;
                    dateSpan.textContent = dateInfo.text;
                    taskNode.appendChild(dateSpan);
                }
            }
        });
    }
}

export class TaskQueryRenderer {
    private taskService: any;
    private taskQueryEngine: any;

    constructor(taskService: any) {
        this.taskService = taskService;
        this.taskQueryEngine = null;
    }

    async initialize() {
        // Dynamisch import TaskQueryEngine wenn verfügbar
        try {
            const module = await import('./taskQuery');
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

            // Check if it is a Tasks-Query block
            if (trimmedContent.startsWith('tasks')) {
                this.processTaskQuery(block, trimmedContent);
            }
        });
    }

    private async processTaskQuery(block: HTMLElement, content: string) {
        try {
            // Extrahiere die Query aus dem Block
            const queryMatch = content.match(/tasks\s*\n?([\s\S]*)/);            
            if (!queryMatch) return;

            const queryString = queryMatch[1].trim();
            if (!queryString) return;

            // Parse die Query
            const query = this.taskQueryEngine.parseQueryString(queryString);
            
            // Hole alle Tasks
            const allTasks = await this.taskService.getAllTasks();
            
            // Filter die Tasks basierend auf der Query
            const filteredTasks = this.taskQueryEngine.filterTasks(allTasks, query);

            // Erstelle das Ergebnis-Element
            const resultContainer = this.createQueryResultContainer(filteredTasks, queryString);
            
            // Ersetze den Code-Block mit dem Ergebnis
            block.parentNode?.replaceChild(resultContainer, block);

        } catch (error) {
            console.error('Error processing task query:', error);
            this.showError(block, error.message);
        }
    }

    private createQueryResultContainer(tasks: any[], queryString: string): HTMLElement {
        const container = document.createElement('div');
        container.className = 'task-query-result';
        container.style.cssText = `
            border: 1px solid #e1e5e9;
            border-radius: 6px;
            padding: 16px;
            margin: 8px 0;
            background: #f8f9fa;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;

        // Header mit Query-Info
        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 1px solid #e1e5e9;
        `;

        const queryInfo = document.createElement('div');
        queryInfo.innerHTML = `<strong>Task Query:</strong> <code>${this.escapeHtml(queryString)}</code>`;
        queryInfo.style.fontSize = '14px';

        const countInfo = document.createElement('div');
        countInfo.textContent = `${tasks.length} task${tasks.length !== 1 ? 's' : ''} found`;
        countInfo.style.fontSize = '12px';
        countInfo.style.color = '#666';

        header.appendChild(queryInfo);
        header.appendChild(countInfo);
        container.appendChild(header);

        // Tasks-Liste
        if (tasks.length === 0) {
            const noTasks = document.createElement('div');
            noTasks.textContent = 'No tasks found matching the query.';
            noTasks.style.cssText = 'text-align: center; color: #666; font-style: italic; padding: 20px;';
            container.appendChild(noTasks);
        } else {
            const taskList = document.createElement('div');
            taskList.className = 'task-list';
            
            tasks.forEach(task => {
                const taskElement = this.createTaskItem(task);
                taskList.appendChild(taskElement);
            });
            
            container.appendChild(taskList);
        }

        // Refresh-Button hinzufügen
        const refreshButton = document.createElement('button');
        refreshButton.textContent = '🔄 Refresh';
        refreshButton.style.cssText = `
            margin-top: 8px;
            padding: 4px 8px;
            font-size: 12px;
            border: 1px solid #d1d5db;
            border-radius: 4px;
            background: white;
            cursor: pointer;
        `;
        refreshButton.addEventListener('click', () => {
            this.refreshQuery(container, queryString);
        });
        container.appendChild(refreshButton);

        return container;
    }

    private createTaskItem(task: any): HTMLElement {
        const taskDiv = document.createElement('div');
        taskDiv.style.cssText = `
            display: flex;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid #f0f0f0;
            font-size: 14px;
        `;

        // Checkbox
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = task.status === 'done';
        checkbox.style.marginRight = '8px';
        checkbox.addEventListener('change', async (e) => {
            e.stopPropagation();
            task.status = checkbox.checked ? 'done' : 'todo';
            await this.taskService.updateTask(task);
        });

        // Task-Content
        const content = document.createElement('div');
        content.style.flex = '1';
        
        const description = document.createElement('span');
        description.textContent = task.description;
        if (task.status === 'done') {
            description.style.textDecoration = 'line-through';
            description.style.color = '#666';
        }

        const meta = document.createElement('div');
        meta.style.cssText = 'font-size: 12px; color: #666; margin-top: 2px;';
        
        const metaParts = [];
        if (task.priority) metaParts.push(`Priority: ${task.priority}`);
        if (task.dueDate) metaParts.push(`Due: ${new Date(task.dueDate).toLocaleDateString()}`);
        if (task.tags?.length) metaParts.push(`Tags: ${task.tags.join(', ')}`);
        
        meta.textContent = metaParts.join(' • ');

        content.appendChild(description);
        content.appendChild(meta);

        taskDiv.appendChild(checkbox);
        taskDiv.appendChild(content);

        return taskDiv;
    }

    private async refreshQuery(container: HTMLElement, queryString: string) {
        try {
            container.style.opacity = '0.5';
            
            const query = this.taskQueryEngine.parseQueryString(queryString);
            const allTasks = await this.taskService.getAllTasks();
            const filteredTasks = this.taskQueryEngine.filterTasks(allTasks, query);

            const newContainer = this.createQueryResultContainer(filteredTasks, queryString);
            container.parentNode?.replaceChild(newContainer, container);
            
        } catch (error) {
            console.error('Error refreshing task query:', error);
        }
    }

    private showError(block: HTMLElement, message: string) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'task-query-error';
        errorDiv.style.cssText = `
            border: 1px solid #ff6b6b;
            border-radius: 6px;
            padding: 16px;
            margin: 8px 0;
            background: #ffe0e0;
            color: #d63031;
            font-family: monospace;
        `;
        errorDiv.innerHTML = `<strong>Task Query Error:</strong><br>${this.escapeHtml(message)}`;
        
        block.parentNode?.replaceChild(errorDiv, block);
    }

    private escapeHtml(text: string): string {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}