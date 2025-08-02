export function parseSiyuanDate(siyuanDate: string): Date | null {
    if (!siyuanDate || siyuanDate.length < 14) return null;
    
    const year = parseInt(siyuanDate.substring(0, 4));
    const month = parseInt(siyuanDate.substring(4, 6)) - 1;
    const day = parseInt(siyuanDate.substring(6, 8));
    const hour = parseInt(siyuanDate.substring(8, 10));
    const minute = parseInt(siyuanDate.substring(10, 12));
    const second = parseInt(siyuanDate.substring(12, 14));
    
    const date = new Date(year, month, day, hour, minute, second);
    return isNaN(date.getTime()) ? null : date;
}

export function getRelativeDateString(date: Date): { text: string; isOverdue: boolean } {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return { text: "heute", isOverdue: false };
    if (diffDays === 1) return { text: "morgen", isOverdue: false };
    if (diffDays === -1) return { text: "gestern", isOverdue: true };
    if (diffDays > 1) return { text: `in ${diffDays} Tagen`, isOverdue: false };
    return { text: `vor ${Math.abs(diffDays)} Tagen`, isOverdue: true };
}

export class TaskRenderer {
    public process(element: HTMLElement) {
        const taskItems = element.querySelectorAll('div[data-type="NodeListItem"][data-subtype="t"]') as NodeListOf<HTMLElement>;
        
        taskItems.forEach((taskNode: HTMLElement) => {
            taskNode.querySelectorAll('.task-master-priority, .task-master-duedate').forEach(el => el.remove());
            
            const priority = taskNode.getAttribute('custom-task-priority');
            const dueDateStr = taskNode.getAttribute('custom-handle-time');
            
            if (priority) {
                const priorityIcon = document.createElement('span');
                priorityIcon.className = 'task-master-priority';
                priorityIcon.style.marginRight = '4px';
                
                switch (priority) {
                    case 'urgent':
                        priorityIcon.textContent = '🚩';
                        break;
                    case 'high':
                        priorityIcon.textContent = '🟧';
                        break;
                    case 'medium':
                        priorityIcon.textContent = '🟨';
                        break;
                    case 'low':
                        priorityIcon.textContent = '🟦';
                        break;
                }
                
                const contentElement = taskNode.querySelector('.li-content');
                if (contentElement) {
                    contentElement.insertBefore(priorityIcon, contentElement.firstChild);
                }
            }
            
            if (dueDateStr) {
                const dueDate = parseSiyuanDate(dueDateStr);
                if (dueDate) {
                    const dateInfo = getRelativeDateString(dueDate);
                    const dateElement = document.createElement('span');
                    dateElement.className = 'task-master-duedate';
                    dateElement.style.marginLeft = '8px';
                    dateElement.style.fontSize = '0.9em';
                    dateElement.style.color = dateInfo.isOverdue ? '#ff4444' : '#666';
                    dateElement.textContent = dateInfo.text;
                    
                    if (dateInfo.isOverdue) {
                        dateElement.style.fontWeight = 'bold';
                    }
                    
                    const contentElement = taskNode.querySelector('.li-content');
                    if (contentElement) {
                        contentElement.appendChild(dateElement);
                    }
                }
            }
        });
    }
}