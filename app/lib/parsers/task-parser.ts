
import { Task, TaskStatus, TaskPriority, TaskDate, Recurrence } from '../types';

export class TaskParser {
  private static readonly STATUS_REGEX = /^\s*(-|\*|\d+\.)\s*\[([ xX/\-])\]\s+(.*)$/;
  private static readonly PRIORITY_REGEX = /(⏫|🔼)/;
  private static readonly DATE_REGEX = /(📅|🛫|⏳|✅|❌)\s*(\d{4}-\d{2}-\d{2})/g;
  private static readonly TAG_REGEX = /#([\w-/]+)#/g;
  private static readonly DEPENDENCY_REGEX = /⛔\s*([\w-]+)/g;
  private static readonly RECURRENCE_REGEX = /🔁\s*([^#⛔✅❌📅🛫⏳\n]+?)(?:\s+when\s+done)?(?=\s|$)/i;

  static parseTask(markdown: string, blockId: string, block: any): Task | null {
    if (!this.STATUS_REGEX.test(markdown)) {
      return null;
    }

    const status = this.parseStatus(markdown);
    const priority = this.parsePriority(markdown);
    const content = this.parseContent(markdown);
    const dates = this.parseDates(markdown);
    const tags = this.parseTags(markdown);
    const dependencies = this.parseDependencies(markdown);
    const recurrence = this.parseRecurrence(markdown);

    return {
      id: blockId,
      content,
      status,
      priority,
      dates,
      tags,
      dependencies,
      blockId,
      updated: block?.updated || new Date().toISOString(),
      created: block?.created || new Date().toISOString(),
      markdown: markdown.trim(),
      parentId: block?.parent_id,
      path: block?.path,
      recurrence,
    };
  }

  static parseStatus(markdown: string): TaskStatus {
    const match = markdown.match(this.STATUS_REGEX);
    if (!match) return 'todo';
    const checkbox = match[2];
    switch (checkbox) {
      case ' ':
        return 'todo';
      case '/':
        return 'in_progress';
      case 'x':
      case 'X':
        return 'done';
      case '-':
        return 'cancelled';
      default:
        return 'todo';
    }
  }

  static parsePriority(markdown: string): TaskPriority {
    if (markdown.includes('⏫')) return 'high';
    if (markdown.includes('🔼')) return 'medium';
    return 'low';
  }

  static parseContent(markdown: string): string {
    // Extract the content portion after the checkbox prefix
    const m = markdown.match(this.STATUS_REGEX);
    const base = m ? m[3] : markdown;

    let content = base
      .replace(this.PRIORITY_REGEX, '')
      .replace(this.DATE_REGEX, '')
      .replace(this.TAG_REGEX, '')
      .replace(this.DEPENDENCY_REGEX, '')
      .replace(this.RECURRENCE_REGEX, '')
      .trim();

    // Normalize spaces
    content = content.replace(/\s+/g, ' ').trim();

    return content || 'Untitled Task';
  }

  static parseDates(markdown: string): TaskDate {
    const dates: TaskDate = {};
    let match;

    // Reset regex lastIndex to ensure proper matching
    const dateRegex = new RegExp(this.DATE_REGEX.source, this.DATE_REGEX.flags);
    
    while ((match = dateRegex.exec(markdown)) !== null) {
      const emoji = match[1];
      const date = match[2];

      switch (emoji) {
        case '📅':
          dates.due = date;
          break;
        case '🛫':
          dates.start = date;
          break;
        case '⏳':
          dates.scheduled = date;
          break;
        case '✅':
          dates.done = date;
          break;
        case '❌':
          dates.cancelled = date;
          break;
      }
    }

    return dates;
  }

  static parseTags(markdown: string): string[] {
    const tags: string[] = [];
    let match;

    const tagRegex = new RegExp(this.TAG_REGEX.source, this.TAG_REGEX.flags);
    
    while ((match = tagRegex.exec(markdown)) !== null) {
      const tag = match[1];
      if (tag && !tags.includes(tag)) {
        tags.push(tag);
      }
    }

    return tags;
  }

  static parseDependencies(markdown: string): string[] {
    const dependencies: string[] = [];
    let match;

    const depRegex = new RegExp(this.DEPENDENCY_REGEX.source, this.DEPENDENCY_REGEX.flags);
    
    while ((match = depRegex.exec(markdown)) !== null) {
      const taskId = match[1];
      if (taskId && !dependencies.includes(taskId)) {
        dependencies.push(taskId);
      }
    }

    return dependencies;
  }

  static parseRecurrence(markdown: string): Recurrence | undefined {
    const m = markdown.match(this.RECURRENCE_REGEX);
    if (!m) return undefined;
    const rule = m[1].trim();
    const baseOnDoneDate = /when\s+done/i.test(markdown);
    if (!rule) return undefined;
    return { rule, baseOnDoneDate };
  }

  static formatTask(task: Task): string {
    let markdown = '';

    // Status checkbox
    const statusChar = this.getStatusChar(task.status);
    markdown += `- [${statusChar}] `;

    // Priority
    if (task.priority === 'high') {
      markdown += '⏫ ';
    } else if (task.priority === 'medium') {
      markdown += '🔼 ';
    }

    // Content
    markdown += task.content;

    // Other dates
    if (task.dates.due) markdown += ` 📅${task.dates.due}`;
    if (task.dates.start) markdown += ` 🛫${task.dates.start}`;
    if (task.dates.scheduled) markdown += ` ⏳${task.dates.scheduled}`;
    if (task.dates.cancelled) markdown += ` ❌${task.dates.cancelled}`;

    // Recurrence
    if (task.recurrence?.rule) {
      markdown += ` 🔁 ${task.recurrence.rule}`;
      if (task.recurrence.baseOnDoneDate) {
        markdown += ' when done';
      }
    }

    // Completion mark should come after recurrence and before tags/dependencies
    if (task.status === 'done') {
      const completionDate = task.dates.done || new Date().toISOString().split('T')[0];
      markdown += ` ✅ ${completionDate}`;
    }

    // Tags
    task.tags?.forEach(tag => {
      markdown += ` #${tag}#`;
    });

    // Dependencies
    task.dependencies?.forEach(dep => {
      markdown += ` ⛔${dep}`;
    });

    return markdown;
  }

  private static getStatusChar(status: TaskStatus): string {
    switch (status) {
      case 'todo':
        return ' ';
      case 'in_progress':
        return '/';
      case 'done':
        return 'X';
      case 'cancelled':
        return '-';
      default:
        return ' ';
    }
  }
}
