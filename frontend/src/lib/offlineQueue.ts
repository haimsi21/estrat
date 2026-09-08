// frontend/src/lib/offlineQueue.ts
export interface PendingItem {
  id: string
  type: 'BITACORA' | string
  data: any
  timestamp: number
}

const STORAGE_KEY = 'holding_offline_queue'

export function getQueue(): PendingItem[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function saveToQueue(item: PendingItem): void {
  const queue = getQueue()
  queue.push(item)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue))
}

export function clearQueue(): void {
  localStorage.removeItem(STORAGE_KEY)
}

export async function syncOfflineQueue(): Promise<number> {
  const queue = getQueue()
  if (queue.length === 0) return 0

  let syncedCount = 0
  const remainingQueue: PendingItem[] = []
  const { api } = await import('./api')

  for (const item of queue) {
    try {
      if (item.type === 'BITACORA') {
        await api.post('/obra/bitacoras/', item.data)
        syncedCount++
      }
    } catch (err) {
      console.error('Error sincronizando item:', item, err)
      remainingQueue.push(item)
    }
  }

  if (remainingQueue.length > 0) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(remainingQueue))
  } else {
    clearQueue()
  }

  return syncedCount
}
