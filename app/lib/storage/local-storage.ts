
import { Task, AppState, TaskFilter, TaskSort } from '../types';

const STORAGE_KEYS = {
  TASKS: 'siyuan_todoist_tasks',
  LAST_SYNC: 'siyuan_todoist_last_sync',
  SETTINGS: 'siyuan_todoist_settings',
  FILTER: 'siyuan_todoist_filter',
  SORT: 'siyuan_todoist_sort',
} as const;

export class LocalStorageManager {
  static saveTasks(tasks: Task[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    } catch (error) {
      console.error('Failed to save tasks to localStorage:', error);
    }
  }

  static loadTasks(): Task[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.TASKS);
      if (!stored) return [];
      
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Failed to load tasks from localStorage:', error);
      return [];
    }
  }

  static saveLastSync(timestamp: string): void {
    try {
      localStorage.setItem(STORAGE_KEYS.LAST_SYNC, timestamp);
    } catch (error) {
      console.error('Failed to save last sync timestamp:', error);
    }
  }

  static getLastSync(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
    } catch (error) {
      console.error('Failed to get last sync timestamp:', error);
      return null;
    }
  }

  static saveFilter(filter: TaskFilter): void {
    try {
      localStorage.setItem(STORAGE_KEYS.FILTER, JSON.stringify(filter));
    } catch (error) {
      console.error('Failed to save filter settings:', error);
    }
  }

  static loadFilter(): TaskFilter {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.FILTER);
      if (!stored) return {};
      
      return JSON.parse(stored) || {};
    } catch (error) {
      console.error('Failed to load filter settings:', error);
      return {};
    }
  }

  static saveSort(sort: TaskSort): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SORT, JSON.stringify(sort));
    } catch (error) {
      console.error('Failed to save sort settings:', error);
    }
  }

  static loadSort(): TaskSort {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SORT);
      if (!stored) return { field: 'due', direction: 'asc' };
      
      return JSON.parse(stored) || { field: 'due', direction: 'asc' };
    } catch (error) {
      console.error('Failed to load sort settings:', error);
      return { field: 'due', direction: 'asc' };
    }
  }

  static saveSettings(settings: {
    baseUrl?: string;
    token?: string;
    // Daily note insertion settings
    notebookId?: string;
    dailyHPathTemplate?: string;
    anchorText?: string;
    language?: 'en' | 'de';
  }): void {
    try {
      const current = this.loadSettings();
      const updated = { ...current, ...settings };
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  static loadSettings(): {
    baseUrl?: string;
    token?: string;
    notebookId?: string;
    dailyHPathTemplate?: string;
    anchorText?: string;
    language?: 'en' | 'de';
  } {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!stored) return {};
      
      return JSON.parse(stored) || {};
    } catch (error) {
      console.error('Failed to load settings:', error);
      return {};
    }
  }

  static clearAll(): void {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
  }

  static getStorageUsage(): { used: number; available: number } {
    try {
      let used = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          used += localStorage[key].length + key.length;
        }
      }

      // Rough estimate of available space (5MB typical limit)
      const available = 5242880 - used;
      
      return { used, available };
    } catch (error) {
      console.error('Failed to calculate storage usage:', error);
      return { used: 0, available: 0 };
    }
  }

  static isAvailable(): boolean {
    try {
      const test = 'localStorage_test';
      localStorage.setItem(test, 'test');
      localStorage.removeItem(test);
      return true;
    } catch (error) {
      return false;
    }
  }
}

export default LocalStorageManager;
