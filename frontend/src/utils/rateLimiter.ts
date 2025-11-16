/**
 * Rate Limiter for API calls
 * Ensures we don't exceed rate limits (e.g., 5 requests per second for Subscan API)
 */

interface QueuedRequest<T> {
  fn: () => Promise<T>
  resolve: (value: T) => void
  reject: (error: any) => void
}

export class RateLimiter {
  private queue: QueuedRequest<any>[] = []
  private processing = false
  private lastRequestTime = 0
  private minDelay: number

  /**
   * @param requestsPerSecond - Maximum number of requests per second
   */
  constructor(private requestsPerSecond: number = 5) {
    this.minDelay = 1000 / requestsPerSecond // e.g., 200ms for 5 req/sec
  }

  /**
   * Execute a function with rate limiting
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({ fn, resolve, reject })
      this.processQueue()
    })
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) {
      return
    }

    this.processing = true

    while (this.queue.length > 0) {
      const now = Date.now()
      const timeSinceLastRequest = now - this.lastRequestTime

      // Wait if needed to maintain rate limit
      if (timeSinceLastRequest < this.minDelay) {
        const waitTime = this.minDelay - timeSinceLastRequest
        await new Promise(resolve => setTimeout(resolve, waitTime))
      }

      const request = this.queue.shift()!
      this.lastRequestTime = Date.now()

      try {
        const result = await request.fn()
        request.resolve(result)
      } catch (error) {
        request.reject(error)
      }
    }

    this.processing = false
  }

  /**
   * Get current queue length
   */
  getQueueLength(): number {
    return this.queue.length
  }

  /**
   * Clear the queue
   */
  clear() {
    this.queue.forEach(req => req.reject(new Error('Rate limiter cleared')))
    this.queue = []
  }
}

// Global rate limiter instance for Subscan API (5 requests per second)
export const subscanRateLimiter = new RateLimiter(5)

