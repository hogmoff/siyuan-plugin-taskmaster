import { Task, TaskQuery, TaskPriority } from './taskModels';

export class TaskQueryEngine {
    static filterTasks(tasks: Task[], query: TaskQuery): Task[] {
        let filteredTasks = [...tasks];

        if (query.status && query.status.length > 0) {
            filteredTasks = filteredTasks.filter(task => 
                query.status!.includes(task.status)
            );
        }

        if (query.priority && query.priority.length > 0) {
            filteredTasks = filteredTasks.filter(task => 
                task.priority && query.priority!.includes(task.priority)
            );
        }

        if (query.dueBefore) {
            filteredTasks = filteredTasks.filter(task => 
                task.dueDate && task.dueDate <= query.dueBefore!
            );
        }

        if (query.dueAfter) {
            filteredTasks = filteredTasks.filter(task => 
                task.dueDate && task.dueDate >= query.dueAfter!
            );
        }

        if (query.startsBefore) {
            filteredTasks = filteredTasks.filter(task => 
                task.startDate && task.startDate <= query.startsBefore!
            );
        }

        if (query.startsAfter) {
            filteredTasks = filteredTasks.filter(task => 
                task.startDate && task.startDate >= query.startsAfter!
            );
        }

        if (query.tags && query.tags.length > 0) {
            filteredTasks = filteredTasks.filter(task => 
                query.tags!.some(tag => task.tags.includes(tag))
            );
        }

        if (query.excludeTags && query.excludeTags.length > 0) {
            filteredTasks = filteredTasks.filter(task => 
                !query.excludeTags!.some(tag => task.tags.includes(tag))
            );
        }

        if (query.text) {
            const searchText = query.text.toLowerCase();
            filteredTasks = filteredTasks.filter(task => 
                task.description.toLowerCase().includes(searchText)
            );
        }

        if (query.path) {
            const pathPattern = new RegExp(query.path.replace('*', '.*'));
            filteredTasks = filteredTasks.filter(task => 
                pathPattern.test(task.path)
            );
        }

        if (query.sortBy) {
            filteredTasks.sort((a, b) => {
                let aValue: any = '';
                let bValue: any = '';

                switch (query.sortBy) {
                    case 'priority':
                        aValue = this.getPriorityValue(a.priority);
                        bValue = this.getPriorityValue(b.priority);
                        break;
                    case 'dueDate':
                        aValue = a.dueDate?.getTime() || Infinity;
                        bValue = b.dueDate?.getTime() || Infinity;
                        break;
                    case 'startDate':
                        aValue = a.startDate?.getTime() || Infinity;
                        bValue = b.startDate?.getTime() || Infinity;
                        break;
                    case 'description':
                        aValue = a.description.toLowerCase();
                        bValue = b.description.toLowerCase();
                        break;
                }

                if (query.sortOrder === 'desc') {
                    return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
                } else {
                    return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
                }
            });
        }

        if (query.limit && query.limit > 0) {
            filteredTasks = filteredTasks.slice(0, query.limit);
        }

        return filteredTasks;
    }

    private static getPriorityValue(priority?: TaskPriority): number {
        switch (priority) {
            case TaskPriority.URGENT: return 4;
            case TaskPriority.HIGH: return 3;
            case TaskPriority.MEDIUM: return 2;
            case TaskPriority.LOW: return 1;
            default: return 0;
        }
    }

    static parseQueryString(queryString: string): TaskQuery {
        const query: TaskQuery = {};
        const parts = queryString.split(' ').filter(part => part.trim());

        for (const part of parts) {
            if (part.startsWith('status:')) {
                const statuses = part.substring(7).split(',');
                query.status = statuses as any;
            } else if (part.startsWith('priority:')) {
                const priorities = part.substring(9).split(',');
                query.priority = priorities as any;
            } else if (part.startsWith('due:')) {
                const dateStr = part.substring(4);
                if (dateStr.startsWith('<')) {
                    query.dueBefore = new Date(dateStr.substring(1));
                } else if (dateStr.startsWith('>')) {
                    query.dueAfter = new Date(dateStr.substring(1));
                } else {
                    const date = new Date(dateStr);
                    query.dueBefore = new Date(date.getTime() + 24 * 60 * 60 * 1000);
                    query.dueAfter = date;
                }
            } else if (part.startsWith('starts:')) {
                const dateStr = part.substring(7);
                if (dateStr.startsWith('<')) {
                    query.startsBefore = new Date(dateStr.substring(1));
                } else if (dateStr.startsWith('>')) {
                    query.startsAfter = new Date(dateStr.substring(1));
                } else {
                    const date = new Date(dateStr);
                    query.startsBefore = new Date(date.getTime() + 24 * 60 * 60 * 1000);
                    query.startsAfter = date;
                }
            } else if (part.startsWith('tag:')) {
                const tags = part.substring(4).split(',');
                query.tags = tags;
            } else if (part.startsWith('-tag:')) {
                const excludeTags = part.substring(5).split(',');
                query.excludeTags = excludeTags;
            } else if (part.startsWith('path:')) {
                query.path = part.substring(5);
            } else if (part.startsWith('limit:')) {
                query.limit = parseInt(part.substring(6));
            } else if (part.startsWith('sort:')) {
                const sortPart = part.substring(5);
                if (sortPart.endsWith(' desc')) {
                    query.sortBy = sortPart.replace(' desc', '') as any;
                    query.sortOrder = 'desc';
                } else {
                    query.sortBy = sortPart as any;
                    query.sortOrder = 'asc';
                }
            } else {
                query.text = query.text ? query.text + ' ' + part : part;
            }
        }

        return query;
    }
}