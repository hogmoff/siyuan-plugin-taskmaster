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
    if (diffDays === 2) return { text: "übermorgen", isOverdue: false };
    if (diffDays === -1) return { text: "gestern", isOverdue: true };
    if (diffDays > 2) return { text: `in ${diffDays} Tagen`, isOverdue: false };
    return { text: `vor ${Math.abs(diffDays)} Tagen`, isOverdue: true };
}

export function formatDateGroup(date: Date): string {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Heute";
    if (diffDays === 1) return "Morgen";
    if (diffDays === 2) return "Übermorgen";
    if (diffDays === -1) return "Gestern";
    
    const weekdays = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
    const months = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
    
    if (Math.abs(diffDays) <= 7) {
        return `${weekdays[targetDate.getDay()]}, ${targetDate.getDate()}. ${months[targetDate.getMonth()]}`;
    }
    
    return `${targetDate.getDate()}. ${months[targetDate.getMonth()]} ${targetDate.getFullYear()}`;
}

export function isWithinDays(date: Date, days: number): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays >= 0 && diffDays <= days;
}

export function isToday(date: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    return targetDate.getTime() === today.getTime();
}

interface Task {
    id: string;
    description: string;
    status: 'todo' | 'done';
    priority?: 'urgent' | 'high' | 'medium' | 'low';
    dueDate?: Date;
    createdDate?: Date;
    tags?: string[];
    blockId?: string;
}

interface TaskGroup {
    date: Date;
    label: string;
    tasks: Task[];
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
                        priorityIcon.textContent = '🔴';
                        break;
                    case 'medium':
                        priorityIcon.textContent = '🟡';
                        break;
                    case 'low':
                        priorityIcon.textContent = '🔵';
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
    private currentFilter: 'today' | 'next7days' | 'all' | 'date' = 'today';
    private selectedDate: Date | null = null;

    constructor(taskService: any) {
        this.taskService = taskService;
        this.taskQueryEngine = null;
    }

    async initialize() {
        try {
            const module = await import('./components/tasks/taskQuery');
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
                this.processTaskQuery(block, trimmedContent);
            }
        });
    }

    private async processTaskQuery(block: HTMLElement, content: string) {
        try {
            const queryMatch = content.match(/tasks\s*\n?([\s\S]*)/);            
            if (!queryMatch) return;

            const queryString = queryMatch[1].trim();
            
            const allTasks = await this.taskService.getAllTasks();
            const filteredTasks = queryString ? 
                this.taskQueryEngine.filterTasks(allTasks, this.taskQueryEngine.parseQueryString(queryString)) : 
                allTasks;

            const resultContainer = this.createTodoistLikeContainer(filteredTasks, queryString);
            block.parentNode?.replaceChild(resultContainer, block);

        } catch (error) {
            console.error('Error processing task query:', error);
            this.showError(block, error.message);
        }
    }

    private createTodoistLikeContainer(tasks: Task[], queryString: string): HTMLElement {
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
        `;

        // Header mit Filtern
        const header = this.createHeader(tasks.length);
        container.appendChild(header);

        // Filter Bar
        const filterBar = this.createFilterBar();
        container.appendChild(filterBar);

        // Task Content
        const content = document.createElement('div');
        content.className = 'task-content';
        content.style.cssText = `
            padding: 0;
            min-height: 200px;
        `;

        this.renderTasks(content, tasks);
        container.appendChild(content);

        // Refresh Button
        const refreshButton = this.createRefreshButton(queryString);
        container.appendChild(refreshButton);

        return container;
    }

    private createHeader(taskCount: number): HTMLElement {
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

        const count = document.createElement('span');
        count.textContent = `${taskCount} Aufgabe${taskCount !== 1 ? 'n' : ''}`;
        count.style.cssText = `
            font-size: 14px;
            color: #808080;
            font-weight: normal;
        `;

        header.appendChild(title);
        header.appendChild(count);

        return header;
    }

    private createFilterBar(): HTMLElement {
        const filterBar = document.createElement('div');
        filterBar.style.cssText = `
            padding: 12px 20px;
            background: #fafbfc;
            border-bottom: 1px solid #e0e6e8;
            display: flex;
            gap: 8px;
            align-items: center;
            flex-wrap: wrap;
        `;

        // Filter Buttons
        const todayBtn = this.createFilterButton('Heute', 'today');
        const next7Btn = this.createFilterButton('Nächste 7 Tage', 'next7days');
        const allBtn = this.createFilterButton('Alle', 'all');

        // Date Picker
        const datePicker = document.createElement('input');
        datePicker.type = 'date';
        datePicker.style.cssText = `
            padding: 6px 12px;
            border: 1px solid #e0e6e8;
            border-radius: 6px;
            font-size: 13px;
            background: white;
            cursor: pointer;
        `;

        datePicker.addEventListener('change', (e) => {
            const target = e.target as HTMLInputElement;
            if (target.value) {
                this.selectedDate = new Date(target.value);
                this.currentFilter = 'date';
                this.updateFilterButtons();
                this.refreshCurrentView();
            }
        });

        filterBar.appendChild(todayBtn);
        filterBar.appendChild(next7Btn);
        filterBar.appendChild(allBtn);
        filterBar.appendChild(datePicker);

        return filterBar;
    }

    private createFilterButton(text: string, filter: 'today' | 'next7days' | 'all'): HTMLElement {
        const button = document.createElement('button');
        button.textContent = text;
        button.dataset.filter = filter;
        
        const isActive = this.currentFilter === filter;
        button.style.cssText = `
            padding: 6px 12px;
            border: 1px solid ${isActive ? '#dc4c3e' : '#e0e6e8'};
            border-radius: 6px;
            background: ${isActive ? '#dc4c3e' : 'white'};
            color: ${isActive ? 'white' : '#202020'};
            font-size: 13px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
        `;

        button.addEventListener('click', () => {
            this.currentFilter = filter;
            this.selectedDate = null;
            this.updateFilterButtons();
            this.refreshCurrentView();
        });

        button.addEventListener('mouseenter', () => {
            if (!isActive) {
                button.style.backgroundColor = '#f5f5f5';
                button.style.borderColor = '#d0d0d0';
            }
        });

        button.addEventListener('mouseleave', () => {
            if (!isActive) {
                button.style.backgroundColor = 'white';
                button.style.borderColor = '#e0e6e8';
            }
        });

        return button;
    }

    private updateFilterButtons() {
        const container = document.querySelector('.todoist-task-container');
        if (!container) return;

        const buttons = container.querySelectorAll('[data-filter]') as NodeListOf<HTMLElement>;
        buttons.forEach(btn => {
            const isActive = btn.dataset.filter === this.currentFilter;
            btn.style.background = isActive ? '#dc4c3e' : 'white';
            btn.style.color = isActive ? 'white' : '#202020';
            btn.style.borderColor = isActive ? '#dc4c3e' : '#e0e6e8';
        });
    }

    private renderTasks(container: HTMLElement, tasks: Task[]) {
        container.innerHTML = '';

        let filteredTasks = this.applyCurrentFilter(tasks);
        const sortedTasks = this.sortTasks(filteredTasks);
        const groupedTasks = this.groupTasksByDate(sortedTasks);

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

    private applyCurrentFilter(tasks: Task[]): Task[] {
        switch (this.currentFilter) {
            case 'today':
                return tasks.filter(task => 
                    task.dueDate && isToday(task.dueDate)
                );
            case 'next7days':
                return tasks.filter(task => 
                    task.dueDate && isWithinDays(task.dueDate, 7)
                );
            case 'date':
                if (!this.selectedDate) return tasks;
                return tasks.filter(task => 
                    task.dueDate && 
                    task.dueDate.toDateString() === this.selectedDate!.toDateString()
                );
            case 'all':
            default:
                return tasks;
        }
    }

    private sortTasks(tasks: Task[]): Task[] {
        return tasks.sort((a, b) => {
            // First by due date (null dates go to end)
            if (a.dueDate && b.dueDate) {
                const dateDiff = a.dueDate.getTime() - b.dueDate.getTime();
                if (dateDiff !== 0) return dateDiff;
            } else if (a.dueDate && !b.dueDate) {
                return -1;
            } else if (!a.dueDate && b.dueDate) {
                return 1;
            }

            // Then by priority
            const priorities = { urgent: 4, high: 3, medium: 2, low: 1 };
            const aPriority = priorities[a.priority || 'low'] || 1;
            const bPriority = priorities[b.priority || 'low'] || 1;
            if (aPriority !== bPriority) {
                return bPriority - aPriority;
            }

            // Finally by created date
            if (a.createdDate && b.createdDate) {
                return a.createdDate.getTime() - b.createdDate.getTime();
            }

            return 0;
        });
    }

    private groupTasksByDate(tasks: Task[]): TaskGroup[] {
        const groups = new Map<string, TaskGroup>();

        tasks.forEach(task => {
            let groupKey: string;
            let groupLabel: string;
            let groupDate: Date;

            if (task.dueDate) {
                groupKey = task.dueDate.toDateString();
                groupLabel = formatDateGroup(task.dueDate);
                groupDate = task.dueDate;
            } else {
                groupKey = 'no-date';
                groupLabel = 'Kein Datum';
                groupDate = new Date(9999, 11, 31); // Far future for sorting
            }

            if (!groups.has(groupKey)) {
                groups.set(groupKey, {
                    date: groupDate,
                    label: groupLabel,
                    tasks: []
                });
            }

            groups.get(groupKey)!.tasks.push(task);
        });

        // Sort groups by date
        return Array.from(groups.values()).sort((a, b) => 
            a.date.getTime() - b.date.getTime()
        );
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

        // Hover effect
        taskDiv.addEventListener('mouseenter', () => {
            taskDiv.style.backgroundColor = '#fafbfc';
        });
        taskDiv.addEventListener('mouseleave', () => {
            taskDiv.style.backgroundColor = 'transparent';
        });

        // Checkbox
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
            
            // Update visual state
            description.style.textDecoration = task.status === 'done' ? 'line-through' : 'none';
            description.style.color = task.status === 'done' ? '#808080' : '#202020';
        });

        // Priority indicator
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

        // Task content (left side)
        const content = document.createElement('div');
        content.style.cssText = `
            flex: 1;
            display: flex;
            flex-direction: column;
            min-width: 0;
        `;

        const description = document.createElement('div');
        description.textContent = task.description;
        description.style.cssText = `
            font-size: 14px;
            color: ${task.status === 'done' ? '#808080' : '#202020'};
            text-decoration: ${task.status === 'done' ? 'line-through' : 'none'};
            line-height: 1.4;
            margin-bottom: 2px;
        `;

        // Due date info (if available)
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

        // Tags (right side)
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

        // Click to edit
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

        // Description input
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

        // Priority select
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

        // Due date input
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

        // Tags input
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

        // Buttons
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

        // Event listeners
        cancelBtn.addEventListener('click', () => {
            document.body.removeChild(overlay);
        });

        saveBtn.addEventListener('click', async () => {
            // Update task
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
                // Could show error message here
            }
        });

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                document.body.removeChild(overlay);
            }
        });

        // Assemble modal
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

        // Focus on description input
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
            this.refreshQuery(refreshButton.closest('.todoist-task-container') as HTMLElement, queryString);
        });

        refreshContainer.appendChild(refreshButton);
        return refreshContainer;
    }

    private async refreshQuery(container: HTMLElement, queryString: string) {
        try {
            container.style.opacity = '0.5';
            
            const allTasks = await this.taskService.getAllTasks();
            const filteredTasks = queryString ? 
                this.taskQueryEngine.filterTasks(allTasks, this.taskQueryEngine.parseQueryString(queryString)) : 
                allTasks;

            const newContainer = this.createTodoistLikeContainer(filteredTasks, queryString);
            container.parentNode?.replaceChild(newContainer, container);
            
        } catch (error) {
            console.error('Error refreshing task query:', error);
        }
    }

    private async refreshCurrentView() {
        const container = document.querySelector('.todoist-task-container');
        if (!container) return;

        try {
            const allTasks = await this.taskService.getAllTasks();
            const content = container.querySelector('.task-content') as HTMLElement;
            if (content) {
                this.renderTasks(content, allTasks);
            }

            // Update task count in header
            const countSpan = container.querySelector('span') as HTMLElement;
            if (countSpan) {
                const filteredTasks = this.applyCurrentFilter(allTasks);
                countSpan.textContent = `${filteredTasks.length} Aufgabe${filteredTasks.length !== 1 ? 'n' : ''}`;
            }
        } catch (error) {
            console.error('Error refreshing current view:', error);
        }
    }

    private showError(block: HTMLElement, message: string) {
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
}