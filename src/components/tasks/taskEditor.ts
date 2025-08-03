import { updateBlock } from '../../api'
import {
  hasDueDate,
  hasPrioData,
  hasScheduledDate,
  hasStartDate,
  getDateEmoji,
  getPriorityEmoji,
} from '../tasks/taskhelpers'

export function showTaskEditor(element: HTMLElement, blockId: string, content: string) {
    element.classList.add('taskmaster-processing')
    const rect = element.getBoundingClientRect()
    const popup = document.createElement('div')
    popup.className = 'task-editor-popup'
    popup.style.cssText = `
            position: absolute;
            top: ${rect.bottom}px;
            left: ${rect.left}px;
            background: var(--b3-theme-background);
            border: 1px solid var(--b3-theme-surface-lighter);
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
            z-index: 1000;
            padding: 8px;
        `
    let options: any[] = [];
    if (!hasDueDate(content)) {
        options.push(
        {        
            label: '📅 due date',
            type: 'date',
        });
    }
    if (!hasStartDate(content)){
        options.push(
            {        
            label: '🛫 start date',
            type: 'date',
        });
    }
    if (!hasScheduledDate(content)){
        options.push(
            {        
            label: '⏳ scheduled date',
            type: 'date',
        });
    }
    if (!hasPrioData(content)) {
        options.push(
        {        
            label: '⏫ high',
            type: 'priority',
            value: 'high',
        });
        options.push(
        {        
            label: '🔼 medium',
            type: 'priority',
            value: 'medium',
        });
    }

    const closePopup = (e?: Event) => {
      if (e && popup.contains(e.target as Node)) {
        return
      }
      popup.remove()
      element.classList.remove('taskmaster-processing')
      document.removeEventListener('click', closePopup)
    }

    // remove '- [ ]' at beginning and remove space at the end
    content = content.replace(/^- \\[ \\]/, '');
    content = content.trim();
    console.log("Content", content)

    options.forEach((option) => {
      const item = document.createElement('div')
      item.className = 'task-editor-item'
      item.textContent = option.label
      item.onclick = () => {
        if (option.type === 'date') {
          showDateSelector(item, (date) => {
            updateTask(blockId, ` ${content} ${getDateEmoji(option.label)} ${date}`)
            closePopup()
          })
        } else {
          updateTask(blockId, ` ${content} ${getPriorityEmoji(option.value)}`)
          closePopup()
        }
      }
      popup.appendChild(item)
    })

    document.body.appendChild(popup)
    setTimeout(() => document.addEventListener('click', closePopup), 0)
  }

async function updateTask(blockId: string, text: string) {
  await updateBlock('markdown', text, blockId)
}

function showDateSelector(parent: HTMLElement, onSelect: (date: string) => void) {
    const dateSelector = document.createElement('div')
    dateSelector.className = 'date-selector-popup'

    const today = new Date()
    for (let i = 0; i < 5; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      const dateItem = document.createElement('div')
      dateItem.className = 'date-selector-item'
      dateItem.textContent = date.toISOString().split('T')[0]
      dateItem.onclick = () => {
        onSelect(dateItem.textContent)
        dateSelector.remove()
      }
      dateSelector.appendChild(dateItem)
    }

    const manualEntry = document.createElement('input')
    manualEntry.type = 'date'
    manualEntry.onchange = () => {
      onSelect(manualEntry.value)
      dateSelector.remove()
    }
    dateSelector.appendChild(manualEntry)

    parent.appendChild(dateSelector)
}
