
'use client';

import { Task, TaskFilter, TaskSort } from '@/lib/types';
import TaskItem from './task-item';
import { TaskFilterUtils } from '@/lib/utils/task-filters';
import { Button } from '@/components/ui/button';
import { Plus, ListTodo } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';

interface TaskListProps {
  tasks: Task[];
  filter: TaskFilter;
  sort: TaskSort;
  onToggleStatus: (taskId: string, next?: Task['status']) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onCreateTask: () => void;
  className?: string;
  loading?: boolean;
}

const TaskList = ({ 
  tasks, 
  filter, 
  sort, 
  onToggleStatus, 
  onEditTask, 
  onDeleteTask, 
  onCreateTask,
  className,
  loading = false
}: TaskListProps) => {
  const { t } = useI18n();
  // Apply filters and sorting
  const filteredTasks = TaskFilterUtils.applyFilters(tasks, filter);
  const sortedTasks = TaskFilterUtils.applySorting(filteredTasks, sort);

  // Group tasks by status for better organization
  const groupedTasks = {
    todo: sortedTasks.filter(t => t.status === 'todo'),
    in_progress: sortedTasks.filter(t => t.status === 'in_progress'),
    done: sortedTasks.filter(t => t.status === 'done'),
    cancelled: sortedTasks.filter(t => t.status === 'cancelled'),
  };

  if (loading) {
    return (
      <div className={cn("space-y-4", className)}>
        {/* Loading skeleton */}
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="p-4 rounded-lg border bg-muted">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 bg-muted rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (sortedTasks.length === 0) {
    return (
      <div className={cn("text-center py-12", className)}>
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 rounded-full bg-muted">
            <ListTodo className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-foreground">
              {tasks.length === 0 ? t('tasks.noTasksYet') : t('tasks.noTasksMatch')}
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              {tasks.length === 0 ? t('tasks.emptyCreateFirst') : t('tasks.emptyAdjustFilters')}
            </p>
          </div>
          <Button onClick={onCreateTask} className="mt-2">
            <Plus className="h-4 w-4 mr-2" />
            {t('tasks.createTask')}
          </Button>
        </div>
      </div>
    );
  }

  const renderTaskGroup = (title: string, tasks: Task[], showCount = true) => {
    if (tasks.length === 0) return null;

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
            {title}
            {showCount && (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                {tasks.length}
              </span>
            )}
          </h3>
        </div>
        <div className="space-y-2">
          {tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggleStatus={onToggleStatus}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
            />
          ))}
        </div>
      </div>
    );
  };

  // Show grouped view when no specific status filter is applied
  const showGrouped = !filter.status || filter.status.length > 1;

  return (
    <div className={cn("space-y-6", className)}>
      {showGrouped ? (
        <>
          {renderTaskGroup(t('tasks.inProgress'), groupedTasks.in_progress)}
          {renderTaskGroup(t('tasks.toDo'), groupedTasks.todo)}
          {renderTaskGroup(t('tasks.completed'), groupedTasks.done)}
          {renderTaskGroup(t('tasks.cancelled'), groupedTasks.cancelled)}
        </>
      ) : (
        <div className="space-y-2">
          {sortedTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggleStatus={onToggleStatus}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
            />
          ))}
        </div>
      )}

      {/* Floating Add Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button 
          onClick={onCreateTask}
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
};

export default TaskList;
