import './TaskQueryDock.css'
import { sql, updateBlock } from '@/api'

export class TaskQueryDock {
    public element: HTMLElement;
    public blockId: string;

    constructor() {
        this.updateTaskQuery = this.updateTaskQuery.bind(this);
        this.refreshAllQueries = this.refreshAllQueries.bind(this);
    }

    public async initTaskQueryEditor(element: HTMLElement, plugin: any) {

        // Add CSS class for styling
        element.classList.add('task-query-dock');

        // Dock-Container stylen
        element.style.cssText = `
            padding: 16px;
            background: var(--b3-theme-background);
            color: var(--b3-theme-text);
            font-family: var(--b3-font-family);
            height: 100%;
            display: flex;
            flex-direction: column;
            gap: 12px;
            overflow: hidden;
        `;

        // Header
        const header = document.createElement('div');
        header.style.cssText = `
            font-size: 14px;
            font-weight: 600;
            color: var(--b3-theme-text);
            margin-bottom: 8px;
            border-bottom: 1px solid var(--b3-theme-border);
            padding-bottom: 8px;
        `;
        header.textContent = 'Task Query Editor';
        element.appendChild(header);

        // Query Input Section
        const querySection = document.createElement('div');
        querySection.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 8px;
            flex: 1;
        `;

        const queryLabel = document.createElement('label');
        queryLabel.textContent = 'Query String:';
        queryLabel.style.cssText = `
            font-size: 12px;
            font-weight: 500;
            color: var(--b3-theme-text-lighter);
        `;
        querySection.appendChild(queryLabel);

        const queryTextarea = document.createElement('textarea');
        queryTextarea.placeholder = '';
        queryTextarea.style.cssText = `
            width: 100%;
            height: 120px;
            padding: 8px;
            border: 1px solid var(--b3-theme-border);
            border-radius: 4px;
            background: var(--b3-theme-background-light);
            color: var(--b3-theme-text);
            font-family: var(--b3-font-family-code);
            font-size: 12px;
            resize: vertical;
            min-height: 80px;
        `;
        querySection.appendChild(queryTextarea);

        element.appendChild(querySection);


        // Buttons Section
        const buttonsSection = document.createElement('div');
        buttonsSection.style.cssText = `
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
        `;

        // Update Button
        const updateButton = document.createElement('button');
        updateButton.textContent = 'Update Queries';
        updateButton.style.cssText = `
            flex: 1;
            padding: 8px 12px;
            background: var(--b3-theme-primary);
            color: var(--b3-theme-on-primary);
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 500;
            transition: background-color 0.2s;
        `;
        updateButton.addEventListener('click', () => {
            plugin.taskQueryDock.updateTaskQuery(plugin, queryTextarea.value);
        });
        updateButton.addEventListener('mouseenter', () => {
            updateButton.style.background = 'var(--b3-theme-primary-light)';
        });
        updateButton.addEventListener('mouseleave', () => {
            updateButton.style.background = 'var(--b3-theme-primary)';
        });
        buttonsSection.appendChild(updateButton);

        element.appendChild(buttonsSection);

        // Status Section
        const statusSection = document.createElement('div');
        statusSection.style.cssText = `
            margin-top: 12px;
            padding: 8px;
            background: var(--b3-theme-background-light);
            border-radius: 4px;
            border: 1px solid var(--b3-theme-border);
            min-height: 60px;
            max-height: 120px;
            overflow-y: auto;
        `;

        const statusLabel = document.createElement('div');
        statusLabel.textContent = 'Status:';
        statusLabel.style.cssText = `
            font-size: 12px;
            font-weight: 500;
            color: var(--b3-theme-text-lighter);
            margin-bottom: 4px;
        `;
        statusSection.appendChild(statusLabel);

        const statusContent = document.createElement('div');
        statusContent.id = 'task-query-status';
        statusContent.style.cssText = `
            font-size: 11px;
            color: var(--b3-theme-text);
            font-family: var(--b3-font-family-code);
            white-space: pre-wrap;
        `;
        statusContent.textContent = 'Ready to process queries...';
        statusSection.appendChild(statusContent);

        element.appendChild(statusSection);

        // Query Examples Section
        const examplesSection = document.createElement('div');
        examplesSection.style.cssText = `
            margin-top: 8px;
            font-size: 11px;
            color: var(--b3-theme-text-lighter);
            line-height: 1.4;
        `;
        examplesSection.innerHTML = `
            <strong>Examples:</strong><br>
            • <code></code> - Show all tasks<br>
            • <code>status: done</code> - Show only done tasks<br>
            • <code>priority: medium</code> - Show only tasks with priority medium<br>
            • <code>limit: 5</code> - Show only the first 5 tasks<br>
        `;
        element.appendChild(examplesSection);

        this.element = element;

    }

    public async updateTaskQuery(plugin: any, queryString: string) {
        const statusElement = document.getElementById('task-query-status');

        try {        
            this.updateStatus(statusElement, 'Updating task query...', 'info');

            const query = '```tasks\n' + queryString;
            await updateBlock('markdown', query, plugin.taskQueryRenderer.blockId);

            await new Promise(r => setTimeout(r, 200));
            
            await plugin.taskService.refreshTasks();
            plugin.taskQueryRenderer.processQueries(document.body);

            await new Promise(r => setTimeout(r, 200));
            plugin.refreshTaskViews();

            this.updateStatus(statusElement, `Updated query block and refreshed results`, 'success');


        } catch (error) {
            console.error('Error updating task queries:', error);
            this.updateStatus(statusElement, `Error: ${error.message}`, 'error');
        }
    }

    public async refreshAllQueries(plugin: any) {
        const statusElement = document.getElementById('task-query-status');

        try {
            this.updateStatus(statusElement, 'Refreshing all task queries...', 'info');

            if (plugin.taskQueryRenderer) {
                await plugin.taskService.refreshTasks();
                plugin.taskQueryRenderer.processQueries(document.body);
                
                this.updateStatus(statusElement, 'All task queries refreshed successfully', 'success');
            } else {
                this.updateStatus(statusElement, 'Error: TaskQueryRenderer not available', 'error');
            }

        } catch (error) {
            console.error('Error refreshing queries:', error);
            this.updateStatus(statusElement, `Error: ${error.message}`, 'error');
        }
    }

    private async loadCurrentQuery(textarea: HTMLTextAreaElement, blockId: string) {
        const result = await sql(
            `SELECT content FROM blocks WHERE id = '${blockId}'`
        );
        if (result && result.length > 0) {
            textarea.value = result[0].content.trim();
        }
    }

    private updateStatus(statusElement: HTMLElement | null, message: string, type: 'info' | 'success' | 'warning' | 'error') {
        if (!statusElement) return;

        const timestamp = new Date().toLocaleTimeString();
        const colors = {
            info: 'var(--b3-theme-primary)',
            success: '#28a745',
            warning: '#ffc107',
            error: '#dc3545'
        };

        statusElement.style.color = colors[type];
        statusElement.textContent = `[${timestamp}] ${message}`;
    }

    public async updateBlockId(blockId: string) {
        this.blockId = blockId;
        const queryTextarea = this.getQuerytext();
        if (queryTextarea) {
            await this.loadCurrentQuery(queryTextarea, blockId);
        }
    }

    private getQuerytext(): HTMLTextAreaElement | null {        
        return document.body.querySelector('textarea') as HTMLTextAreaElement;
    }
}