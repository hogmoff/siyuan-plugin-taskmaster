import { TaskQueryRenderer } from '../TaskQueryRenderer';

export async function processTaskQuery(renderer: TaskQueryRenderer, block: HTMLElement, content: string) {
    try {
        const queryMatch = content.match(/tasks\s*\n?([\s\S]*)/);
        if (!queryMatch) return;

        const queryString = queryMatch[1].trim();
        const cleanQueryString = queryString.replace(/\u200B/g, '').replace(/\uFEFF/g, '');

        const allTasks = await renderer.taskService.getAllTasks();
        const filteredTasks = cleanQueryString
            ? renderer.taskQueryEngine.filterTasks(allTasks, renderer.taskQueryEngine.parseQueryString(cleanQueryString))
            : allTasks;

        const resultContainer = renderer.createTodoContainer(filteredTasks, cleanQueryString);
        block.parentNode?.replaceChild(resultContainer, block);

    } catch (error) {
        console.error('Error processing task query:', error);
        renderer.showError(block, error.message);
    }
}

export async function refreshQuery(rendererContext: TaskQueryRenderer, container: HTMLElement, queryString: string) {
    try {
        const content = container.querySelector('.task-content') as HTMLElement;
        if (content) {
            content.innerHTML = '<div style="padding: 20px; text-align: center; color: #666;">Lade...</div>';
        }

        const tasks = await rendererContext.taskService.getTasksByQueryString(queryString);
        console.log('Tasks fetched successfully:', tasks);
        rendererContext.currentTasks = tasks;        
        await rendererContext.refreshCurrentView();
        
    } catch (error) {
        console.error('Fehler beim Aktualisieren der Tasks:', error);
        
        // Zeige Fehler an
        const content = container.querySelector('.task-content') as HTMLElement;
        if (content) {
            content.innerHTML = `
                <div style="padding: 20px; text-align: center; color: #e74c3c;">
                    <strong>Fehler beim Laden der Tasks:</strong><br>
                    ${error.message || 'Unbekannter Fehler'}
                </div>
            `;
        }
    }
}
