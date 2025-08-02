// src/renderer.ts

/**
 * Konvertiert einen Siyuan-Datumsstring in ein Date-Objekt.
 * @param siyuanDate String im Format 'YYYYMMDDHHmmss'
 */
function parseSiyuanDate(siyuanDate: string): Date | null {
    if (!siyuanDate || siyuanDate.length < 8) return null;
    const year = parseInt(siyuanDate.substring(0, 4), 10);
    const month = parseInt(siyuanDate.substring(4, 6), 10) - 1; // Monate sind 0-indiziert
    const day = parseInt(siyuanDate.substring(6, 8), 10);
    const hour = parseInt(siyuanDate.substring(8, 10) || '0', 10);
    const minute = parseInt(siyuanDate.substring(10, 12) || '0', 10);
    return new Date(year, month, day, hour, minute);
}

/**
 * Berechnet einen relativen Datumsstring (z.B. "heute", "morgen").
 * @param date Das Zieldatum
 */
function getRelativeDateString(date: Date): { text: string; isOverdue: boolean } {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const targetDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const diffTime = targetDay.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const isOverdue = diffDays < 0;

    if (diffDays === 0) return { text: "heute", isOverdue: false };
    if (diffDays === 1) return { text: "morgen", isOverdue: false };
    if (diffDays === -1) return { text: "gestern", isOverdue: true };
    if (diffDays > 1) return { text: `in ${diffDays} Tagen`, isOverdue: false };
    return { text: `vor ${Math.abs(diffDays)} Tagen`, isOverdue: true };
}


export class TaskRenderer {
    public process(element: HTMLElement) {
        const taskItems = element.querySelectorAll('div[data-type="NodeListItem"][data-subtype="t"]');

        taskItems.forEach((taskNode: HTMLElement) => {
            // Alte, von uns erstellte Elemente entfernen, um Duplikate zu vermeiden
            taskNode.querySelectorAll('.task-master-priority, .task-master-duedate').forEach(el => el.remove());

            const priority = taskNode.getAttribute('custom-task-priority');
            const dueDateAttr = taskNode.getAttribute('custom-handle-time');
            const contentContainer = taskNode.querySelector('.protyle-list-item__content');

            if (!contentContainer) return;

            // 1. Prioritäts-Icon hinzufügen
            if (priority && priority !== 'p4') {
                const priorityIcon = document.createElement('span');
                priorityIcon.className = 'task-master-priority';
                if (priority === 'p1') priorityIcon.innerHTML = '🚩';
                if (priority === 'p2') priorityIcon.innerHTML = '🟧';
                if (priority === 'p3') priorityIcon.innerHTML = '🟦';
                contentContainer.prepend(priorityIcon);
            }

            // 2. Fälligkeitsdatum hinzufügen
            if (dueDateAttr) {
                const dueDate = parseSiyuanDate(dueDateAttr);
                if (dueDate) {
                    const { text, isOverdue } = getRelativeDateString(dueDate);
                    const dateSpan = document.createElement('span');
                    dateSpan.className = 'task-master-duedate';
                    if (isOverdue) {
                        dateSpan.classList.add('overdue');
                    }
                    dateSpan.innerText = text;
                    contentContainer.appendChild(dateSpan);
                }
            }
        });
    }
}