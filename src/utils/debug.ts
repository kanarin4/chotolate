const DEBUG_PREFIX = '[chotolate]'

const isDebugEnabled = (): boolean => import.meta.env.DEV

export function debugLog(event: string, payload?: unknown): void {
  if (!isDebugEnabled()) {
    return
  }

  if (payload === undefined) {
    console.debug(`${DEBUG_PREFIX} ${event}`)
    return
  }

  console.debug(`${DEBUG_PREFIX} ${event}`, payload)
}

export function debugError(event: string, error: unknown): void {
  if (!isDebugEnabled()) {
    return
  }

  console.error(`${DEBUG_PREFIX} ${event}`, error)
}
