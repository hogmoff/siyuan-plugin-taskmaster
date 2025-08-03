
export function hasDueDate(text: string): boolean {
  const dateEmojis = ['📅']
  return dateEmojis.some((emoji) => text.includes(emoji))
}

export function hasStartDate(text: string): boolean {
  const dateEmojis = ['🛫']
  return dateEmojis.some((emoji) => text.includes(emoji))
}

export function hasScheduledDate(text: string): boolean {
  const dateEmojis = ['⏳']
  return dateEmojis.some((emoji) => text.includes(emoji))
}

export function hasPrioData(text: string): boolean {
  const priorityEmojis = ['⏫', '🔼']
  return priorityEmojis.some((emoji) => text.includes(emoji))
}

export function hasTaskData(text: string): boolean {
  return hasDueDate(text) && hasPrioData(text) && hasPrioData(text) && hasPrioData(text)
}

export function searchTask(blockId: string): string | null {
  const listItems = Array.from(document.querySelectorAll('[data-subtype="t"][data-type="NodeListItem"]'))
  
  const foundItem = listItems.find((item) => {
    const rootId = item.getAttribute('data-node-id')
    const paragraphElement = item.querySelector('[data-type="NodeParagraph"]')
    
    if (rootId && paragraphElement) {
      const blockId2 = paragraphElement.getAttribute('data-node-id')
      return blockId === blockId2
    }
    return false
  })
  
  return foundItem ? foundItem.getAttribute('data-node-id') : null
}

export function getDateEmoji(dateType: string): string {
    switch (dateType) {
      case '📅 due date': return '📅'
      case '🛫 start date': return '🛫'
      case '⏳ scheduled date': return '⏳'
      default: return '📅'
    }
}

export function getPriorityEmoji(priority: string): string {
    switch (priority) {
      case 'high': return '⏫'
      case 'medium': return '🔼'
      default: return ''
    }
}