const TIME_SYNC_ENDPOINT = 'https://worldtimeapi.org/api/ip'
const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // 1 second
const SYNC_THRESHOLD = 5000 // 5 seconds

interface TimeResponse {
  datetime: string
  unixtime: number
}

let lastSyncTime: number | null = null
let timeOffset: number = 0
let syncInProgress: Promise<number> | null = null

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const fetchWithTimeout = async (
  url: string,
  timeout: number = 5000
): Promise<Response> => {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, { signal: controller.signal })
    clearTimeout(id)
    return response
  } catch (error) {
    clearTimeout(id)
    throw error
  }
}

async function fetchServerTime(attempt: number = 0): Promise<TimeResponse> {
  try {
    const response = await fetchWithTimeout(TIME_SYNC_ENDPOINT)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    if (attempt < MAX_RETRIES) {
      await delay(RETRY_DELAY * Math.pow(2, attempt))
      return fetchServerTime(attempt + 1)
    }
    throw error
  }
}

export async function syncWithServerTime(): Promise<number> {
  // 如果已经有同步在进行中，返回该Promise
  if (syncInProgress) {
    return syncInProgress
  }

  // 如果上次同步时间在阈值内，直接返回已知的时间偏移
  if (lastSyncTime && Date.now() - lastSyncTime < SYNC_THRESHOLD) {
    return timeOffset
  }

  try {
    // 创建新的同步Promise
    syncInProgress = (async () => {
      const beforeRequest = Date.now()
      const serverTime = await fetchServerTime()
      const afterRequest = Date.now()
      const requestTime = afterRequest - beforeRequest

      // 如果请求时间太长，可能不够准确，重试
      if (requestTime > SYNC_THRESHOLD) {
        return syncWithServerTime()
      }

      const serverTimestamp = serverTime.unixtime * 1000
      const localTimestamp = (beforeRequest + afterRequest) / 2
      timeOffset = serverTimestamp - localTimestamp
      lastSyncTime = Date.now()

      return timeOffset
    })()

    return await syncInProgress
  } catch (error) {
    console.error('Error syncing time:', error)
    return timeOffset || 0
  } finally {
    syncInProgress = null
  }
}

let periodicSyncInterval: ReturnType<typeof setInterval> | null = null

export function getAdjustedTime(): number {
  return Date.now() + (timeOffset || 0)
}

export function startPeriodicSync(interval: number = 60 * 60 * 1000): () => void {
  // 确保只有一个定期同步在运行
  stopPeriodicSync()

  // 立即进行一次同步
  syncWithServerTime().catch((error) => {
    console.error('Initial time sync failed:', error)
  })

  periodicSyncInterval = setInterval(async () => {
    try {
      await syncWithServerTime()
    } catch (error) {
      console.error('Periodic time sync failed:', error)
    }
  }, interval)

  return stopPeriodicSync
}

export function stopPeriodicSync(): void {
  if (periodicSyncInterval) {
    clearInterval(periodicSyncInterval)
    periodicSyncInterval = null
  }
}

// 导出用于测试的内部状态
export const __timeServiceInternals = {
  timeOffset,
  lastSyncTime,
  resetState: () => {
    timeOffset = 0
    lastSyncTime = null
    stopPeriodicSync()
  },
}
