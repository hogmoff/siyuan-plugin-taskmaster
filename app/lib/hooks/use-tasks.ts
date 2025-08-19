
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Task, TaskFilter, TaskSort, SiyuanBlock } from '../types';
import { siyuanClient } from '../api/siyuan-client';
import { TaskParser } from '../parsers/task-parser';
import { LocalStorageManager } from '../storage/local-storage';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [syncInProgress, setSyncInProgress] = useState(false);
  
  // Use ref to keep current tasks accessible in callbacks
  const tasksRef = useRef<Task[]>([]);
  
  // Update ref whenever tasks change
  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  // Load tasks from local storage on mount
  useEffect(() => {
    const savedTasks = LocalStorageManager.loadTasks();
    const savedLastSync = LocalStorageManager.getLastSync();
    
    // Attempt to repair stale "Untitled Task" items using current parser
    let repaired = savedTasks;
    try {
      repaired = savedTasks.map((t) => {
        if (!t || !t.markdown) return t;
        if (t.content && t.content !== 'Untitled Task') return t;
        const parsed = TaskParser.parseTask(t.markdown, t.id, {
          updated: t.updated,
          created: t.created,
          parent_id: t.parentId,
          path: t.path,
        } as any);
        if (parsed && parsed.content && parsed.content !== 'Untitled Task') {
          return { ...t, content: parsed.content };
        }
        return t;
      });
      if (JSON.stringify(repaired) !== JSON.stringify(savedTasks)) {
        LocalStorageManager.saveTasks(repaired);
      }
    } catch (_) {
      // ignore repair failures
    }

    setTasks(repaired);
    setLastSync(savedLastSync);
    setLoading(false);
  }, []);

  // Auto-sync on mount and periodically
  useEffect(() => {
    // Initial sync
    syncTasks();
    
    // Set up periodic sync (every 5 minutes instead of 30 seconds)
    const syncInterval = setInterval(() => {
      if (!syncInProgress) {
        syncTasks();
      }
    }, 300000); // Sync every 5 minutes

    return () => clearInterval(syncInterval);
  }, []); // Remove syncInProgress dependency to prevent recreation

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = async () => {
      setIsOffline(false);
      // Sync when coming back online
      if (tasks.length > 0) {
        // Use a timeout to call the functions after they're available
        setTimeout(() => {
          syncTasks();
          setTimeout(() => retrySyncForLocalTasks(), 1000);
        }, 100);
      }
    };
    
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [tasks.length]); // Remove function dependencies

  const syncTasks = useCallback(async () => {
    if (syncInProgress) return;
    
    setSyncInProgress(true);
    setError(null);

    try {
      // Test connection first
      const isOnline = await siyuanClient.testConnection();
      setIsOffline(!isOnline);

      if (!isOnline) {
        throw new Error('Unable to connect to Siyuan Notes');
      }

      // Fetch tasks from Siyuan
      const blocks = await siyuanClient.getTasks();
      const parsedTasks: Task[] = [];

      blocks.forEach((block: SiyuanBlock) => {
        const task = TaskParser.parseTask(block.markdown, block.id, block);
        if (task) {
          parsedTasks.push(task);
        }
      });

      // Compare with current tasks to detect changes
      const currentTasks = tasksRef.current;
      const currentTasksHash = JSON.stringify(currentTasks.map(t => ({ id: t.id, updated: t.updated })).sort());
      const newTasksHash = JSON.stringify(parsedTasks.map(t => ({ id: t.id, updated: t.updated })).sort());

      // Only update if there are actual changes
      if (currentTasksHash !== newTasksHash) {
        setTasks(parsedTasks);
        LocalStorageManager.saveTasks(parsedTasks);
        console.log('Tasks updated from sync - changes detected');
      } else {
        console.log('No changes detected during sync');
      }
      
      const now = new Date().toISOString();
      setLastSync(now);
      LocalStorageManager.saveLastSync(now);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sync tasks';
      setError(errorMessage);
      setIsOffline(true);
      console.error('Sync failed:', err);
    } finally {
      setSyncInProgress(false);
    }
  }, []); // Remove dependencies to prevent recreation

  const createTask = useCallback(async (taskData: Partial<Task>) => {
    try {
      const tempId = `temp_${Date.now()}_${Math.random()}`;
      
      // Create a new task object
      const newTask: Task = {
        id: tempId,
        content: taskData.content || 'New Task',
        status: taskData.status || 'todo',
        priority: taskData.priority || 'low',
        dates: taskData.dates || {},
        tags: taskData.tags || [],
        dependencies: taskData.dependencies || [],
        recurrence: taskData.recurrence,
        blockId: '',
        updated: new Date().toISOString(),
        created: new Date().toISOString(),
        markdown: '',
      };

      // Generate markdown
      newTask.markdown = TaskParser.formatTask(newTask);

      // Add to local state immediately (optimistic update)
      const currentTasks = tasksRef.current;
      const updatedTasks = [...currentTasks, newTask];
      setTasks(updatedTasks);
      LocalStorageManager.saveTasks(updatedTasks);

      // Try to sync with Siyuan if online
      if (!isOffline) {
        try {
          const blockId = await siyuanClient.insertTaskBlock('', newTask.markdown);
          if (blockId) {
            newTask.id = blockId;
            newTask.blockId = blockId;
            
            // Update the task with the actual block ID
            const finalTasks = updatedTasks.map(t => 
              t.id === tempId ? newTask : t
            );
            setTasks(finalTasks);
            LocalStorageManager.saveTasks(finalTasks);
            console.log('Successfully created task in Siyuan with blockId:', blockId);
          } else {
            console.warn('Task created in Siyuan but no blockId returned');
            setError('Task created but may not sync properly. Please refresh.');
          }
        } catch (syncError) {
          console.error('Failed to sync new task to Siyuan:', syncError);
          const errorMsg = syncError instanceof Error ? syncError.message : 'Failed to sync to Siyuan Notes';
          setError(`Task created locally but not synced: ${errorMsg}`);
        }
      } else {
        console.log('Offline mode: Task created locally only');
      }

      return newTask;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create task';
      setError(errorMessage);
      throw err;
    }
  }, [isOffline]);

  const updateTask = useCallback(async (taskId: string, updates: Partial<Task>) => {
    try {
      // Find and update the task
      const currentTasks = tasksRef.current;
      const updatedTasks = currentTasks.map(task => {
        if (task.id === taskId) {
          const updatedTask = { ...task, ...updates, updated: new Date().toISOString() };
          
          // If task is being marked as done, set the completion date
          if (updatedTask.status === 'done' && task.status !== 'done') {
            const today = new Date().toISOString().split('T')[0];
            updatedTask.dates = { ...updatedTask.dates, done: today };
          }
          // If task is being unmarked from done, remove the completion date
          else if (updatedTask.status !== 'done' && task.status === 'done') {
            const { done, ...remainingDates } = updatedTask.dates;
            updatedTask.dates = remainingDates;
          }
          
          updatedTask.markdown = TaskParser.formatTask(updatedTask);
          return updatedTask;
        }
        return task;
      });

      // Update local state immediately
      setTasks(updatedTasks);
      LocalStorageManager.saveTasks(updatedTasks);

      // Try to sync with Siyuan if online
      const task = updatedTasks.find(t => t.id === taskId);
      if (!isOffline && task) {
        try {
          // If task doesn't have blockId, it might be a local-only task
          if (!task.blockId) {
            console.log('Task has no blockId, attempting to create in Siyuan:', task.content);
            // Try to create the task in Siyuan
            const blockId = await siyuanClient.insertTaskBlock('', task.markdown);
            if (blockId) {
              // Update the task with the new blockId
              const finalTasks = updatedTasks.map(t => 
                t.id === taskId ? { ...t, blockId, id: blockId } : t
              );
              setTasks(finalTasks);
              LocalStorageManager.saveTasks(finalTasks);
              console.log('Successfully created task in Siyuan with blockId:', blockId);
            }
          } else {
            // Update existing task in Siyuan
            await siyuanClient.updateTaskBlock(task.blockId, task.markdown);
            console.log('Successfully updated task in Siyuan:', task.blockId);
          }
        } catch (syncError) {
          console.error('Failed to sync task update to Siyuan:', syncError);
          // Set a more specific error message
          const errorMsg = syncError instanceof Error ? syncError.message : 'Failed to sync changes to Siyuan Notes';
          setError(`Changes saved locally but not synced: ${errorMsg}`);
        }
      } else if (isOffline) {
        console.log('Offline mode: Task changes saved locally only');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update task';
      setError(errorMessage);
      throw err;
    }
  }, [isOffline]);

  const deleteTask = useCallback(async (taskId: string) => {
    try {
      const currentTasks = tasksRef.current;
      const task = currentTasks.find(t => t.id === taskId);
      
      // Remove from local state immediately
      const updatedTasks = currentTasks.filter(t => t.id !== taskId);
      setTasks(updatedTasks);
      LocalStorageManager.saveTasks(updatedTasks);

      // Try to sync with Siyuan if online
      if (!isOffline && task?.blockId) {
        try {
          await siyuanClient.deleteTaskBlock(task.blockId);
          console.log('Successfully deleted task from Siyuan:', task.blockId);
        } catch (syncError) {
          console.error('Failed to sync task deletion to Siyuan:', syncError);
          const errorMsg = syncError instanceof Error ? syncError.message : 'Failed to sync deletion to Siyuan Notes';
          setError(`Task deleted locally but not synced: ${errorMsg}`);
          // Could potentially restore the task here if needed
        }
      } else if (isOffline) {
        console.log('Offline mode: Task deleted locally only');
      } else if (task && !task.blockId) {
        console.log('Local-only task deleted (no blockId)');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete task';
      setError(errorMessage);
      throw err;
    }
  }, [isOffline]);

  const toggleTaskStatus = useCallback(async (taskId: string, target?: Task['status']) => {
    const currentTasks = tasksRef.current;
    const task = currentTasks.find(t => t.id === taskId);
    if (!task) return;

    if (target) {
      await updateTask(taskId, { status: target });
      return;
    }

    // Fallback behavior (legacy toggle): todo -> in_progress -> done -> todo
    let newStatus = task.status;
    switch (task.status) {
      case 'todo':
        newStatus = 'in_progress';
        break;
      case 'in_progress':
        newStatus = 'done';
        break;
      case 'done':
      case 'cancelled':
        newStatus = 'todo';
        break;
    }
    await updateTask(taskId, { status: newStatus });
  }, [updateTask]);

  // Retry sync for tasks without blockIds
  const retrySyncForLocalTasks = useCallback(async () => {
    if (isOffline) return;
    
    const currentTasks = tasksRef.current;
    const localTasks = currentTasks.filter(task => !task.blockId);
    
    if (localTasks.length === 0) return;
    
    console.log(`Retrying sync for ${localTasks.length} local tasks`);
    
    for (const task of localTasks) {
      try {
        const blockId = await siyuanClient.insertTaskBlock('', task.markdown);
        if (blockId) {
          // Update the task with the new blockId
          setTasks(prevTasks => 
            prevTasks.map(t => 
              t.id === task.id ? { ...t, blockId, id: blockId } : t
            )
          );
          console.log('Successfully synced local task:', task.content);
        }
      } catch (error) {
        console.error('Failed to sync local task:', task.content, error);
      }
    }
    
    // Save updated tasks to local storage
    const updatedTasks = tasksRef.current;
    LocalStorageManager.saveTasks(updatedTasks);
  }, [isOffline]);

  return {
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
    clearError: () => setError(null),
  };
}
