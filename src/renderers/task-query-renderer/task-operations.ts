import { Task, TaskGroup } from '../../types/task';
import { isToday, isWithinDays, isOverdue, formatDateGroup } from '../../utils/dateUtils';

export function applyCurrentFilter(
    tasks: Task[],
    filter: 'today' | 'next7days' | 'all' | 'date',
    selectedDate: Date | null,
    selectedTag: string | null
): Task[] {
    let filteredTasks = tasks;

    
    if (selectedTag !== null) {
        if (selectedTag === '') {
            
            filteredTasks = filteredTasks.filter(task => !task.tags || task.tags.length === 0);
        } else {
            
            filteredTasks = filteredTasks.filter(task => task.tags && task.tags.includes(selectedTag!));
        }
    }

    
    switch (filter) {
        case 'today':
            return filteredTasks.filter(task =>
                task.dueDate && (isToday(task.dueDate) || isOverdue(task.dueDate))
            );
        case 'next7days':
            return filteredTasks.filter(task =>
                task.dueDate && (isWithinDays(task.dueDate, 7) || isOverdue(task.dueDate))
            );
        case 'date':
            if (!selectedDate) return filteredTasks;
            return filteredTasks.filter(task =>
                task.dueDate &&
                (task.dueDate.toDateString() === selectedDate!.toDateString() || 
                isOverdue(task.dueDate))
            );
        case 'all':
        default:
            return filteredTasks;
    }
}

export function sortTasks(tasks: Task[]): Task[] {
    return tasks.sort((a, b) => {
        
        if (a.dueDate && b.dueDate) {
            const dateDiff = a.dueDate.getTime() - b.dueDate.getTime();
            if (dateDiff !== 0) return dateDiff;
        } else if (a.dueDate && !b.dueDate) {
            return -1;
        } else if (!a.dueDate && b.dueDate) {
            return 1;
        }
        
        const priorities = { urgent: 4, high: 3, medium: 2, low: 1 };
        const aPriority = priorities[a.priority || 'low'] || 1;
        const bPriority = priorities[b.priority || 'low'] || 1;
        if (aPriority !== bPriority) {
            return bPriority - aPriority;
        }

        
        if (a.createdDate && b.createdDate) {
            return a.createdDate.getTime() - b.createdDate.getTime();
        }

        return 0;
    });
}

export function groupTasksByDate(tasks: Task[]): TaskGroup[] {
    const groups = new Map<string, TaskGroup>();

    tasks.forEach(task => {
        let groupLabel: string;
        let groupDate: Date;

        if (task.dueDate) {
            groupLabel = formatDateGroup(task.dueDate);
            groupDate = task.dueDate;
        } else {
            groupLabel = 'Kein Datum';
            groupDate = new Date(9999, 11, 31);
        }

        if (!groups.has(groupLabel)) {
            groups.set(groupLabel, {
                date: groupDate,
                label: groupLabel,
                tasks: []
            });
        }

        groups.get(groupLabel)!.tasks.push(task);
    });

    return Array.from(groups.values()).sort((a, b) =>
        a.date.getTime() - b.date.getTime()
    );
}

