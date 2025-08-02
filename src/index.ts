import { Plugin } from 'siyuan'
import {
  hasDueDate,
  hasPrioData,
  hasScheduledDate,
  hasStartDate,
  hasTaskData,
} from './components/tasks/taskhelpers'
import { TaskRenderer } from './renderer'
import { TaskModal } from './taskModal'
import { TaskQueryResults } from './taskQueryResults'
import { TaskService } from './taskService'
import { showTaskEditor } from './components/tasks/taskEditor'
import './index.scss'

export default class PluginSample extends Plugin {
  private taskService: TaskService
  private renderer: TaskRenderer
  private taskQueryResults: TaskQueryResults

  onload() {
    this.taskService = new TaskService()
    this.renderer = new TaskRenderer()
    this.taskQueryResults = new TaskQueryResults(this.taskService)

    console.log("TaskMaster plugin loaded successfully")

    this.addMenu()
    this.addCommands()

    this.eventBus.on('ws-main', this.handleWsMain.bind(this))
  }

  onLayoutReady() {
    this.renderer.process(document.body)
    this.taskService.loadAllTasks()
    this.addTaskQueryPanel()
  }

  onunload() {
    console.log("TaskMaster plugin unloaded")
    this.eventBus.off('ws-main', this.handleWsMain.bind(this))
  }

  private handleWsMain(event: CustomEvent) {
    if (event.detail.cmd === 'transactions') {
      for (const data of event.detail.data) {
        for (const op of data.doOperations) {
          if (op.action === 'update') {
            const tempDiv = document.createElement('div')
            tempDiv.innerHTML = op.data
            const listItems = tempDiv.querySelectorAll('[data-subtype="t"][data-type="NodeListItem"]')
            listItems.forEach((item) => {
              const content = item.querySelector('[contenteditable="true"]')
              console.log(content);
              if (content && (content.textContent === '' || content.textContent === '\u200B')) {
                const blockId = item.getAttribute('data-node-id')
                if (blockId) {
                  const element = document.querySelector(`[data-node-id="${blockId}"]`)
                  if (element && !element.classList.contains('taskmaster-processing')) {
                    const txt = content.textContent;
                    showTaskEditor(element as HTMLElement, blockId, 
                        hasDueDate(txt),
                        hasStartDate(txt),
                        hasScheduledDate(txt),
                        hasPrioData(txt))
                  }
                }
              }
            })
          }
        }
      }
    }
  }

  private addMenu() {
    this.addCommand({
      langKey: 'taskMaster',
      hotkey: '',
      callback: () => {
        this.openTaskMaster()
      },
    })

    document.addEventListener('contextmenu', (e) => {
      const selection = window.getSelection()?.toString()
      if (selection) {
        this.showContextMenu(e, selection)
      }
    })
  }

  private addCommands() {
    this.addCommand({
      langKey: 'openTaskQuery',
      hotkey: 'Ctrl+Shift+T',
      callback: () => {
        this.openTaskQuery()
      },
    })

    this.addCommand({
      langKey: 'createNewTask',
      hotkey: 'Ctrl+Alt+T',
      callback: () => {
        this.createNewTask()
      },
    })

    this.addCommand({
      langKey: 'showOverdueTasks',
      hotkey: 'Ctrl+Shift+O',
      callback: () => {
        this.showOverdueTasks()
      },
    })

    this.addCommand({
      langKey: 'showTodaysTasks',
      hotkey: 'Ctrl+Shift+D',
      callback: () => {
        this.showTodaysTasks()
      },
    })
  }

  private addTaskQueryPanel() {
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

    const content = this.taskQueryResults.getContainer()
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
        this.taskQueryResults.initialize()
      }
    })

    const closeBtn = header.querySelector('.task-query-panel-close')
    closeBtn?.addEventListener('click', () => {
      dockPanel.style.display = 'none'
    })

    document.body.appendChild(toggleBtn)
    document.body.appendChild(dockPanel)
  }

  private openTaskMaster() {
    const modal = new TaskModal({
      onSave: async (task) => {
        await this.taskService.createTask(task)
        this.taskQueryResults.initialize()
      },
    })
    modal.open()
  }

  private openTaskQuery() {
    const queryPanel = document.querySelector('.task-query-panel') as HTMLElement
    if (queryPanel) {
      queryPanel.style.display = 'flex'
      this.taskQueryResults.initialize()
    }
  }

  private createNewTask() {
    const modal = new TaskModal({
      onSave: async (newTask) => {
        await this.taskService.createTask(newTask)
        this.taskQueryResults.initialize()
      },
    })
    modal.open()
  }

  private async showOverdueTasks() {
    const overdueTasks = await this.taskService.getOverdueTasks()
    this.showTaskList('Overdue Tasks', overdueTasks)
  }

  private async showTodaysTasks() {
    const todaysTasks = await this.taskService.getTasksDueToday()
    this.showTaskList("Today's Tasks", todaysTasks)
  }

  private showTaskList(title: string, tasks: any[]) {
    const modal = document.createElement('div')
    modal.className = 'task-list-modal'
    modal.innerHTML = `
            <div class="task-list-content">
                <div class="task-list-header">
                    <h3>${title}</h3>
                    <button class="task-list-close">\u00D7</button>
                </div>
                <div class="task-list-body">
                    ${tasks.length === 0
                        ? '<p>No tasks found</p>'
                        : tasks.map((task) => `
                            <div class="task-list-item">
                                <input type="checkbox" ${task.status === 'done' ? 'checked' : ''}>
                                <span class="task-desc">${this.escapeHtml(task.description)}</span>
                                ${task.dueDate ? `<span class="task-due">📅 ${new Date(task.dueDate).toLocaleDateString()}</span>` : ''}
                            </div>
                        `).join('')
                    }
                </div>
            </div>
        `

    modal.querySelector('.task-list-close')?.addEventListener('click', () => modal.remove())
    document.body.appendChild(modal)
  }

  private showContextMenu(event: MouseEvent, selectedText: string) {
    const menu = document.createElement('div')
    menu.className = 'context-menu'
    menu.style.cssText = `
            position: fixed;
            left: ${event.clientX}px;
            top: ${event.clientY}px;
            background: var(--b3-theme-background);
            border: 1px solid var(--b3-theme-surface-lighter);
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
            z-index: 1000;
            padding: 4px 0;
        `

    const createTaskItem = document.createElement('div')
    createTaskItem.textContent = 'Create Task from Selection'
    createTaskItem.style.cssText = `
            padding: 8px 12px;
            cursor: pointer;
            font-size: 14px;
        `
    createTaskItem.addEventListener('click', () => {
      const modal = new TaskModal({
        onSave: async (task) => {
          task.description = selectedText
          await this.taskService.createTask(task)
          this.taskQueryResults.initialize()
        },
      })
      modal.open()
      menu.remove()
    })

    menu.appendChild(createTaskItem)
    document.body.appendChild(menu)

    const closeMenu = (e: Event) => {
      if (!menu.contains(e.target as Node)) {
        menu.remove()
        document.removeEventListener('click', closeMenu)
      }
    }
    setTimeout(() => document.addEventListener('click', closeMenu), 0)
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  openSetting() {
    const modal = new TaskModal({
      onSave: async (task) => {
        await this.taskService.createTask(task)
        this.taskQueryResults.initialize()
      },
    })
    modal.open()
  }
}
