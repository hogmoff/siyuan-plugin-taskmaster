
// Core Types for Siyuan Todoist Clone

export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'cancelled';
export type TaskPriority = 'high' | 'medium' | 'low';

export interface TaskDate {
  due?: string;
  start?: string;
  scheduled?: string;
  done?: string;
  cancelled?: string;
}

export interface Recurrence {
  rule: string;
  baseOnDoneDate?: boolean;
}

export interface Task {
  id: string;
  content: string;
  status: TaskStatus;
  priority: TaskPriority;
  dates: TaskDate;
  tags: string[];
  dependencies: string[];
  blockId: string;
  updated: string;
  created: string;
  markdown: string;
  parentId?: string;
  path?: string;
  recurrence?: Recurrence;
}

export interface SiyuanBlock {
  id: string;
  parent_id?: string;
  root_id: string;
  hash: string;
  box: string;
  path: string;
  hpath: string;
  name: string;
  alias: string;
  memo: string;
  tag: string;
  content: string;
  markdown: string;
  length: number;
  type: string;
  subtype: string;
  ial?: string;
  sort: number;
  created: string;
  updated: string;
}

export interface SiyuanResponse<T = any> {
  code: number;
  msg: string;
  data: T;
}

export interface TaskFilter {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  tags?: string[];
  searchQuery?: string;
  dateRange?: {
    start?: string;
    end?: string;
    type: 'due' | 'start' | 'scheduled';
  };
  hasNoDueDate?: boolean;
  hasNoTags?: boolean;
}

export interface TaskSort {
  field: 'due' | 'priority' | 'created' | 'updated' | 'content';
  direction: 'asc' | 'desc';
}

export interface AppState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  filter: TaskFilter;
  sort: TaskSort;
  selectedTags: string[];
  isOffline: boolean;
  lastSync: string | null;
  syncInProgress: boolean;
}

export interface Project {
  name: string;
  tag: string;
  color: string;
  taskCount: number;
  completedCount: number;
}
