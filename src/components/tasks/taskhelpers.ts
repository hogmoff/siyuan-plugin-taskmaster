
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
