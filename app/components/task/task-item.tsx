
'use client';

import { useState } from 'react';
import { Task, TaskPriority } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Clock, 
  AlertCircle, 
  Tag, 
  MoreVertical,
  Edit,
  Trash2,
  CheckCircle2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';

interface TaskItemProps {
  task: Task;
  onToggleStatus: (taskId: string, next?: Task['status']) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  className?: string;
}

const TaskItem = ({ 
  task, 
  onToggleStatus, 
  onEdit, 
  onDelete, 
  className 
}: TaskItemProps) => {
  const { t, lang } = useI18n();
  const [isHovered, setIsHovered] = useState(false);

  const getPriorityColor = (priority: TaskPriority): string => {
    switch (priority) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-muted-foreground';
      default: return 'text-muted-foreground';
    }
  };

  const getPriorityBgClass = (priority: TaskPriority): string => {
    switch (priority) {
      case 'high':
        return 'bg-red-500/10 border-red-500/20';
      case 'medium':
        return 'bg-amber-500/10 border-amber-500/20';
      case 'low':
      default:
        return 'bg-card border';
    }
  };

  const getPriorityAccentClass = (priority: TaskPriority): string => {
    switch (priority) {
      case 'high':
        return 'bg-red-400';
      case 'medium':
        return 'bg-orange-400';
      case 'low':
      default:
        return 'bg-muted';
    }
  };

  const isOverdue = (() => {
    if (!task.dates.due || task.status === 'done') return false;
    const due = new Date(task.dates.due);
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    return due < startOfToday;
  })();

  const isDueToday = (() => {
    if (!task.dates.due) return false;
    const due = new Date(task.dates.due);
    const today = new Date();
    return due.toDateString() === today.toDateString();
  })();

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return t('tasks.today');
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return t('tasks.tomorrow');
    } else {
      const loc = lang === 'de' ? 'de-DE' : 'en-US';
      return date.toLocaleDateString(loc, { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  return (
    <div 
      className={cn(
        "group relative p-4 rounded-lg border transition-all duration-200 hover:shadow-md",
        getPriorityBgClass(task.priority),
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Priority accent on the left */}
      <span
        className={cn(
          'absolute left-0 top-0 bottom-0 w-1 rounded-l-lg',
          getPriorityAccentClass(task.priority)
        )}
      />
      <div className="flex items-start gap-3">
        {/* Status Checkbox */}
        <div className="flex items-center mt-0.5">
          <Checkbox
            checked={task.status === 'done'}
            onCheckedChange={(checked) => onToggleStatus(task.id, checked === true ? 'done' : 'todo')}
            className="h-5 w-5"
          />
        </div>

        {/* Task Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            {/* Task Content */}
            <div className="flex items-center justify-between w-full">
              <p className={cn(
                "text-sm font-medium leading-relaxed",
                task.status === 'done' && "line-through text-muted-foreground",
                task.status === 'cancelled' && "line-through text-muted-foreground"
              )}>
                {task.content}
              </p>
              
              {/* Completion indicator for done tasks */}
              {task.status === 'done' && (
                <div className="flex items-center gap-2 text-sm text-green-600 ml-2 flex-shrink-0">
                  <span>✅ {task.dates.done || new Date().toISOString().split('T')[0]}</span>
                </div>
              )}
            </div>
          </div>

          {/* Metadata Row */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {/* Due Date */}
            {task.dates.due && (
              <div className={cn(
                "flex items-center gap-1",
                isOverdue && "text-red-500 font-medium",
                !isOverdue && isDueToday && "text-green-600 font-medium"
              )}>
                <Calendar className="h-3 w-3" />
                <span>{formatDate(task.dates.due)}</span>
                {isOverdue && <AlertCircle className="h-3 w-3" />}
              </div>
            )}

            {/* Start Date */}
            {task.dates.start && (
              <div className="flex items-center gap-1">
                <span className="text-green-500">🛫</span>
                <span>{formatDate(task.dates.start)}</span>
              </div>
            )}

          {/* Scheduled Date */}
          {task.dates.scheduled && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{formatDate(task.dates.scheduled)}</span>
            </div>
          )}

          {/* Recurrence */}
          {task.recurrence?.rule && (
            <div className="flex items-center gap-1">
              <span>🔁</span>
              <span>{task.recurrence.rule}{task.recurrence.baseOnDoneDate ? ` (${t('forms.baseOnDone')})` : ''}</span>
            </div>
          )}

            {/* Tags */}
            {task.tags && task.tags.length > 0 && (
              <div className="flex items-center gap-1">
                <Tag className="h-3 w-3" />
                <div className="flex gap-1">
                  {task.tags.slice(0, 2).map((tag, index) => (
                <Badge 
                  key={index}
                  variant="secondary" 
                  className="text-xs px-1.5 py-0.5 h-auto"
                >
                  {tag}
                </Badge>
                  ))}
                  {task.tags.length > 2 && (
                    <Badge 
                      variant="secondary" 
                      className="text-xs px-1.5 py-0.5 h-auto"
                    >
                      +{task.tags.length - 2}
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Dependencies */}
            {task.dependencies && task.dependencies.length > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-orange-500">⛔</span>
                <span className="text-xs">{task.dependencies.length} deps</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className={cn(
          "flex items-center gap-1 opacity-0 transition-opacity duration-200",
          (isHovered || task.status === 'in_progress') && "opacity-100"
        )}>
          {task.status === 'in_progress' && (
            <div className="flex items-center justify-center h-6 w-6 rounded-full bg-blue-100">
              <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
            </div>
          )}
          
          <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm"
              className="h-8 w-8 p-0 hover:bg-muted"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onEdit(task)}>
                <Edit className="h-4 w-4 mr-2" />
                {t('tasks.editTask')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onToggleStatus(task.id, task.status === 'done' ? 'todo' : 'done')}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {task.status === 'done' ? t('tasks.markAsTodo') : t('tasks.markAsDone')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onDelete(task.id)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t('tasks.deleteTask')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};

export default TaskItem;
