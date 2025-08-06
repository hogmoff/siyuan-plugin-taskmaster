import { TaskQueryRenderer } from '../TaskQueryRenderer';

export async function processTaskQuery(renderer: TaskQueryRenderer, block: HTMLElement, content: string) {
    try {
        const queryMatch = content.match(/tasks\s*\n?([\s\S]*)/);
        if (!queryMatch) return;

        const queryString = queryMatch[1].trim();

        const allTasks = await renderer.taskService.getAllTasks();
        const filteredTasks = queryString
            ? renderer.taskQueryEngine.filterTasks(allTasks, renderer.taskQueryEngine.parseQueryString(queryString))
            : allTasks;

        const resultContainer = renderer.createTodoContainer(filteredTasks, queryString);
        block.parentNode?.replaceChild(resultContainer, block);

    } catch (error) {
        console.error('Error processing task query:', error);
        renderer.showError(block, error.message);
    }
}

export async function refreshQuery(renderer: TaskQueryRenderer, container: HTMLElement, queryString: string) {
    try {
        container.style.opacity = '0.5';
        renderer.injectSidebarStyles();

        const allTasks = await renderer.taskService.getAllTasks();
        const filteredTasks = queryString
            ? renderer.taskQueryEngine.filterTasks(allTasks, renderer.taskQueryEngine.parseQueryString(queryString))
            : allTasks;

        const newContainer = renderer.createTodoContainer(filteredTasks, queryString);
        container.parentNode?.replaceChild(newContainer, container);

    } catch (error) {
        console.error('Error refreshing task query:', error);
    }
}
