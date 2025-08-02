export enum TaskStatus {
    TODO = 'todo',
    IN_PROGRESS = 'in_progress',
    DONE = 'done',
    CANCELLED = 'cancelled'
}

export enum TaskPriority {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    URGENT = 'urgent'
}

export interface Recurrence {
    rule: string;
    baseOnDoneDate?: boolean;
}

export interface Task {
    id: string;
    description: string;
    status: TaskStatus;
    priority?: TaskPriority;
    dueDate?: Date;
    startDate?: Date;
    scheduledDate?: Date;
    doneDate?: Date;
    cancelledDate?: Date;
    recurrence?: Recurrence;
    tags: string[];
    dependsOn: string[];
    blockId: string;
    path: string;
    lineNumber: number;
    originalText: string;
    indentation: string;
}

export interface TaskQuery {
    status?: TaskStatus[];
    priority?: TaskPriority[];
    dueBefore?: Date;
    dueAfter?: Date;
    startsBefore?: Date;
    startsAfter?: Date;
    tags?: string[];
    path?: string;
    excludeTags?: string[];
    text?: string;
    limit?: number;
    sortBy?: 'priority' | 'dueDate' | 'startDate' | 'description';
    sortOrder?: 'asc' | 'desc';
}