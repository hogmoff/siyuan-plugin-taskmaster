import { Task, TaskStatus, TaskPriority, Recurrence } from './taskModels';
import { getPriorityEmoji } from './taskhelpers';

export class TaskParser {
    private static readonly TASK_REGEX = /^\s*(-|\*|\d+\.)\s*\[([ xX-])\]\s+(.*)$/;
    private static readonly PRIORITY_REGEX = /\ud83d\udd3a|\u2b06\ufe0f|\ud83d\udd3d|\u23ec/g;
    private static readonly DATE_REGEX = /\ud83d\udcc5\s*(\d{4}-\d{2}-\d{2})/g;
    private static readonly START_DATE_REGEX = /\ud83d\udeeb\s*(\d{4}-\d{2}-\d{2})/g;
    private static readonly SCHEDULED_DATE_REGEX = /\u23f3\s*(\d{4}-\d{2}-\d{2})/g;
    private static readonly DONE_DATE_REGEX = /\u2705\s*(\d{4}-\d{2}-\d{2})/g;
    private static readonly CANCELLED_DATE_REGEX = /\u274c\s*(\d{4}-\d{2}-\d{2})/g;
    private static readonly RECURRENCE_REGEX = /\ud83d\udd01\s*([a-zA-Z0-9\s,]+)/g;
    private static readonly TAG_REGEX = /#([\w-]+)/g;
    private static readonly DEPENDS_ON_REGEX = /\u26d4\s*([\w-]+)/g;

    static parseTaskFromMarkdown(
        line: string,
        blockId: string,
        path: string,
        lineNumber: number
    ): Task | null {
        const match = line.match(this.TASK_REGEX);
        if (!match) {
            console.log('Not match:', line)
            return null;
        }
            

        const [, ,statusChar, description] = match;
        const status = this.parseStatus(statusChar);

        const task: Task = {
            id: this.generateTaskId(),
            description: description.trim(),
            status,
            tags: [],
            dependsOn: [],
            blockId,
            path,
            lineNumber,
            originalText: line,
            indentation: line.match(/^\s*/)?.[0] || ''
        };

        task.priority = this.parsePriority(description);
        task.dueDate = this.parseDate(description, this.DATE_REGEX);
        task.startDate = this.parseDate(description, this.START_DATE_REGEX);
        task.scheduledDate = this.parseDate(description, this.SCHEDULED_DATE_REGEX);
        task.doneDate = this.parseDate(description, this.DONE_DATE_REGEX);
        task.cancelledDate = this.parseDate(description, this.CANCELLED_DATE_REGEX);
        task.recurrence = this.parseRecurrence(description);
        task.tags = this.parseTags(description);
        task.dependsOn = this.parseDependencies(description);
        task.description = this.cleanDescription(description);

        return task;
    }

    private static parseStatus(statusChar: string): TaskStatus {
        switch (statusChar) {
            case ' ':
                return TaskStatus.TODO;
            case '/':
                return TaskStatus.IN_PROGRESS;
            case 'x':
            case 'X':
                return TaskStatus.DONE;
            case '-':
                return TaskStatus.CANCELLED;
            default:
                return TaskStatus.TODO;
        }
    }

    private static parsePriority(description: string): TaskPriority | undefined {
        if (description.includes('⏫')) return TaskPriority.HIGH;
        if (description.includes('🔼')) return TaskPriority.MEDIUM;
        return TaskPriority.LOW;
    }

    private static parseDate(description: string, regex: RegExp): Date | undefined {
        const match = regex.exec(description);
        if (match) {
            const date = new Date(match[1]);
            return isNaN(date.getTime()) ? undefined : date;
        }
        return undefined;
    }

    private static parseRecurrence(description: string): Recurrence | undefined {
        const match = this.RECURRENCE_REGEX.exec(description);
        if (match) {
            return {
                rule: match[1].trim(),
                baseOnDoneDate: description.includes('when done')
            };
        }
        return undefined;
    }

    private static parseTags(description: string): string[] {
        const tags: string[] = [];
        let match: RegExpExecArray | null;
        while ((match = this.TAG_REGEX.exec(description)) !== null) {
            tags.push(match[1]);
        }
        return tags;
    }

    private static parseDependencies(description: string): string[] {
        const dependencies: string[] = [];
        let match: RegExpExecArray | null;
        while ((match = this.DEPENDS_ON_REGEX.exec(description)) !== null) {
            dependencies.push(match[1]);
        }
        return dependencies;
    }

    private static cleanDescription(description: string): string {
        return description
            .replace(this.PRIORITY_REGEX, '')
            .replace(this.DATE_REGEX, '')
            .replace(this.START_DATE_REGEX, '')
            .replace(this.SCHEDULED_DATE_REGEX, '')
            .replace(this.DONE_DATE_REGEX, '')
            .replace(this.CANCELLED_DATE_REGEX, '')
            .replace(this.RECURRENCE_REGEX, '')
            .replace(this.TAG_REGEX, '')
            .replace(this.DEPENDS_ON_REGEX, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    static generateTaskId(): string {
        return 'task_' + Math.random().toString(36).substring(2, 11);
    }

    static taskToMarkdown(task: Task): string {
        const statusChar = this.getStatusChar(task.status);
        let line = `${task.indentation}- [${statusChar}] ${task.description}`;

        if (task.priority) {
            const priorityEmoji = getPriorityEmoji(task.priority);
            line += ` ${priorityEmoji}`;
        }

        if (task.dueDate) {
            line += ` \ud83d\udcc5 ${task.dueDate.toISOString().split('T')[0]}`;
        }

        if (task.startDate) {
            line += ` \ud83d\udeeb ${task.startDate.toISOString().split('T')[0]}`;
        }

        if (task.scheduledDate) {
            line += ` \u23f3 ${task.scheduledDate.toISOString().split('T')[0]}`;
        }

        if (task.doneDate) {
            line += ` \u2705 ${task.doneDate.toISOString().split('T')[0]}`;
        }

        if (task.cancelledDate) {
            line += ` \u274c ${task.cancelledDate.toISOString().split('T')[0]}`;
        }

        if (task.recurrence) {
            line += ` \ud83d\udd01 ${task.recurrence.rule}`;
        }

        if (task.tags.length > 0) {
            line += ' ' + task.tags.map(tag => `#${tag}`).join(' ');
        }

        if (task.dependsOn.length > 0) {
            line += ' ' + task.dependsOn.map(dep => `\u26d4${dep}`).join(' ');
        }

        return line;
    }

    private static getStatusChar(status: TaskStatus): string {
        switch (status) {
            case TaskStatus.TODO:
                return ' ';
            case TaskStatus.IN_PROGRESS:
                return '/';
            case TaskStatus.DONE:
                return 'X';
            case TaskStatus.CANCELLED:
                return '-';
            default:
                return ' ';
        }
    }
}