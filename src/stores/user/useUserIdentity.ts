import { computed, type Ref } from 'vue'
import type { UserProfile } from '../userStore'

/**
 * User Identity Composable
 * 
 * Manages the player's presence across platforms and their internal identity within Knightfall.
 * 
 * @param profile - Reactive reference to the user's profile data
 */
export function useUserIdentity(profile: Ref<UserProfile | null>) {
  
  /** Returns the most relevant username to display. */
  const displayName = computed(() => {
    if (!profile.value) return 'Ghost'
    return profile.value.chesscom_handle || profile.value.username || 'Knight'
  })

  /** Helper to check if a player name matches the current user. */
  function isMe(playerName: string | null | undefined): boolean {
    if (!playerName) return false
    const n = playerName.toLowerCase()

    // 1. Unauthenticated/Guest Flow
    if (!profile.value) {
      return n === 'guest' || n === 'knight' || n === 'white' || n === 'black'
    }

    // 2. Authenticated Flow: Prevent generic name collisions
    const genericNames = ['white', 'black', 'guest', 'knight', 'anonymous', 'unknown']
    const myUsername = profile.value.username?.toLowerCase()
    const myChesscom = profile.value.chesscom_handle?.toLowerCase()
    const myLichess = profile.value.lichess_handle?.toLowerCase()
    
    // If it's a generic name, only count as 'Me' if it's actually our username (e.g. someone named 'Guest')
    if (genericNames.includes(n) && myUsername !== n) return false

    // Strict Comparison: Ensure we have a value to compare against
    const matchesUsername = myUsername && n === myUsername
    const matchesChesscom = myChesscom && n === myChesscom
    const matchesLichess = myLichess && n === myLichess

    if (matchesUsername || matchesChesscom || matchesLichess) return true

    // Fuzzy Substring Comparison: Catch variations of the handles
    const fuzzyUsername = myUsername && n.includes(myUsername)
    const fuzzyChesscom = myChesscom && n.includes(myChesscom)
    const fuzzyLichess = myLichess && n.includes(myLichess)

    return !!(fuzzyUsername || fuzzyChesscom || fuzzyLichess)
  }

  /** Centralized check for administrative privileges. */
  const isAdmin = computed(() => {
    return profile.value?.role === 'admin'
  })

  /** Verification of connected platforms. */
  const hasConnectedAccounts = computed(() => {
    return !!(profile.value?.chesscom_handle || profile.value?.lichess_handle)
  })

  /** Quick check for active session/profile. */
  const isAuthenticated = computed(() => !!profile.value)

  return {
    displayName,
    isMe,
    isAdmin,
    isAuthenticated,
    hasConnectedAccounts
  }
}
