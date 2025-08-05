import { Task, TaskStatus, TaskPriority } from './taskModels';

interface TaskModalOptions {
    task?: Task;
    onSave?: (task: Task) => void;
    onCancel?: () => void;
}

export class TaskModal {
    private modal: HTMLElement;
    private options: TaskModalOptions;

    constructor(options: TaskModalOptions = {}) {
        this.options = options;
        this.createModal();
    }

    private createModal() {
        this.modal = document.createElement('div');
        this.modal.className = 'task-modal-overlay';
        this.modal.innerHTML = `
            <div class="task-modal">
                <div class="task-modal-header">
                    <h3>${this.options.task ? 'Edit Task' : 'Create New Task'}</h3>
                    <button class="task-modal-close">&times;</button>
                </div>
                <div class="task-modal-body">
                    <div class="form-group">
                        <label>Description</label>
                        <textarea id="task-description" rows="3" placeholder="Enter task description...">${this.options.task?.description || ''}</textarea>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label>Status</label>
                            <select id="task-status">
                                <option value="todo" ${this.options.task?.status === 'todo' ? 'selected' : ''}>To Do</option>
                                <option value="in_progress" ${this.options.task?.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
                                <option value="done" ${this.options.task?.status === 'done' ? 'selected' : ''}>Done</option>
                                <option value="cancelled" ${this.options.task?.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label>Priority</label>
                            <select id="task-priority">
                                <option value="">None</option>
                                <option value="low" ${this.options.task?.priority === 'low' ? 'selected' : ''}>Low</option>
                                <option value="medium" ${this.options.task?.priority === 'medium' ? 'selected' : ''}>Medium</option>
                                <option value="high" ${this.options.task?.priority === 'high' ? 'selected' : ''}>High</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label>Due Date</label>
                            <input type="date" id="task-due-date" value="${this.options.task?.dueDate ? this.formatDate(this.options.task.dueDate) : ''}">
                        </div>
                        
                        <div class="form-group">
                            <label>Start Date</label>
                            <input type="date" id="task-start-date" value="${this.options.task?.startDate ? this.formatDate(this.options.task.startDate) : ''}">
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label>Scheduled Date</label>
                            <input type="date" id="task-scheduled-date" value="${this.options.task?.scheduledDate ? this.formatDate(this.options.task.scheduledDate) : ''}">
                        </div>
                        
                        <div class="form-group">
                            <label>Done Date</label>
                            <input type="date" id="task-done-date" value="${this.options.task?.doneDate ? this.formatDate(this.options.task.doneDate) : ''}">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>Tags</label>
                        <input type="text" id="task-tags" placeholder="Enter tags separated by commas" value="${this.options.task?.tags.join(', ') || ''}">
                    </div>
                    
                    <div class="form-group">
                        <label>Recurrence</label>
                        <input type="text" id="task-recurrence" placeholder="e.g., every week, every 2 days" value="${this.options.task?.recurrence?.rule || ''}">
                    </div>
                    
                    <div class="form-group">
                        <label>Dependencies</label>
                        <input type="text" id="task-dependencies" placeholder="Enter task IDs separated by commas" value="${this.options.task?.dependsOn.join(', ') || ''}">
                    </div>
                </div>
                <div class="task-modal-footer">
                    <button class="task-modal-cancel">Cancel</button>
                    <button class="task-modal-save">Save Task</button>
                </div>
            </div>
        `;

        this.attachEventListeners();
        document.body.appendChild(this.modal);
    }

    private attachEventListeners() {
        const closeBtn = this.modal.querySelector('.task-modal-close');
        const cancelBtn = this.modal.querySelector('.task-modal-cancel');
        const saveBtn = this.modal.querySelector('.task-modal-save');

        closeBtn?.addEventListener('click', () => this.close());
        cancelBtn?.addEventListener('click', () => {
            this.options.onCancel?.();
            this.close();
        });
        saveBtn?.addEventListener('click', () => this.saveTask());

        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.close();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.close();
            }
        });
    }

    private async saveTask() {
        const taskData = this.getFormData();
        
        let task: Task;
        if (this.options.task) {
            task = { ...this.options.task, ...taskData };
        } else {
            task = {
                id: '',
                blockId: '',
                path: '',
                lineNumber: 0,
                originalText: '',
                indentation: '',
                tags: [],
                dependsOn: [],
                ...taskData
            };
        }

        this.options.onSave?.(task);
        this.close();
    }

    private getFormData() {
        const description = (this.modal.querySelector('#task-description') as HTMLTextAreaElement).value;
        const status = (this.modal.querySelector('#task-status') as HTMLSelectElement).value as TaskStatus;
        const priority = (this.modal.querySelector('#task-priority') as HTMLSelectElement).value as TaskPriority || undefined;
        const dueDate = this.parseDate((this.modal.querySelector('#task-due-date') as HTMLInputElement).value);
        const startDate = this.parseDate((this.modal.querySelector('#task-start-date') as HTMLInputElement).value);
        const scheduledDate = this.parseDate((this.modal.querySelector('#task-scheduled-date') as HTMLInputElement).value);
        const doneDate = this.parseDate((this.modal.querySelector('#task-done-date') as HTMLInputElement).value);
        const tags = this.parseTags((this.modal.querySelector('#task-tags') as HTMLInputElement).value);
        const recurrence = this.parseRecurrence((this.modal.querySelector('#task-recurrence') as HTMLInputElement).value);
        const dependsOn = this.parseDependencies((this.modal.querySelector('#task-dependencies') as HTMLInputElement).value);

        return {
            description,
            status,
            priority,
            dueDate,
            startDate,
            scheduledDate,
            doneDate,
            tags,
            recurrence,
            dependsOn
        };
    }

    private parseDate(dateStr: string): Date | undefined {
        if (!dateStr) return undefined;
        const date = new Date(dateStr);
        return isNaN(date.getTime()) ? undefined : date;
    }

    private parseTags(tagsStr: string): string[] {
        if (!tagsStr.trim()) return [];
        return tagsStr.split(',').map(tag => tag.trim()).filter(tag => tag);
    }

    private parseRecurrence(recurrenceStr: string) {
        if (!recurrenceStr.trim()) return undefined;
        return {
            rule: recurrenceStr.trim(),
            baseOnDoneDate: false
        };
    }

    private parseDependencies(depsStr: string): string[] {
        if (!depsStr.trim()) return [];
        return depsStr.split(',').map(dep => dep.trim()).filter(dep => dep);
    }

    private formatDate(date: Date): string {
        return date.toISOString().split('T')[0];
    }

    open() {
        this.modal.style.display = 'flex';
        (this.modal.querySelector('#task-description') as HTMLTextAreaElement)?.focus();
    }

    close() {
        this.modal.remove();
    }
}