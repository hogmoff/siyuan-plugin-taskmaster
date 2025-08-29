
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
      color: 'text-gray-600',
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
      id: 'in_progress',
      label: 'In Progress',
      icon: Clock,
      count: stats.inProgress,
      color: 'text-blue-600',
      description: 'Currently working on'
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
    <div className={cn("w-64 border-r bg-gray-50 flex flex-col", className)}>
      {/* Stats Overview */}
      <div className="p-4 border-b bg-white">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <h2 className="font-semibold text-gray-900">Overview</h2>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="p-2 rounded-lg bg-gray-50">
              <div className="font-semibold text-lg text-gray-900">{stats.total}</div>
              <div className="text-gray-600 text-xs">Total Tasks</div>
            </div>
            
            <div className="p-2 rounded-lg bg-green-50">
              <div className="font-semibold text-lg text-green-700">{stats.completionRate}%</div>
              <div className="text-green-600 text-xs">Complete</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Views */}
      <div className="p-4 space-y-2">
        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
          Quick Views
        </h3>
        {/* Inline Quick Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search tasks..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="h-8 pl-10 pr-7 bg-white focus:ring-2 focus:ring-blue-100"
          />
          {localSearch && (
            <button
              type="button"
              aria-label="Clear task search"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              onClick={() => setLocalSearch('')}
            >
              <XCircle className="h-4 w-4" />
            </button>
          )}
        </div>

        {quickViews.map((view) => {
          const Icon = view.icon;
          const isSelected = selectedProject === view.id;
          
          return (
            <Button
              key={view.id}
              variant="ghost"
              onClick={() => onProjectSelect(view.id)}
              className={cn(
                "w-full justify-start gap-3 h-9 px-3",
                isSelected && "bg-blue-50 text-blue-700 border-l-2 border-blue-500"
              )}
            >
              <Icon className={cn("h-4 w-4", view.color)} />
              <span className="flex-1 text-left font-medium">{view.label}</span>
              {view.count > 0 && (
                <Badge 
                  variant="secondary" 
                  className={cn(
                    "h-5 px-2 text-xs",
                    isSelected && "bg-blue-100 text-blue-800"
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
        <div className="p-4 space-y-1 flex-1 overflow-y-auto">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
            Projects
          </h3>
          <div className="mb-2 relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
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
                className="absolute right-2 top-2 h-4 w-4 text-gray-400 hover:text-gray-600"
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
