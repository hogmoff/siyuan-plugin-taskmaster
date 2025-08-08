import { TaskQueryResults } from '../components/tasks/taskQueryResults'

export function addTaskQueryPanel(taskQueryResults: TaskQueryResults) {
    const dockPanel = document.createElement('div')
    dockPanel.className = 'dock-panel task-query-panel'
    dockPanel.style.cssText = `
            position: fixed;
            right: 0;
            top: 50%;
            transform: translateY(-50%);
            width: 300px;
            max-height: 70vh;
            background: var(--b3-theme-background);
            border: 1px solid var(--b3-theme-surface-lighter);
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 1000;
            display: none;
            flex-direction: column;
        `

    const header = document.createElement('div')
    header.className = 'task-query-panel-header'
    header.innerHTML = `
            <h4>Tasks</h4>
            <button class="task-query-panel-close">\u00D7</button>
        `

    const content = taskQueryResults.getContainer()
    content.style.flex = '1'
    content.style.overflow = 'auto'

    dockPanel.appendChild(header)
    dockPanel.appendChild(content)

    const toggleBtn = document.createElement('button')
    toggleBtn.className = 'task-query-toggle'
    toggleBtn.innerHTML = '📋'
    toggleBtn.style.cssText = `
            position: fixed;
            right: 10px;
            top: 50%;
            transform: translateY(-50%);
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: var(--b3-theme-primary);
            color: white;
            border: none;
            cursor: pointer;
            font-size: 18px;
            z-index: 1001;
        `

    toggleBtn.addEventListener('click', () => {
        const isVisible = dockPanel.style.display === 'flex'
        dockPanel.style.display = isVisible ? 'none' : 'flex'
        if (!isVisible) {
            taskQueryResults.initialize()
        }
    })

    const closeBtn = header.querySelector('.task-query-panel-close')
    closeBtn?.addEventListener('click', () => {
        dockPanel.style.display = 'none'
    })

    document.body.appendChild(toggleBtn)
    document.body.appendChild(dockPanel)

}