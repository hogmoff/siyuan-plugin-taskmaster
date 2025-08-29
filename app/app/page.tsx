
'use client';

import { useState, useEffect } from 'react';
import { Task, TaskFilter, TaskSort } from '@/lib/types';
import { useTasks } from '@/lib/hooks/use-tasks';
import { TaskFilterUtils } from '@/lib/utils/task-filters';
import { LocalStorageManager } from '@/lib/storage/local-storage';

// Components
import Header from '@/components/layout/header';
import FilterPanel from '@/components/filters/filter-panel';
import TaskList from '@/components/task/task-list';
import TaskForm from '@/components/forms/task-form';
import ProjectSidebar from '@/components/dashboard/project-sidebar';
import ConnectionSettings from '@/components/settings/connection-settings';
import { parseQueryString, applyParsedQuery } from '@/lib/utils/query-parser';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';

export default function Home() {
  const {
    tasks,
    loading,
    error,
    isOffline,
    lastSync,
    syncInProgress,
    syncTasks,
    createTask,
    updateTask,
    deleteTask,
    toggleTaskStatus,
    retrySyncForLocalTasks,
    clearError,
  } = useTasks();

  // UI State
  const [filter, setFilter] = useState<TaskFilter>({});
  const [sort, setSort] = useState<TaskSort>({ field: 'due', direction: 'asc' });
  const [selectedProject, setSelectedProject] = useState<string | null>('inbox');
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [queryString, setQueryString] = useState<string>('');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Load saved preferences
  useEffect(() => {
    const savedFilter = LocalStorageManager.loadFilter();
    const savedSort = LocalStorageManager.loadSort();
    
    setFilter(savedFilter);
    setSort(savedSort);
  }, []);

  // Save preferences when they change
  useEffect(() => {
    LocalStorageManager.saveFilter(filter);
  }, [filter]);

  useEffect(() => {
    LocalStorageManager.saveSort(sort);
  }, [sort]);

  // Apply project filter when selected
  useEffect(() => {
    // If advanced query is active, don't override with project quick-filters
    if (queryString.trim()) return;
    if (selectedProject === 'inbox' || selectedProject === null) {
      // Reset all quick-view related filters to show all tasks
      setFilter({});
    } else if (selectedProject === 'today') {
      const today = new Date().toISOString().split('T')[0];
      setFilter(prev => ({ 
        ...prev, 
        dateRange: { start: today, end: today, type: 'due' },
        status: ['todo', 'in_progress']
      }));
    } else if (selectedProject === 'overdue') {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      setFilter(prev => ({ 
        ...prev, 
        // Exclude today by ending at yesterday and include everything from the past
        dateRange: { start: '1970-01-01', end: yesterday, type: 'due' },
        status: ['todo', 'in_progress']
      }));
    } else if (selectedProject === 'in_progress') {
      setFilter(prev => ({ ...prev, status: ['in_progress'], tags: undefined }));
    } else if (selectedProject === 'completed') {
      setFilter(prev => ({ ...prev, status: ['done'], tags: undefined }));
    } else if (selectedProject) {
      setFilter(prev => ({ ...prev, tags: [selectedProject], status: undefined }));
    }
  }, [selectedProject, queryString]);

  // Handle task form submission
  const handleTaskSubmit = async (taskData: Partial<Task>) => {
    try {
      if (editingTask?.id) {
        await updateTask(editingTask.id, taskData);
      } else {
        await createTask(taskData);
      }
    } catch (err) {
      console.error('Task submission failed:', err);
    }
  };

  // Handle task editing
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsTaskFormOpen(true);
  };

  // Close task form
  const handleCloseTaskForm = () => {
    setIsTaskFormOpen(false);
    setEditingTask(null);
  };

  // Clear filters
  const handleClearFilters = () => {
    setFilter({});
    setSelectedProject('inbox');
  };

  // Get available tags
  const availableTags = TaskFilterUtils.getAllTags(tasks);

  // Get task stats
  const taskStats = TaskFilterUtils.getTaskStats(tasks);

  // Handle connection settings updates
  const handleSettingsUpdated = () => {
    // Force a sync after settings are updated
    syncTasks();
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <ProjectSidebar
        tasks={tasks}
        selectedProject={selectedProject}
        onProjectSelect={setSelectedProject}
        searchQuery={filter.searchQuery || ''}
        onSearchChange={(q) => {
          const trimmed = q.trim();
          if (!trimmed) setQueryString('');
          setFilter(prev => ({ ...prev, searchQuery: q || undefined }));
        }}
        className="hidden md:flex"
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header
          isOffline={isOffline}
          lastSync={lastSync}
          syncInProgress={syncInProgress}
          onSync={syncTasks}
          onSettings={() => setShowSettings(true)}
          onRetrySync={retrySyncForLocalTasks}
          onOpenSidebar={() => setMobileSidebarOpen(true)}
          taskStats={taskStats}
        />

        {/* Filter Panel */}
        <FilterPanel
          filter={filter}
          sort={sort}
          onFilterChange={setFilter}
          onSortChange={setSort}
          onClearFilters={handleClearFilters}
          availableTags={availableTags}
          queryString={queryString}
          onQueryChange={setQueryString}
        />

        {/* Task List */}
        <main className="flex-1 overflow-y-auto">
          <div className="container max-w-4xl mx-auto p-4">
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <p className="text-red-800">{error}</p>
                  <button 
                    onClick={clearError}
                    className="text-red-600 hover:text-red-800"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            <TaskList
              tasks={(() => {
                const q = queryString.trim();
                if (!q) return tasks;
                const normalized = q.startsWith('tasks') ? q.replace(/^tasks\s*/i, '') : q;
                const parsed = parseQueryString(normalized);
                return applyParsedQuery(tasks, parsed);
              })()}
              filter={queryString.trim() ? {} : filter}
              sort={queryString.trim() ? { field: 'due', direction: 'asc' } : sort}
              onToggleStatus={toggleTaskStatus}
              onEditTask={handleEditTask}
              onDeleteTask={deleteTask}
              onCreateTask={() => setIsTaskFormOpen(true)}
              loading={loading}
            />
          </div>
        </main>
      </div>

      {/* Task Form Modal */}
      <TaskForm
        isOpen={isTaskFormOpen}
        onClose={handleCloseTaskForm}
        onSubmit={handleTaskSubmit}
        task={editingTask}
        availableTags={availableTags}
        loading={syncInProgress}
      />

      {/* Connection Settings Modal */}
      <ConnectionSettings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onSettingsUpdated={handleSettingsUpdated}
      />

      {/* Mobile Sidebar Sheet */}
      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent side="left" className="p-0 w-[85%] sm:w-[360px]">
          <SheetTitle className="sr-only">Sidebar</SheetTitle>
          <ProjectSidebar
            tasks={tasks}
            selectedProject={selectedProject}
            onProjectSelect={(id) => { setSelectedProject(id); setMobileSidebarOpen(false); }}
            searchQuery={filter.searchQuery || ''}
            onSearchChange={(q) => {
              const trimmed = q.trim();
              if (!trimmed) setQueryString('');
              setFilter(prev => ({ ...prev, searchQuery: q || undefined }));
            }}
            className="flex md:hidden w-full h-full"
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}

// Avoid static pre-render which can evaluate client-only hooks in SSR
export const dynamic = 'force-dynamic'
