import { Task } from '../../types/task';
import { TaskQueryRenderer } from '../TaskQueryRenderer';

export function openTaskEditModal(task: Task, rendererContext: TaskQueryRenderer) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
    `;

    const modal = document.createElement('div');
    modal.style.cssText = `
        background: white;
        border-radius: 12px;
        padding: 24px;
        width: 90%;
        max-width: 500px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    `;

    const title = document.createElement('h3');
    title.textContent = 'Aufgabe bearbeiten';
    title.style.cssText = `
        margin: 0 0 20px 0;
        font-size: 18px;
        color: #202020;
    `;

    const descLabel = document.createElement('label');
    descLabel.textContent = 'Beschreibung:';
    descLabel.style.cssText = `
        display: block;
        margin-bottom: 8px;
        font-weight: 500;
        color: #202020;
    `;

    const descInput = document.createElement('textarea');
    descInput.value = task.description;
    descInput.style.cssText = `
        width: 100%;
        padding: 12px;
        border: 1px solid #e0e6e8;
        border-radius: 6px;
        font-size: 14px;
        font-family: inherit;
        resize: vertical;
        min-height: 80px;
        margin-bottom: 16px;
    `;

    const priorityLabel = document.createElement('label');
    priorityLabel.textContent = 'Priorität:';
    priorityLabel.style.cssText = `
        display: block;
        margin-bottom: 8px;
        font-weight: 500;
        color: #202020;
    `;

    const prioritySelect = document.createElement('select');
    prioritySelect.innerHTML = `
        <option value="">Keine Priorität</option>
        <option value="low">Niedrig</option>
        <option value="medium">Medium</option>
        <option value="high">Hoch</option>
        <option value="urgent">Dringend</option>
    `;
    prioritySelect.value = task.priority || '';
    prioritySelect.style.cssText = `
        width: 100%;
        padding: 12px;
        border: 1px solid #e0e6e8;
        border-radius: 6px;
        font-size: 14px;
        margin-bottom: 16px;
    `;

    const dueDateLabel = document.createElement('label');
    dueDateLabel.textContent = 'Fälligkeitsdatum:';
    dueDateLabel.style.cssText = `
        display: block;
        margin-bottom: 8px;
        font-weight: 500;
        color: #202020;
    `;

    const dueDateInput = document.createElement('input');
    dueDateInput.type = 'date';
    if (task.dueDate) {
        dueDateInput.value = task.dueDate.toISOString().split('T')[0];
    }
    dueDateInput.style.cssText = `
        width: 100%;
        padding: 12px;
        border: 1px solid #e0e6e8;
        border-radius: 6px;
        font-size: 14px;
        margin-bottom: 16px;
    `;

    const tagsLabel = document.createElement('label');
    tagsLabel.textContent = 'Tags (kommagetrennt):';
    tagsLabel.style.cssText = `
        display: block;
        margin-bottom: 8px;
        font-weight: 500;
        color: #202020;
    `;

    const tagsInput = document.createElement('input');
    tagsInput.type = 'text';
    tagsInput.value = task.tags?.join(', ') || '';
    tagsInput.style.cssText = `
        width: 100%;
        padding: 12px;
        border: 1px solid #e0e6e8;
        border-radius: 6px;
        font-size: 14px;
        margin-bottom: 20px;
    `;

    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
        display: flex;
        gap: 12px;
        justify-content: flex-end;
    `;

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Abbrechen';
    cancelBtn.style.cssText = `
        padding: 10px 20px;
        border: 1px solid #e0e6e8;
        border-radius: 6px;
        background: white;
        color: #202020;
        font-size: 14px;
        cursor: pointer;
    `;

    const saveBtn = document.createElement('button');
    saveBtn.textContent = 'Speichern';
    saveBtn.style.cssText = `
        padding: 10px 20px;
        border: none;
        border-radius: 6px;
        background: #dc4c3e;
        color: white;
        font-size: 14px;
        cursor: pointer;
    `;

    cancelBtn.addEventListener('click', () => {
        document.body.removeChild(overlay);
    });

    saveBtn.addEventListener('click', async () => {
        task.description = descInput.value.trim();
        task.priority = prioritySelect.value as any;
        task.dueDate = dueDateInput.value ? new Date(dueDateInput.value) : undefined;
        task.tags = tagsInput.value.split(',').map(tag => tag.trim()).filter(tag => tag);

        try {
            await rendererContext.taskService.updateTask(task);
            rendererContext.refreshCurrentView(rendererContext.currentTasks);
            document.body.removeChild(overlay);
        } catch (error) {
            console.error('Error updating task:', error);
        }
    });

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            document.body.removeChild(overlay);
        }
    });

    modal.appendChild(title);
    modal.appendChild(descLabel);
    modal.appendChild(descInput);
    modal.appendChild(priorityLabel);
    modal.appendChild(prioritySelect);
    modal.appendChild(dueDateLabel);
    modal.appendChild(dueDateInput);
    modal.appendChild(tagsLabel);
    modal.appendChild(tagsInput);

    buttonContainer.appendChild(cancelBtn);
    buttonContainer.appendChild(saveBtn);
    modal.appendChild(buttonContainer);

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    setTimeout(() => descInput.focus(), 100);
}