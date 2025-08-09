import { Plugin } from 'siyuan'
import { TaskModal } from './components/tasks/taskModal'
import { TaskQueryResults } from './components/tasks/taskQueryResults'
import { TaskService } from './components/tasks/taskService'
import { showTaskEditor } from './components/tasks/taskEditor'
import { searchTask } from './components/tasks/taskhelpers'
import { TaskRenderer } from './renderers/TaskRenderer';
import { TaskQueryRenderer } from './renderers/TaskQueryRenderer';
import { initTaskQueryEditor } from './components/TaskQueryDock'
import './index.scss'

export default class PluginSample extends Plugin {
  private taskService: TaskService
  private renderer: TaskRenderer
  private taskQueryRenderer: TaskQueryRenderer
  private taskQueryResults: TaskQueryResults
  private renderingEnabled: boolean = true

  onload() {
    this.taskService = new TaskService()
    this.renderer = new TaskRenderer()
    this.taskQueryRenderer = new TaskQueryRenderer(this.taskService)
    this.taskQueryRenderer.isEnabled = this.renderingEnabled
    this.taskQueryResults = new TaskQueryResults(this.taskService)

    console.log("TaskMaster plugin loaded successfully")

    this.addMenu()
    this.addCommands()

        this.addDock({
        type: 'task-query-editor',
        config: {
            position: 'RightBottom',
            size: {
                width: 350,
                height: 400,
            },
            icon: 'iconEdit',
            title: 'Task Query Editor'
        },
        data: {
            plugin: this,
            initTaskQueryEditor: initTaskQueryEditor
        },
        async init() {
            //@ts-ignore
            await this.data.initTaskQueryEditor(this.element, this.data.plugin);
        }
    });

    this.eventBus.on('ws-main', this.handleWsMain.bind(this))
    this.eventBus.on('loaded-protyle-static', this.onLayoutReady.bind(this))
  }

  async onLayoutReady() {
    this.renderer.process(document.body)
    await this.taskQueryRenderer.initialize()
    this.taskQueryRenderer.processQueries(document.body)
    this.taskService.loadAllTasks();
    //addTaskQueryPanel(this.taskQueryResults)

    // Make services available to the dock
    (this as any).taskQueryRenderer = this.taskQueryRenderer;
    (this as any).taskService = this.taskService;

  }

  onunload() {
    console.log("TaskMaster plugin unloaded")
    this.eventBus.off('ws-main', this.handleWsMain.bind(this))
    this.eventBus.off('loaded-protyle-static', this.onLayoutReady.bind(this))
  }

  private handleWsMain(event: CustomEvent) {

    if (event.detail.cmd === 'transactions') {
      for (const data of event.detail.data) {
        for (const op of data.doOperations) {
          if (op.action === 'update') {
            const tempDiv = document.createElement('div')
            tempDiv.innerHTML = op.data

            // Handle task updates and re-render queries
            setTimeout(() => {
              this.taskQueryRenderer.processQueries(document.body)
            }, 100)

            const listItems = tempDiv.querySelectorAll('[data-subtype="t"][data-type="NodeListItem"]')
            listItems.forEach((item) => {
              const content = item.querySelector('[contenteditable="true"]')
              if (content && content.textContent.length > 1 && content.textContent[-1] === ' ') {
                const blockId = item.getAttribute('data-node-id')
                if (blockId) {
                  const element = document.querySelector(`[data-node-id="${blockId}"]`)
                  if (element && !element.classList.contains('taskmaster-processing')) {
                    const txt = content.textContent;
                    showTaskEditor(element as HTMLElement, blockId, txt);
                    return;
                  }
                }
              }
            })
            const listItems2 = tempDiv.querySelectorAll('[data-type="NodeParagraph"]')
            listItems2.forEach((item) => {
              const content2 = item.textContent;
              // Last character is zero-width space ignore it, look to space at second last char
              if (content2 && content2.trim().length > 1 && content2.charCodeAt(content2.length - 2) === 32) {
                const blockId = item.getAttribute('data-node-id')
                if (blockId) {
                  const rootId = searchTask(blockId);
                  const element = document.querySelector(`[data-node-id="${rootId}"]`)
                  showTaskEditor(element as HTMLElement, blockId, content2);
                }
              }
            })
          }
        }
      }
    }
  }

  private addMenu() {
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

  }

  private openTaskQuery() {
    const queryPanel = document.querySelector('.task-query-panel') as HTMLElement
    if (queryPanel) {
      queryPanel.style.display = 'flex'
      this.taskQueryResults.initialize()
    }
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
