import { Task, TaskQuery, TaskStatus } from './taskModels';
import { TaskParser } from './taskParser';
import { TaskQueryEngine } from './taskQuery';
import { sql, updateBlock } from '../../api';

export class TaskService {
    private tasks: Map<string, Task> = new Map();

    async loadAllTasks(): Promise<Task[]> {
        const tasks: Task[] = [];
        
        try {
            const taskBlocks = await sql(`
                SELECT * FROM blocks 
                WHERE type = 'i'
                AND subtype = 't' 
                AND markdown LIKE '%- [%] %'
                ORDER BY updated DESC 
                LIMIT 10000
            `);

            for (const block of taskBlocks) {
                try {                    
                    const lines = block.markdown.split('\n');
                    for (let i = 0; i < lines.length; i++) {
                        const line = lines[i];
                        const task = TaskParser.parseTaskFromMarkdown(
                            line,
                            block.id,
                            block.path,
                            block.line || i + 1
                        );
                        
                        if (task) {
                            this.tasks.set(task.id, task);
                            tasks.push(task);
                        }                        
                    }
                } catch (error) {
                    console.error('Error parsing task:', error);
                }
            }
        } catch (error) {
            console.error('Error loading tasks:', error);
        }

        return tasks;
    }

    async getAllTasks(): Promise<Task[]> {
        if (this.tasks.size === 0) {
            await this.loadAllTasks();
        }
        return Array.from(this.tasks.values());
    }

    async getTasks(query?: TaskQuery): Promise<Task[]> {
        let tasks = await this.getAllTasks();

        if (query) {
            tasks = TaskQueryEngine.filterTasks(tasks, query);
        }

        return tasks;
    }

    async getTaskById(id: string): Promise<Task | undefined> {
        return this.tasks.get(id);
    }

    async updateTask(task: Task): Promise<void> {
        this.tasks.set(task.id, task);

        // Update the corresponding Siyuan block if blockId exists
        if (task.blockId) {
            try {
                // Replace the old line with the updated task
                const newLine = TaskParser.taskToMarkdown(task);                     
                await updateBlock('markdown', newLine, task.blockId);     

            } catch (error) {
                console.error('Error updating task in Siyuan:', error);
            }
        }
    }

    async createTask(task: Task): Promise<Task> {
        const newTask = {
            ...task,
            id: TaskParser.generateTaskId()
        };
        
        this.tasks.set(newTask.id, newTask);
        return newTask;
    }

    async deleteTask(id: string): Promise<void> {
        this.tasks.delete(id);
    }

    async refreshTasks(): Promise<void> {
        this.tasks.clear();
        await this.loadAllTasks();
    }

    async getTasksByQueryString(queryString: string): Promise<Task[]> {
        let query = null;
        if (queryString.trim().length > 0) {
            query = TaskQueryEngine.parseQueryString(queryString);
            return await this.getTasks(query);
        }
        else {
            return await this.loadAllTasks();
        }       
    }

    async getTasksByTag(tag: string): Promise<Task[]> {
        return this.getTasks({ tags: [tag] });
    }

    async getOverdueTasks(): Promise<Task[]> {
        return this.getTasks({ 
            status: [TaskStatus.TODO, TaskStatus.IN_PROGRESS],
            dueBefore: new Date()
        });
    }

    async getTasksDueToday(): Promise<Task[]> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        return this.getTasks({ 
            status: [TaskStatus.TODO, TaskStatus.IN_PROGRESS],
            dueAfter: today,
            dueBefore: tomorrow
        });
    }

    async getTasksDueThisWeek(): Promise<Task[]> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const weekFromNow = new Date(today);
        weekFromNow.setDate(weekFromNow.getDate() + 7);
        
        return this.getTasks({ 
            status: [TaskStatus.TODO, TaskStatus.IN_PROGRESS],
            dueAfter: today,
            dueBefore: weekFromNow
        });
    }

    async getCompletedTasks(): Promise<Task[]> {
        return this.getTasks({ status: [TaskStatus.DONE] });
    }

    async getTasksByPriority(priority: string): Promise<Task[]> {
        return this.getTasks({ priority: [priority as any] });
    }

    subscribeToChanges(): () => void {
        return () => {};
    }
}