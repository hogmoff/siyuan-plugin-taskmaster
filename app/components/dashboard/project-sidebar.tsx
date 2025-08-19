
'use client';

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
  Tag,
  BarChart3,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProjectSidebarProps {
  tasks: Task[];
  selectedProject: string | null;
  onProjectSelect: (project: string | null) => void;
  className?: string;
}

const ProjectSidebar = ({ 
  tasks, 
  selectedProject, 
  onProjectSelect,
  className 
}: ProjectSidebarProps) => {
  const stats = TaskFilterUtils.getTaskStats(tasks);
  const projects = TaskFilterUtils.getProjectStats(tasks);

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
      <div className="p-4 space-y-1">
        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
          Quick Views
        </h3>
        
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

      {/* Projects */}
      {projects.length > 0 && (
        <div className="p-4 space-y-1 flex-1 overflow-y-auto">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
            Projects
          </h3>
          
          {projects.map((project) => {
            const isSelected = selectedProject === project.tag;
            const completionRate = project.taskCount > 0 
              ? Math.round((project.completedCount / project.taskCount) * 100)
              : 0;
            
            return (
              <Button
                key={project.name}
                variant="ghost"
                onClick={() => onProjectSelect(project.tag || null)}
                className={cn(
                  "w-full justify-start gap-3 h-auto py-2 px-3 flex-col items-start",
                  isSelected && "bg-blue-50 text-blue-700 border-l-2 border-blue-500"
                )}
              >
                <div className="w-full flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="h-3 w-3 rounded-full" 
                      style={{ backgroundColor: project.color }}
                    />
                    <span className="font-medium truncate">
                      {project.name}
                    </span>
                  </div>
                  
                  <Badge 
                    variant="secondary" 
                    className={cn(
                      "h-5 px-2 text-xs",
                      isSelected && "bg-blue-100 text-blue-800"
                    )}
                  >
                    {project.taskCount}
                  </Badge>
                </div>
                
                {project.taskCount > 0 && (
                  <div className="w-full">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                      <span>{project.completedCount}/{project.taskCount} done</span>
                      <span>{completionRate}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1">
                      <div 
                        className="bg-green-500 h-1 rounded-full transition-all duration-300" 
                        style={{ width: `${completionRate}%` }}
                      />
                    </div>
                  </div>
                )}
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProjectSidebar;
