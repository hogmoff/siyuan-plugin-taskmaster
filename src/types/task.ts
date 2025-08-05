/**
 * Task-Interfaces für die Task-Verwaltung
 */

/**
 * Repräsentiert eine einzelne Aufgabe
 */
export interface Task {
    id: string;
    description: string;
    status: 'todo' | 'done';
    priority?: 'urgent' | 'high' | 'medium' | 'low';
    dueDate?: Date;
    createdDate?: Date;
    tags?: string[];
    blockId?: string;
}

/**
 * Repräsentiert eine Gruppe von Aufgaben nach Datum
 */
export interface TaskGroup {
    date: Date;
    label: string;
    tasks: Task[];
}