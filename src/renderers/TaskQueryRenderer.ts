import { createSidebar, createTagsSection, createTagItem } from './sidebar/sidebar';
import { Task, TaskGroup } from '../types/task';
import { formatDateGroup, isToday, isWithinDays, getRelativeDateString } from '../utils/dateUtils';

/**
 * Renderer für Task-Queries mit Todoist-ähnlicher Darstellung
 */
export class TaskQueryRenderer {
    private taskService: any;
    private taskQueryEngine: any;
    private currentFilter: 'today' | 'next7days' | 'all' | 'date' = 'today';
    private selectedDate: Date | null = null;
    private selectedTag: string | null = null;
    private sidebarCollapsed: boolean = false;
    private currentTasks: Task[] = [];
    private currentQueryString: string = '';

    constructor(taskService: any) {
        this.taskService = taskService;
        this.taskQueryEngine = null;
    }

    /**
     * Initialisiert den Renderer und lädt die TaskQueryEngine
     */
    async initialize() {
        try {
            const module = await import('../components/tasks/taskQuery');
            this.taskQueryEngine = module.TaskQueryEngine;
        } catch (error) {
            console.warn('TaskQueryEngine not available:', error);
        }
    }

    /**
     * Verarbeitet alle Task-Queries in einem HTML-Element
     * @param element - Das zu verarbeitende HTML-Element
     */
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

    /**
     * Verarbeitet einen einzelnen Task-Query
     * @param block - Der Code-Block mit dem Query
     * @param content - Der Inhalt des Queries
     */
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

    /**
     * Erstellt den Haupt-Container für die Todoist-ähnliche Darstellung
     * @param tasks - Die anzuzeigenden Tasks
     * @param queryString - Der ursprüngliche Query-String
     * @returns Der erstellte Container
     */
    private createTodoistLikeContainer(tasks: Task[], queryString: string): HTMLElement {
        this.currentTasks = tasks;
        this.currentQueryString = queryString;

        // Inject sidebar styles
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

        // Sidebar
        const sidebar = this.createSidebar(tasks);
        container.appendChild(sidebar);

        // Main content area
        const mainContent = document.createElement('div');
        mainContent.className = 'main-content';
        mainContent.style.cssText = `
            flex: 1;
            display: flex;
            flex-direction: column;
            transition: margin-left 0.3s ease;
            margin-left: ${this.sidebarCollapsed ? '0' : '200px'};
        `;

        // Header mit Filtern
        const header = this.createHeader(tasks.length);
        mainContent.appendChild(header);

        // Filter Bar
        const filterBar = this.createFilterBar();
        mainContent.appendChild(filterBar);

        // Task Content
        const content = document.createElement('div');
        content.className = 'task-content';
        content.style.cssText = `
            padding: 0;
            min-height: 200px;
        `;

        this.renderTasks(content, tasks);
        mainContent.appendChild(content);

        // Refresh Button
        const refreshButton = this.createRefreshButton(queryString);
        mainContent.appendChild(refreshButton);

        container.appendChild(mainContent);
        return container;
    }

    // Removed placeholder methods and added direct assignment for createSidebar
    private createSidebar = createSidebar;
    private createTagsSection = createTagsSection;
    private createTagItem = createTagItem;


    /**
     * Erstellt den Header-Bereich mit Titel und Task-Anzahl
     * @param taskCount - Die Anzahl der Tasks
     * @returns Der erstellte Header
     */
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

        // Aktueller Filter anzeigen
        if (this.selectedTag !== null) {
            const filterInfo = document.createElement('div');
            filterInfo.style.cssText = `
                font-size: 12px;
                color: #666;
                margin-top: 2px;
            `;

            if (this.selectedTag === '') {
                filterInfo.textContent = 'Projekt: Ohne Projekt';
            } else {
                filterInfo.textContent = `Projekt: #${this.selectedTag}`;
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

        return header;
    }

    /**
     * Erstellt die Filter-Leiste
     * @returns Die erstellte Filter-Leiste
     */
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
        const todayButton = this.createFilterButton('Heute', 'today');
        const next7DaysButton = this.createFilterButton('Nächste 7 Tage', 'next7days');
        const allButton = this.createFilterButton('Alle', 'all');

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
                this.refreshCurrentView();
            }
        });

        filterBar.appendChild(todayButton);
        filterBar.appendChild(next7DaysButton);
        filterBar.appendChild(allButton);
        filterBar.appendChild(datePicker);

        return filterBar;
    }

    /**
     * Erstellt einen Filter-Button
     * @param text - Die Beschriftung des Buttons
     * @param filter - Der Filter-Typ
     * @returns Der erstellte Button
     */
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

    /**
     * Aktualisiert die Filter-Buttons
     */
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
    /**
     * Rendert die Tasks im Container
     * @param container - Der Container für die Tasks
     * @param tasks - Die zu rendernden Tasks
     */
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

    /**
     * Wendet die aktuellen Filter auf die Tasks an
     * @param tasks - Die zu filternden Tasks
     * @returns Die gefilterten Tasks
     */
    private applyCurrentFilter(tasks: Task[]): Task[] {
        let filteredTasks = tasks;

        // Zuerst nach Tag filtern
        if (this.selectedTag !== null) {
            if (this.selectedTag === '') {
                // Ohne Projekt (keine Tags)
                filteredTasks = filteredTasks.filter(task => !task.tags || task.tags.length === 0);
            } else {
                // Spezifischer Tag
                filteredTasks = filteredTasks.filter(task => task.tags && task.tags.includes(this.selectedTag!));
            }
        }

        // Dann nach Datum filtern
        switch (this.currentFilter) {
            case 'today':
                return filteredTasks.filter(task =>
                    task.dueDate && isToday(task.dueDate)
                );
            case 'next7days':
                return filteredTasks.filter(task =>
                    task.dueDate && isWithinDays(task.dueDate, 7)
                );
            case 'date':
                if (!this.selectedDate) return filteredTasks;
                return filteredTasks.filter(task =>
                    task.dueDate &&
                    task.dueDate.toDateString() === this.selectedDate!.toDateString()
                );
            case 'all':
            default:
                return filteredTasks;
        }
    }

    /**
     * Sortiert die Tasks nach verschiedenen Kriterien
     * @param tasks - Die zu sortierenden Tasks
     * @returns Die sortierten Tasks
     */
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

    /**
     * Gruppiert Tasks nach Datum
     * @param tasks - Die zu gruppierenden Tasks
     * @returns Die gruppierten Tasks
     */
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

    /**
     * Erstellt ein einzelnes Task-Item
     * @param task - Der zu erstellende Task
     * @returns Das erstellte Task-Element
     */
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
            const description = taskDiv.querySelector('.task-description') as HTMLElement;
            if (description) {
                description.style.textDecoration = task.status === 'done' ? 'line-through' : 'none';
                description.style.color = task.status === 'done' ? '#808080' : '#202020';
            }
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
        description.className = 'task-description';
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
    /**
     * Öffnet ein Modal zum Bearbeiten eines Tasks
     * @param task - Der zu bearbeitende Task
     */
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

    /**
     * Erstellt den Refresh-Button
     * @param queryString - Der Query-String für das Refresh
     * @returns Der Refresh-Button Container
     */
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

    /**
     * Aktualisiert einen Task-Query
     * @param container - Der Container mit dem Query
     * @param queryString - Der Query-String
     */
    private async refreshQuery(container: HTMLElement, queryString: string) {
        try {
            container.style.opacity = '0.5';

            // Inject sidebar styles when refreshing query to ensure styles are available
            this.injectSidebarStyles();

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

    /**
     * Aktualisiert die aktuelle Ansicht
     */
    private async refreshCurrentView() {
        const container = document.querySelector('.todoist-task-container');
        if (!container) return;

        const content = container.querySelector('.task-content') as HTMLElement;
        const sidebar = container.querySelector('.task-sidebar');

        if (content) {
            this.renderTasks(content, this.currentTasks);
        }

        // Sidebar neu rendern um die aktualisierten Counts und Auswahl anzuzeigen
        if (sidebar) {
            const tagsSection = sidebar.querySelector('.tags-section');
            if (tagsSection) {
                const newTagsSection = this.createTagsSection(this.currentTasks);
                tagsSection.parentNode?.replaceChild(newTagsSection, tagsSection);
            }
        }

        // Filter buttons aktualisieren
        this.updateFilterButtons();
    }

    /**
     * Zeigt eine Fehlermeldung an
     * @param block - Der Block, in dem der Fehler angezeigt werden soll
     * @param message - Die Fehlermeldung
     */
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

    /**
     * Escaped HTML-Zeichen
     * @param text - Der zu escapende Text
     * @returns Der escapte Text
     */
    private escapeHtml(text: string): string {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Injiziert CSS-Styles für bessere Responsive-Unterstützung
     */
    private injectSidebarStyles() {
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

            /* Smooth transitions */
            .task-sidebar, .main-content, .collapsed-toggle {
                transition: all 0.3s ease !important;
            }
        `;

        document.head.appendChild(style);
    }
}