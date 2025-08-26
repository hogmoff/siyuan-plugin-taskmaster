import { Plugin } from 'siyuan';
import { TaskModal } from './components/tasks/taskModal';
import { TaskQueryResults } from './components/tasks/taskQueryResults';
import { TaskService } from './components/tasks/taskService';
import { showTaskEditor } from './components/tasks/taskEditor';
import { TaskRenderer } from './renderers/TaskRenderer';
import { searchTask } from './components/tasks/taskhelpers';
import { TaskQueryRenderer } from './renderers/TaskQueryRenderer';
import { TaskQueryDock } from './components/TaskQueryDock';
import { reloadUI } from './api';
import './index.scss'

export default class PluginSample extends Plugin {
  private taskService: TaskService
  private renderer: TaskRenderer
  private taskQueryRenderer: TaskQueryRenderer
  private taskQueryResults: TaskQueryResults
  private taskQueryDock: TaskQueryDock;
  // Keep stable references to bound event handlers so we can unregister them correctly
  private boundHandleWsMain: (event: CustomEvent) => void;
  private boundOnLayoutReady: () => void;
  // Debounce set to prevent infinite loops when normalizing editor toggles
  private normalizingBlocks: Set<string> = new Set();

  async onload() {
    this.taskService = new TaskService()
    this.renderer = new TaskRenderer()
    this.taskQueryRenderer = new TaskQueryRenderer(this.app, this.taskService)
    this.taskQueryResults = new TaskQueryResults(this.taskService)
    this.taskQueryDock = new TaskQueryDock();

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
            initTaskQueryEditor: this.taskQueryDock.initTaskQueryEditor
        },
        async init() {
            //@ts-ignore
            await this.data.initTaskQueryEditor(this.element, this.data.plugin);
        }
    });

    // Bind handlers once and register them, so off() can remove the same references
    this.boundHandleWsMain = this.handleWsMain.bind(this)
    this.boundOnLayoutReady = this.onLayoutReady.bind(this)

    this.eventBus.on('ws-main', this.boundHandleWsMain)
    this.eventBus.on('loaded-protyle-static', this.boundOnLayoutReady)
    this.eventBus.on('loaded-protyle-dynamic', this.boundHandleWsMain)
  }

  async onLayoutReady() {
    this.renderer.process(document.body)
    await this.taskQueryRenderer.initialize(this.app)
    this.taskQueryRenderer.processQueries(document.body)
    this.taskService.loadAllTasks();
    await this.taskQueryDock.updateBlockId(this.taskQueryRenderer.blockId);

  }

  onunload() {
    console.log("TaskMaster plugin unloaded")
    // Unregister using the same bound function references
    if (this.boundHandleWsMain) {
      this.eventBus.off('ws-main', this.boundHandleWsMain)
      this.eventBus.off('loaded-protyle-dynamic', this.boundHandleWsMain)
    }
    if (this.boundOnLayoutReady) {
      this.eventBus.off('loaded-protyle-static', this.boundOnLayoutReady)
    }
  }

  private handleWsMain(event: CustomEvent) {

    if (event.detail.cmd === 'transactions') {
      for (const data of event.detail.data) {
        for (const op of data.doOperations) {
          if (typeof op.data === 'string' && op.data.length > 0) {
            const tempDiv = document.createElement('div')
            tempDiv.innerHTML = op.data

            if (op.action === 'update') {
            // Handle task updates and re-render queries
            setTimeout(() => {
              // Refresh both already-rendered containers and any new code blocks
              this.taskQueryRenderer.refreshAll(document.body)
            }, 100)

            // Normalize done-date in Siyuan Editor toggles (idempotent)
            const toggledItems = tempDiv.querySelectorAll('[data-subtype="t"][data-type="NodeListItem"]')
            toggledItems.forEach((item) => {
              const blockId = item.getAttribute('data-node-id')
              if (!blockId) return
              if (this.normalizingBlocks.has(blockId)) return
              this.normalizingBlocks.add(blockId)
              // eslint-disable-next-line @typescript-eslint/no-floating-promises
              this.taskService.normalizeDoneDateForBlock(blockId).finally(() => {
                setTimeout(() => this.normalizingBlocks.delete(blockId), 500)
              })
            })

            // Show Task Editor at any Tasks
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

  public refreshTaskViews() {
    this.taskQueryRenderer.refreshAll(document.body)
    reloadUI();
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
