import { Task, TaskFilter, TaskSort } from '../types';

export type ParsedQuery = {
  filter: TaskFilter;
  sort?: TaskSort;
  limit?: number;
  // Extra range filters that can be applied independently of TaskFilter
  dueAfter?: Date;
  dueBefore?: Date;
  startsAfter?: Date;
  startsBefore?: Date;
  text?: string;
  excludeTags?: string[];
  path?: string; // glob-like pattern
  specialSort?: 'startDate';
};

function normalize(str: string) {
  return str.replace(/\u200B/g, '').replace(/\uFEFF/g, '').trim();
}

function parseDateShortcut(token: string): { start: Date; end: Date } | null {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (token === 'today') {
    const start = new Date(today);
    const end = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    return { start, end };
  }
  if (token === 'tomorrow') {
    const t = new Date(today);
    t.setDate(t.getDate() + 1);
    const start = t;
    const end = new Date(t.getTime() + 24 * 60 * 60 * 1000);
    return { start, end };
  }
  return null;
}

export function parseQueryString(input: string): ParsedQuery {
  const q: ParsedQuery = { filter: {} };
  const raw = normalize(input);
  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);

  for (const part of lines) {
    if (part.startsWith('status:')) {
      const statuses = part.substring(7).split(',').map(s => s.trim()).filter(Boolean);
      if (statuses.length) q.filter.status = statuses as any;
      continue;
    }
    if (part.startsWith('priority:')) {
      const priorities = part.substring(9).split(',').map(p => p.trim()).filter(Boolean);
      if (priorities.length) q.filter.priority = priorities as any;
      continue;
    }
    if (part.startsWith('due:')) {
      const dateStr = part.substring(4).trim();
      const win = parseDateShortcut(dateStr);
      if (win) {
        q.dueAfter = win.start;
        q.dueBefore = win.end;
      } else if (dateStr.startsWith('<')) {
        q.dueBefore = new Date(dateStr.substring(1));
      } else if (dateStr.startsWith('>')) {
        q.dueAfter = new Date(dateStr.substring(1));
      } else if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        const d = new Date(dateStr);
        q.dueAfter = d;
        q.dueBefore = new Date(d.getTime() + 24 * 60 * 60 * 1000);
      }
      continue;
    }
    if (part.startsWith('starts:')) {
      const dateStr = part.substring(7).trim();
      const win = parseDateShortcut(dateStr);
      if (win) {
        q.startsAfter = win.start;
        q.startsBefore = win.end;
      } else if (dateStr.startsWith('<')) {
        q.startsBefore = new Date(dateStr.substring(1));
      } else if (dateStr.startsWith('>')) {
        q.startsAfter = new Date(dateStr.substring(1));
      } else if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        const d = new Date(dateStr);
        q.startsAfter = d;
        q.startsBefore = new Date(d.getTime() + 24 * 60 * 60 * 1000);
      }
      continue;
    }
    if (part.startsWith('tag:')) {
      const tags = part.substring(4).split(',').map(t => t.trim()).filter(Boolean);
      if (tags.length) q.filter.tags = tags;
      continue;
    }
    if (part.startsWith('-tag:')) {
      const tags = part.substring(5).split(',').map(t => t.trim()).filter(Boolean);
      if (tags.length) q.excludeTags = tags;
      continue;
    }
    if (part.startsWith('path:')) {
      q.path = part.substring(5).trim();
      continue;
    }
    if (part.startsWith('limit:')) {
      const n = parseInt(part.substring(6).trim(), 10);
      if (!Number.isNaN(n) && n > 0) q.limit = n;
      continue;
    }
    if (part.startsWith('sort:')) {
      const rawSort = part.substring(5).trim();
      let direction: TaskSort['direction'] = 'asc';
      let field = rawSort;
      if (rawSort.endsWith(' desc')) {
        field = rawSort.replace(/\s+desc$/i, '');
        direction = 'desc';
      }
      // Map plugin fields to app fields
      if (field === 'priority') q.sort = { field: 'priority', direction };
      else if (field === 'dueDate' || field === 'due') q.sort = { field: 'due', direction };
      else if (field === 'startDate' || field === 'start') { q.sort = { field: 'content', direction }; q.specialSort = 'startDate'; }
      else if (field === 'description' || field === 'content') q.sort = { field: 'content', direction };
      else q.sort = { field: 'due', direction };
      continue;
    }

    // Free text accumulates
    const txt = part.trim();
    q.text = q.text ? `${q.text} ${txt}` : txt;
  }

  // Also propagate searchQuery for display purposes
  if (q.text) q.filter.searchQuery = q.text;
  return q;
}

export function applyParsedQuery(tasks: Task[], parsed: ParsedQuery): Task[] {
  const { filter, limit, sort, excludeTags, path, dueAfter, dueBefore, startsAfter, startsBefore, text } = parsed;
  let result = [...tasks];

  // Status
  if (filter.status?.length) {
    result = result.filter(t => filter.status!.includes(t.status));
  }
  // Priority
  if (filter.priority?.length) {
    result = result.filter(t => filter.priority!.includes(t.priority));
  }
  // Tags include
  if (filter.tags?.length) {
    result = result.filter(t => t.tags?.some(tag => filter.tags!.some(f => tag.toLowerCase().includes(f.toLowerCase()))));
  }
  // Tags exclude
  if (excludeTags?.length) {
    result = result.filter(t => !t.tags?.some(tag => excludeTags!.some(f => tag.toLowerCase().includes(f.toLowerCase()))));
  }
  // Text search
  if (text && text.trim()) {
    const q = text.toLowerCase();
    result = result.filter(t => t.content.toLowerCase().includes(q) || (t.tags||[]).some(tag => tag.toLowerCase().includes(q)));
  }
  // Path glob
  if (path && path.length) {
    const regex = new RegExp('^' + path.split('*').map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*') + '$');
    result = result.filter(t => (t.path && regex.test(t.path)) || false);
  }
  // Due ranges
  if (dueAfter) {
    result = result.filter(t => t.dates.due ? new Date(t.dates.due) >= dueAfter : false);
  }
  if (dueBefore) {
    result = result.filter(t => t.dates.due ? new Date(t.dates.due) < dueBefore : false);
  }
  // Starts ranges
  if (startsAfter) {
    result = result.filter(t => t.dates.start ? new Date(t.dates.start) >= startsAfter : false);
  }
  if (startsBefore) {
    result = result.filter(t => t.dates.start ? new Date(t.dates.start) < startsBefore : false);
  }

  // Sort
  if (sort) {
    const { field, direction } = sort;
    result.sort((a, b) => {
      let cmp = 0;
      if (field === 'due') {
        const aDue = a.dates.due || '9999-12-31';
        const bDue = b.dates.due || '9999-12-31';
        cmp = aDue.localeCompare(bDue);
      } else if (field === 'priority') {
        const order = { high: 3, medium: 2, low: 1 } as const;
        cmp = order[a.priority] - order[b.priority];
      } else if (field === 'created') {
        cmp = new Date(a.created).getTime() - new Date(b.created).getTime();
      } else if (field === 'updated') {
        cmp = new Date(a.updated).getTime() - new Date(b.updated).getTime();
      } else if (field === 'content') {
        if (parsed.specialSort === 'startDate') {
          const aStart = a.dates.start || '9999-12-31';
          const bStart = b.dates.start || '9999-12-31';
          cmp = aStart.localeCompare(bStart);
        } else {
          cmp = a.content.localeCompare(b.content);
        }
      }
      return direction === 'desc' ? -cmp : cmp;
    });
  }

  // Limit
  if (limit && limit > 0) {
    result = result.slice(0, limit);
  }

  return result;
}
