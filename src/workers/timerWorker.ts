let interval: ReturnType<typeof setInterval> | null = null
let timeLeft: number = 0
let isActive: boolean = false
let lastTickTime: number = 0
let heartbeatCheck: ReturnType<typeof setInterval> | null = null
let lastHeartbeat = Date.now()

const TICK_INTERVAL = 1000 // 1 second
const MAX_TICK_DRIFT = 100 // 100ms
const HEARTBEAT_INTERVAL = 5000 // 5秒
const HEARTBEAT_TIMEOUT = 10000 // 10秒

const cleanup = () => {
  if (interval) {
    clearInterval(interval)
    interval = null
  }
  if (heartbeatCheck) {
    clearInterval(heartbeatCheck)
    heartbeatCheck = null
  }
  isActive = false
  lastTickTime = 0
  lastHeartbeat = Date.now()
}

const validateDuration = (duration: number): number => {
  if (typeof duration !== 'number' || isNaN(duration) || duration < 0) {
    throw new Error('Invalid duration')
  }
  return Math.floor(duration) // 确保是整数
}

const handleTick = () => {
  const now = Date.now()
  if (lastTickTime === 0) {
    lastTickTime = now
  }

  // 检查是否有严重的时间偏移
  const actualInterval = now - lastTickTime
  if (Math.abs(actualInterval - TICK_INTERVAL) > MAX_TICK_DRIFT) {
    // 如果偏移太大，调整剩余时间
    const missedTicks = Math.floor(actualInterval / TICK_INTERVAL)
    timeLeft = Math.max(0, timeLeft - missedTicks)
  } else {
    timeLeft = Math.max(0, timeLeft - 1)
  }

  lastTickTime = now
  self.postMessage({ timeLeft })

  if (timeLeft <= 0) {
    cleanup()
    self.postMessage({ action: 'complete' })
  }
}

self.onmessage = (e: MessageEvent) => {
  try {
    if (!e.data || typeof e.data.action !== 'string') {
      throw new Error('Invalid message format')
    }

    switch (e.data.action) {
      case 'start':
        if (isActive) {
          cleanup() // 如果已经在运行，先清理
        }
        timeLeft = validateDuration(e.data.duration)
        isActive = true
        lastTickTime = Date.now()
        lastHeartbeat = Date.now()
        interval = setInterval(handleTick, TICK_INTERVAL)
        heartbeatCheck = setInterval(() => {
          const now = Date.now()
          if (isActive && now - lastHeartbeat > HEARTBEAT_TIMEOUT) {
            cleanup()
            self.postMessage({ action: 'error', error: 'Connection lost' })
          }
        }, HEARTBEAT_INTERVAL)
        self.postMessage({ timeLeft })
        break

      case 'pause':
        if (isActive) {
          cleanup()
          self.postMessage({ timeLeft, action: 'paused' })
        }
        break

      case 'resume':
        if (!isActive && timeLeft > 0) {
          isActive = true
          lastTickTime = Date.now()
          interval = setInterval(handleTick, TICK_INTERVAL)
          self.postMessage({ timeLeft, action: 'resumed' })
        }
        break

      case 'reset':
        cleanup()
        timeLeft = validateDuration(e.data.duration)
        self.postMessage({ timeLeft, action: 'reset' })
        break

      case 'status':
        self.postMessage({
          timeLeft,
          isActive,
          action: 'status',
        })
        break

      default:
        throw new Error(`Unknown action: ${e.data.action}`)
    }
  } catch (error) {
    cleanup()
    self.postMessage({
      action: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timeLeft,
    })
  }
}

// 确保在 worker 终止时清理资源
self.addEventListener('unload', cleanup)

// 定期同步检查，防止定时器漂移
setInterval(() => {
  if (isActive && interval) {
    handleTick()
  }
}, TICK_INTERVAL)
