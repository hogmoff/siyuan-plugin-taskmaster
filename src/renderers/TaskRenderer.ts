import { parseSiyuanDate, getRelativeDateString } from '../utils/dateUtils';

/**
 * Renderer für einzelne Task-Elemente in Siyuan
 */
export class TaskRenderer {
    /**
     * Verarbeitet ein HTML-Element und fügt Task-Indikatoren hinzu
     * @param element - Das zu verarbeitende HTML-Element
     */
    public process(element: HTMLElement) {
        const taskItems = element.querySelectorAll('div[data-type="NodeListItem"][data-subtype="t"]') as NodeListOf<HTMLElement>;
        
        taskItems.forEach((taskNode: HTMLElement) => {
            // Entferne vorhandene Indikatoren
            taskNode.querySelectorAll('.task-master-priority, .task-master-duedate').forEach(el => el.remove());
            
            const priority = taskNode.getAttribute('custom-task-priority');
            const dueDateStr = taskNode.getAttribute('custom-handle-time');
            
            // Prioritäts-Icon hinzufügen
            if (priority) {
                const priorityIcon = document.createElement('span');
                priorityIcon.className = 'task-master-priority';
                priorityIcon.style.marginRight = '4px';
                
                switch (priority) {
                    case 'high':
                        priorityIcon.textContent = '🔴';
                        break;
                    case 'medium':
                        priorityIcon.textContent = '🟡';
                        break;
                    case 'low':
                        priorityIcon.textContent = '🔵';
                        break;
                }
                taskNode.insertBefore(priorityIcon, taskNode.firstChild);
            }
            
            // Fälligkeitsdatum hinzufügen
            if (dueDateStr) {
                const dueDate = parseSiyuanDate(dueDateStr);
                if (dueDate) {
                    const dateInfo = getRelativeDateString(dueDate);
                    const dateSpan = document.createElement('span');
                    dateSpan.className = 'task-master-duedate';
                    dateSpan.style.cssText = `
                        margin-left: 8px;
                        font-size: 12px;
                        color: ${dateInfo.isOverdue ? '#e74c3c' : '#3498db'};
                    `;
                    dateSpan.textContent = dateInfo.text;
                    taskNode.appendChild(dateSpan);
                }
            }
        });
    }
}