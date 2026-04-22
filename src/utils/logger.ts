/**
 * Centralized Logger Utility
 *
 * Why? We had 24+ `console.log` calls shipping to production, including
 * sensitive LLM API request/response data. This logger wraps console methods
 * and automatically silences non-error logs in production builds.
 *
 * Vite sets `import.meta.env.DEV` to `true` during `vite dev` and `false`
 * during `vite build`, so this is fully tree-shakeable at build time.
 *
 * Usage:
 *   import { logger } from '../utils/logger'
 *   logger.info('[Coach] Cache hit for FEN:', fen)
 *   logger.warn('[Engine] Rebooting worker...')
 *   logger.error('[Critical] Unrecoverable failure:', err)  // always shown
 */

/** Whether we're in a development environment (Vite injects this at build time) */
const isDev = import.meta.env.DEV

export const logger = {
  /**
   * General information logging. Only visible during development.
   * Use this for flow tracing, cache hits, state changes, etc.
   */
  info: (...args: unknown[]) => {
    if (isDev) console.log(...args)
  },

  /**
   * Warning-level logging. Only visible during development.
   * Use this for non-critical issues like fallback behavior or stale data.
   */
  warn: (...args: unknown[]) => {
    if (isDev) console.warn(...args)
  },

  /**
   * Error-level logging. Always visible, even in production.
   * Use this for unrecoverable failures, network errors, and crashes.
   */
  error: (...args: unknown[]) => {
    console.error(...args)
  },
}
