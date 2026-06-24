import { ref, onMounted, onUnmounted } from 'vue'

/**
 * Centralized Mobile Detection Composable
 *
 * Provides reactive boolean refs indicating whether the current device
 * is a mobile viewport or has touch capabilities. This avoids scattering
 * `window.innerWidth < X` checks across components.
 *
 * **Why a composable instead of a store?**
 * Because this is pure read-only device detection with no shared state mutations.
 * A composable is lighter and avoids polluting the Pinia store graph.
 *
 * **Test device targets:**
 * - iPhone SE (375px)
 * - Galaxy S25 (412px)
 * - iPhone 15 Pro Max (430px)
 *
 * @returns {{ isMobile: Ref<boolean>, isTouch: Ref<boolean> }}
 */
export function useMobileDetect() {
  /**
   * The breakpoint threshold for "mobile" layouts.
   * 768px is the standard tablet/phone divide used across the codebase.
   */
  const MOBILE_BREAKPOINT = 768

  /**
   * True when the viewport width is at or below the mobile breakpoint.
   * Reactively updates when the user resizes (or rotates their device).
   */
  const isMobile = ref(false)

  /**
   * True when the device has a coarse pointer (finger) rather than
   * a fine pointer (mouse). This is used to disable drag-and-drop
   * on the chess board and switch to tap-to-move.
   */
  const isTouch = ref(false)

  /** MediaQueryList instance for the mobile breakpoint */
  let mql: MediaQueryList | null = null

  /**
   * Sync the `isMobile` ref with the current state of the media query.
   * Called both on mount and whenever the viewport crosses the breakpoint.
   */
  function handleMediaChange(e: MediaQueryListEvent | MediaQueryList) {
    isMobile.value = e.matches
  }

  onMounted(() => {
    // Detect touch capability once — this doesn't change during a session
    isTouch.value =
      typeof window !== 'undefined' &&
      (window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window)

    // Set up reactive viewport tracking
    if (typeof window !== 'undefined') {
      mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`)
      isMobile.value = mql.matches
      mql.addEventListener('change', handleMediaChange)
    }
  })

  onUnmounted(() => {
    mql?.removeEventListener('change', handleMediaChange)
  })

  return { isMobile, isTouch }
}
