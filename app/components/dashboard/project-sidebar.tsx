
'use client';

import React from 'react';
import { Task } from '@/lib/types';
import { TaskFilterUtils } from '@/lib/utils/task-filters';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Inbox, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  BarChart3,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import TagTree from '@/components/dashboard/tag-tree';
import { Input } from '@/components/ui/input';
import { Search, XCircle } from 'lucide-react';

interface ProjectSidebarProps {
  tasks: Task[];
  selectedProject: string | null;
  onProjectSelect: (project: string | null) => void;
  // Search moved here from filter panel
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  className?: string;
}

const ProjectSidebar = ({ 
  tasks, 
  selectedProject, 
  onProjectSelect,
  searchQuery = '',
  onSearchChange,
  className 
}: ProjectSidebarProps) => {
  const stats = TaskFilterUtils.getTaskStats(tasks);
  const todayStr = React.useMemo(() => new Date().toISOString().split('T')[0], []);
  const todaysTasks = React.useMemo(
    () => tasks.filter(t => t.dates.due === todayStr || t.dates.scheduled === todayStr),
    [tasks, todayStr]
  );
  const todaysCompleted = React.useMemo(
    () => todaysTasks.filter(t => t.status === 'done').length,
    [todaysTasks]
  );
  const todaysCompletionRate = React.useMemo(
    () => (todaysTasks.length > 0 ? Math.round((todaysCompleted / todaysTasks.length) * 100) : 0),
    [todaysTasks, todaysCompleted]
  );
  const allTags = TaskFilterUtils.getAllTags(tasks);
  const [tagQuery, setTagQuery] = React.useState('');
  // Debounced search input
  const [localSearch, setLocalSearch] = React.useState(searchQuery || '');
  React.useEffect(() => {
    setLocalSearch(searchQuery || '');
  }, [searchQuery]);
  React.useEffect(() => {
    const handle = setTimeout(() => {
      onSearchChange?.(localSearch);
    }, 200);
    return () => clearTimeout(handle);
  }, [localSearch]);

  const quickViews = [
    {
      id: 'inbox',
      label: 'Inbox',
      icon: Inbox,
      count: stats.total,
      color: 'text-muted-foreground',
      description: 'All tasks'
    },
    {
      id: 'today',
      label: 'Today',
      icon: Calendar,
      count: tasks.filter(t => 
        t.dates.due === new Date().toISOString().split('T')[0] ||
        t.dates.scheduled === new Date().toISOString().split('T')[0]
      ).length,
      color: 'text-green-600',
      description: 'Due or scheduled today'
    },
    {
      id: 'overdue',
      label: 'Overdue',
      icon: AlertTriangle,
      count: stats.overdue,
      color: 'text-red-600',
      description: 'Past due date'
    },
    {
      id: 'completed',
      label: 'Completed',
      icon: CheckCircle2,
      count: stats.completed,
      color: 'text-green-600',
      description: 'Finished tasks'
    },
  ];

  const getViewFilter = (viewId: string) => {
    switch (viewId) {
      case 'inbox':
        return null; // Show all tasks
      case 'today':
        return {
          dateRange: {
            start: new Date().toISOString().split('T')[0],
            end: new Date().toISOString().split('T')[0],
            type: 'due' as const
          }
        };
      case 'overdue':
        return {
          dateRange: {
            end: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Yesterday
            type: 'due' as const
          }
        };
      case 'in_progress':
        return { status: ['in_progress' as const] };
      case 'completed':
        return { status: ['done' as const] };
      default:
        return null;
    }
  };

  return (
    <div className={cn("w-64 border-r bg-secondary flex flex-col overflow-y-auto", className)}>
      {/* Stats Overview (Today) */}
      <div className="p-4 border-b bg-card flex-none">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <h2 className="font-semibold text-foreground">Overview</h2>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="p-2 rounded-lg bg-muted">
              <div className="font-semibold text-lg text-foreground">{todaysTasks.length}</div>
              <div className="text-muted-foreground text-xs">Today Tasks</div>
            </div>
            
            <div className="p-2 rounded-lg border bg-green-500/10 border-green-500/20">
              <div className="font-semibold text-lg text-green-600">{todaysCompletionRate}%</div>
              <div className="text-green-600 text-xs">Today Complete</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Views */}
      <div className="p-4 space-y-2 flex-none">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
          Quick Views
        </h3>
        {/* Inline Quick Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search tasks..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="h-8 pl-10 pr-7 bg-background focus:ring-2 focus:ring-blue-100"
          />
          {localSearch && (
            <button
              type="button"
              aria-label="Clear task search"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setLocalSearch('')}
            >
              <XCircle className="h-4 w-4" />
            </button>
          )}
        </div>

        {quickViews.map((view) => {
          const Icon = view.icon;
          const isSelected = view.id === 'inbox' ? selectedProject === null : selectedProject === view.id;
          
          return (
            <Button
              key={view.id}
              variant="ghost"
              onClick={() => onProjectSelect(view.id === 'inbox' ? null : view.id)}
              className={cn(
                "w-full justify-start gap-3 h-9 px-3",
                isSelected && "bg-primary/10 text-primary border-l-2 border-primary"
              )}
            >
              <Icon className={cn("h-4 w-4", view.color)} />
              <span className="flex-1 text-left font-medium">{view.label}</span>
              {view.count > 0 && (
                <Badge 
                  variant="secondary" 
                  className={cn(
                    "h-5 px-2 text-xs",
                    isSelected && "bg-primary/10 text-primary"
                  )}
                >
                  {view.count}
                </Badge>
              )}
            </Button>
          );
        })}
      </div>

      {/* Projects (Tags Hierarchy) */}
      {allTags.length > 0 && (
        <div className="p-4 space-y-1 flex-1">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Projects
          </h3>
          <div className="mb-2 relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={tagQuery}
              onChange={(e) => setTagQuery(e.target.value)}
              placeholder="Search tags..."
              className="pl-8 h-8"
            />
            {tagQuery && (
              <button
                type="button"
                aria-label="Clear tag search"
                className="absolute right-2 top-2 h-4 w-4 text-muted-foreground hover:text-foreground"
                onClick={() => setTagQuery('')}
              >
                <XCircle className="h-4 w-4" />
              </button>
            )}
          </div>
          <TagTree
            tasks={tasks}
            tags={allTags}
            selected={selectedProject}
            onSelect={(tag) => onProjectSelect(tag)}
            query={tagQuery.trim() || undefined}
          />
        </div>
      )}
    </div>
  );
};

export default ProjectSidebar;
