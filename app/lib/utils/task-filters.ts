
import { Task, TaskFilter, TaskSort } from '../types';

export class TaskFilterUtils {
  static applyFilters(tasks: Task[], filter: TaskFilter): Task[] {
    let filteredTasks = [...tasks];

    // Filter by status
    if (filter.status && filter.status.length > 0) {
      filteredTasks = filteredTasks.filter(task => 
        filter.status?.includes(task.status)
      );
    }

    // Filter by priority
    if (filter.priority && filter.priority.length > 0) {
      filteredTasks = filteredTasks.filter(task => 
        filter.priority?.includes(task.priority)
      );
    }

    // Filter by tags
    if (filter.tags && filter.tags.length > 0) {
      filteredTasks = filteredTasks.filter(task => 
        filter.tags?.some(filterTag => 
          task.tags.some(taskTag => 
            taskTag.toLowerCase().includes(filterTag.toLowerCase())
          )
        )
      );
    }

    // Filter by search query
    if (filter.searchQuery && filter.searchQuery.trim()) {
      const query = filter.searchQuery.toLowerCase().trim();
      filteredTasks = filteredTasks.filter(task => 
        task.content.toLowerCase().includes(query) ||
        task.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Filter by date range
    if (filter.dateRange?.type && filter.dateRange.start) {
      filteredTasks = filteredTasks.filter(task => {
        const dateType = filter.dateRange?.type;
        const taskDate = dateType ? task.dates[dateType] : undefined;
        
        if (!taskDate) return false;

        const date = new Date(taskDate);
        const startDate = new Date(filter.dateRange?.start || '');
        const endDate = filter.dateRange?.end ? new Date(filter.dateRange.end) : null;

        if (endDate) {
          return date >= startDate && date <= endDate;
        } else {
          return date >= startDate;
        }
      });
    }

    // Filter tasks with no due date
    if (filter.hasNoDueDate) {
      filteredTasks = filteredTasks.filter(task => !task.dates.due);
    }

    return filteredTasks;
  }

  static applySorting(tasks: Task[], sort: TaskSort): Task[] {
    return [...tasks].sort((a, b) => {
      let compareValue = 0;

      switch (sort.field) {
        case 'due':
          const aDue = a.dates.due || '9999-12-31';
          const bDue = b.dates.due || '9999-12-31';
          compareValue = aDue.localeCompare(bDue);
          break;

        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          compareValue = priorityOrder[b.priority] - priorityOrder[a.priority];
          break;

        case 'created':
          compareValue = new Date(a.created).getTime() - new Date(b.created).getTime();
          break;

        case 'updated':
          compareValue = new Date(a.updated).getTime() - new Date(b.updated).getTime();
          break;

        case 'content':
          compareValue = a.content.localeCompare(b.content);
          break;

        default:
          compareValue = 0;
      }

      return sort.direction === 'desc' ? -compareValue : compareValue;
    });
  }

  static getUniqueValues<K extends keyof Task>(
    tasks: Task[], 
    field: K
  ): Task[K][] {
    const values = tasks
      .map(task => task[field])
      .filter((value, index, array) => 
        value !== null && value !== undefined && array.indexOf(value) === index
      );
    
    return values as Task[K][];
  }

  static getAllTags(tasks: Task[]): string[] {
    const allTags = new Set<string>();
    
    tasks.forEach(task => {
      task.tags?.forEach(tag => allTags.add(tag));
    });

    return Array.from(allTags).sort();
  }

  static getTaskStats(tasks: Task[]) {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'done').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    const todo = tasks.filter(t => t.status === 'todo').length;
    const cancelled = tasks.filter(t => t.status === 'cancelled').length;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const overdue = tasks.filter(t => {
      if (!t.dates.due) return false;
      const dueDate = new Date(t.dates.due);
      return dueDate < todayStart && t.status !== 'done';
    }).length;

    return {
      total,
      completed,
      inProgress,
      todo,
      cancelled,
      overdue,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }

  static getProjectStats(tasks: Task[]) {
    const projectMap = new Map<string, { total: number; completed: number }>();
    
    tasks.forEach(task => {
      // Use the first tag as project, or 'No Project' if no tags
      const project = task.tags?.[0] || 'No Project';
      
      if (!projectMap.has(project)) {
        projectMap.set(project, { total: 0, completed: 0 });
      }
      
      const stats = projectMap.get(project)!;
      stats.total++;
      
      if (task.status === 'done') {
        stats.completed++;
      }
    });

    return Array.from(projectMap.entries()).map(([name, stats]) => ({
      name,
      tag: name === 'No Project' ? '' : name,
      color: this.getProjectColor(name),
      taskCount: stats.total,
      completedCount: stats.completed,
    }));
  }

  private static getProjectColor(projectName: string): string {
    const colors = [
      '#60B5FF', '#FF9149', '#FF9898', '#FF90BB', 
      '#FF6363', '#80D8C3', '#A19AD3', '#72BF78'
    ];
    
    // Simple hash function for consistent color assignment
    let hash = 0;
    for (let i = 0; i < projectName.length; i++) {
      hash = projectName.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  }
}
