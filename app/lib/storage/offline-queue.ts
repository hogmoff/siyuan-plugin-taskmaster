import { LocalStorageManager } from './local-storage'

type OperationType = 'insert' | 'update' | 'delete'

export interface OfflineOperation {
  id: string
  type: OperationType
  payload: any
  createdAt: number
}

const QUEUE_KEY = 'siyuan_todoist_queue'

function loadQueue(): OfflineOperation[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveQueue(queue: OfflineOperation[]) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
  } catch (e) {
    console.warn('Failed to persist offline queue', e)
  }
}

export const OfflineQueue = {
  enqueue(op: Omit<OfflineOperation, 'id' | 'createdAt'> & { id?: string }) {
    const queue = loadQueue()
    const id = op.id || `${Date.now()}_${Math.random()}`
    const entry: OfflineOperation = { id, createdAt: Date.now(), type: op.type, payload: op.payload }
    queue.push(entry)
    saveQueue(queue)
    return entry
  },

  peek(): OfflineOperation[] {
    return loadQueue()
  },

  clear() {
    saveQueue([])
  },

  async flush(client: { insertTaskBlock: Function; updateTaskBlock: Function; deleteTaskBlock: Function }, onChange?: (change: any) => void) {
    const queue = loadQueue()
    if (queue.length === 0) return { processed: 0 }
    let processed = 0
    const remaining: OfflineOperation[] = []
    for (const op of queue) {
      try {
        switch (op.type) {
          case 'insert': {
            const { markdown, tempId, parentId } = op.payload || {}
            const blockId = await client.insertTaskBlock(parentId || '', markdown)
            if (blockId && onChange) onChange({ type: 'insert', tempId, blockId })
            break
          }
          case 'update': {
            const { blockId, markdown } = op.payload || {}
            if (blockId) await client.updateTaskBlock(blockId, markdown)
            break
          }
          case 'delete': {
            const { blockId } = op.payload || {}
            if (blockId) await client.deleteTaskBlock(blockId)
            break
          }
          default:
            break
        }
        processed += 1
      } catch (e) {
        // Keep operation for next attempt
        remaining.push(op)
      }
    }
    saveQueue(remaining)
    return { processed, remaining: remaining.length }
  },
}

export default OfflineQueue

