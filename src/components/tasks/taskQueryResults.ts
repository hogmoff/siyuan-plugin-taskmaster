import { Task, TaskStatus } from './taskModels';
import { TaskService } from './taskService';
import { TaskModal } from './taskModal';

export class TaskQueryResults {
    private container: HTMLElement;
    private taskService: TaskService;
    private currentTasks: Task[] = [];

    constructor(taskService: TaskService) {
        this.taskService = taskService;
        this.container = this.createContainer();
    }

    private createContainer(): HTMLElement {
        const container = document.createElement('div');
        container.className = 'task-query-results';
        container.innerHTML = `
            <div class="task-query-header">
                <h3>Task Query Results</h3>
                <div class="task-query-controls">
                    <input type="text" class="task-query-input" placeholder="Enter query (e.g., status:todo priority:high)">
                    <button class="task-query-refresh">Refresh</button>
                    <button class="task-query-new">New Task</button>
                </div>
            </div>
            <div class="task-query-stats">
                <span class="task-count">0 tasks</span>
            </div>
            <div class="task-query-list"></div>
        `;

        this.attachEventListeners(container);
        return container;
    }

    private attachEventListeners(container: HTMLElement) {
        const queryInput = container.querySelector('.task-query-input') as HTMLInputElement;
        const refreshBtn = container.querySelector('.task-query-refresh') as HTMLButtonElement;
        const newTaskBtn = container.querySelector('.task-query-new') as HTMLButtonElement;

        queryInput.addEventListener('input', this.debounce(() => {
            this.executeQuery(queryInput.value);
        }, 300));

        refreshBtn.addEventListener('click', () => {
            this.refreshTasks();
        });

        newTaskBtn.addEventListener('click', () => {
            this.createNewTask();
        });
    }

    private debounce(func: Function, wait: number) {
        let timeout: NodeJS.Timeout;
        return (...args: any[]) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    async executeQuery(queryString: string) {
        try {
            await this.taskService.refreshTasks();
            
            if (queryString.trim()) {
                this.currentTasks = await this.taskService.getTasksByQueryString(queryString);
            } else {
                this.currentTasks = await this.taskService.getTasks();
            }

            this.renderTasks();
        } catch (error) {
            console.error('Error executing query:', error);
            this.showError('Error loading tasks');
        }
    }

    async refreshTasks() {
        const queryInput = this.container.querySelector('.task-query-input') as HTMLInputElement;
        await this.executeQuery(queryInput.value);
    }

    private renderTasks() {
        const taskList = this.container.querySelector('.task-query-list') as HTMLElement;
        const taskCount = this.container.querySelector('.task-count') as HTMLElement;

        taskCount.textContent = `${this.currentTasks.length} task${this.currentTasks.length !== 1 ? 's' : ''}`;

        if (this.currentTasks.length === 0) {
            taskList.innerHTML = '<div class="no-tasks">No tasks found</div>';
            return;
        }

        taskList.innerHTML = '';
        
        this.currentTasks.forEach(task => {
            const taskElement = this.createTaskElement(task);
            taskList.appendChild(taskElement);
        });
    }

    private createTaskElement(task: Task): HTMLElement {
        const element = document.createElement('div');
        element.className = `task-item task-status-${task.status}`;
        
        const priorityClass = task.priority ? `priority-${task.priority}` : '';
        const overdue = task.dueDate && task.dueDate < new Date() && task.status !== TaskStatus.DONE;
        
        element.innerHTML = `
            <div class="task-checkbox">
                <input type="checkbox" ${task.status === TaskStatus.DONE ? 'checked' : ''}>
            </div>
            <div class="task-content ${priorityClass} ${overdue ? 'overdue' : ''}">
                <div class="task-description">${this.escapeHtml(task.description)}</div>
                <div class="task-meta">
                    ${this.renderTaskMeta(task)}
                </div>
            </div>
            <div class="task-actions">
                <button class="task-edit" title="Edit">✏️</button>
                <button class="task-delete" title="Delete">🗑️</button>
            </div>
        `;

        this.attachTaskEventListeners(element, task);
        return element;
    }

    private renderTaskMeta(task: Task): string {
        const parts: string[] = [];

        if (task.priority) {
            parts.push(`<span class="priority-badge priority-${task.priority}">${task.priority}</span>`);
        }

        if (task.dueDate) {
            const formatted = new Date(task.dueDate).toLocaleDateString();
            const overdue = task.dueDate < new Date() && task.status !== TaskStatus.DONE;
            parts.push(`<span class="due-date ${overdue ? 'overdue' : ''}">📅 ${formatted}</span>`);
        }

        if (task.startDate) {
            parts.push(`<span class="start-date">🛫 ${new Date(task.startDate).toLocaleDateString()}</span>`);
        }

        if (task.scheduledDate) {
            parts.push(`<span class="scheduled-date">⏳ ${new Date(task.scheduledDate).toLocaleDateString()}</span>`);
        }

        if (task.tags.length > 0) {
            parts.push(`<span class="tags">${task.tags.map(tag => `#${tag}`).join(' ')}</span>`);
        }

        if (task.recurrence) {
            parts.push(`<span class="recurrence">🔁 ${task.recurrence.rule}</span>`);
        }

        return parts.join(' ');
    }

    private attachTaskEventListeners(element: HTMLElement, task: Task) {
        const checkbox = element.querySelector('input[type="checkbox"]') as HTMLInputElement;
        const editBtn = element.querySelector('.task-edit') as HTMLButtonElement;
        const deleteBtn = element.querySelector('.task-delete') as HTMLButtonElement;

        checkbox.addEventListener('change', async () => {
            const newStatus = checkbox.checked ? TaskStatus.DONE : TaskStatus.TODO;
            const updatedTask: Task = { ...task, status: newStatus };
            
            if (newStatus === TaskStatus.DONE && !task.doneDate) {
                updatedTask.doneDate = new Date();
            } else if (newStatus !== TaskStatus.DONE) {
                updatedTask.doneDate = undefined;
            }

            await this.taskService.updateTask(updatedTask);
            await this.refreshTasks();
        });

        editBtn.addEventListener('click', () => {
            this.editTask(task);
        });

        deleteBtn.addEventListener('click', async () => {
            if (confirm('Are you sure you want to delete this task?')) {
                await this.taskService.deleteTask(task.id);
                await this.refreshTasks();
            }
        });
    }

    private editTask(task: Task) {
        const modal = new TaskModal({
            task,
            onSave: async (updatedTask: Task) => {
                await this.taskService.updateTask(updatedTask);
                await this.refreshTasks();
            }
        });
        modal.open();
    }

    private createNewTask() {
        const modal = new TaskModal({
            onSave: async (newTask: Task) => {
                await this.taskService.createTask(newTask);
                await this.refreshTasks();
            }
        });
        modal.open();
    }

    private showError(message: string) {
        const taskList = this.container.querySelector('.task-query-list') as HTMLElement;
        taskList.innerHTML = `<div class="error-message">${this.escapeHtml(message)}</div>`;
    }

    private escapeHtml(text: string): string {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    getContainer(): HTMLElement {
        return this.container;
    }

    async initialize() {
        await this.executeQuery('');
    }
}