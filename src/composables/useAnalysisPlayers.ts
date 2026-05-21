import { computed } from 'vue'
import { useGameStore, BOTS } from '../stores/gameStore'
import { useLibraryStore } from '../stores/libraryStore'
import { useUserStore } from '../stores/userStore'

/**
 * Resolves player metadata for the current analysis session.
 * 
 * Logic flow:
 * 1. Read PGN headers
 * 2. Cross-reference with Library Vault for enriched metadata
 * 3. Match against known Bots for avatars/ratings
 * 4. Map to local user profile if applicable
 */
export function useAnalysisPlayers() {
  const store = useGameStore()
  const libraryStore = useLibraryStore()
  const userStore = useUserStore()

  const resolvedPlayers = computed(() => {
    // Accessing boardTrigger ensures this computed property re-evaluates
    // whenever the board state or headers are mutated (e.g. during loadPgn)
    store.boardTrigger

    const headers = store.chess.header()
    const wHeader = headers.White
    const bHeader = headers.Black
    
    let w = (wHeader && wHeader !== '?') ? wHeader : 'White'
    let b = (bHeader && bHeader !== '?') ? bHeader : 'Black'

    const libraryGame = store.loadedGameId ? libraryStore.gamesMap.get(store.loadedGameId) : null
    if (libraryGame) {
      if ((w === 'White' || w === 'Unknown' || w === '?') && libraryGame.white) w = libraryGame.white
      if ((b === 'Black' || b === 'Unknown' || b === '?') && libraryGame.black) b = libraryGame.black
    }

    const myUsername = userStore.profile?.username || userStore.displayName
    
    if (libraryGame?.userSide === 'white') {
       if (w === 'White' || w === 'Unknown' || w === '?') w = myUsername
    } else if (libraryGame?.userSide === 'black') {
       if (b === 'Black' || b === 'Unknown' || b === '?') b = myUsername
    } else if (userStore.isAuthenticated) {
      const wIsMe = userStore.isMe(w)
      const bIsMe = userStore.isMe(b)
      
      const isGenericWhite = w.toLowerCase() === 'white'
      const isGenericBlack = b.toLowerCase() === 'black'

      // If w is generic 'White' and we are logged in, and black is a known bot or someone else,
      // we assume white is us (standard analysis assumption for Knightfall).
      // We also check store.playerColor as a hint for which side the user is currently "viewing" as.
      if (wIsMe || (isGenericWhite && !bIsMe && store.playerColor === 'w')) {
        w = myUsername
      } else if (bIsMe || (isGenericBlack && !wIsMe && store.playerColor === 'b')) {
        b = myUsername
      } else if (isGenericWhite && !bIsMe && !wIsMe) {
        // Ultimate fallback: if both are generic and no hint, default to White for the user
        w = myUsername
      }
    }

    const findBot = (name: string) => BOTS.find(bot => bot.name === name)
    const whiteBot = findBot(w)
    const blackBot = findBot(b)

    const getPlayerRating = (header: any, bot: any, isUser: boolean, libraryElo?: string) => {
      // 1. If we have a concrete header value (not generic), use it first.
      // This respects manual edits in the Metadata Editor.
      if (header && header !== '?' && header !== '0' && header !== 'Unknown') return header

      // 2. Fallback to library metadata if available
      if (libraryElo && libraryElo !== '?' && libraryElo !== '0') return libraryElo

      // 3. Fallback to user profile if it's the user and they have a rating
      if (isUser && userStore.profile?.rating) return userStore.profile.rating
      
      // 4. Ultimate fallback to bot rating or default
      return bot?.rating || '1200'
    }

    return {
      white: {
        name: w,
        rating: getPlayerRating(headers.WhiteElo, whiteBot, w === userStore.profile?.username, libraryGame?.whiteElo),
        avatar: whiteBot?.avatar || (w === userStore.profile?.username ? userStore.profile?.avatar_url : '/avatars/default.png')
      },
      black: {
        name: b,
        rating: getPlayerRating(headers.BlackElo, blackBot, b === userStore.profile?.username, libraryGame?.blackElo),
        avatar: blackBot?.avatar || (b === userStore.profile?.username ? userStore.profile?.avatar_url : '/avatars/default.png')
      }
    }
  })

  const playerNames = computed(() => {
    const p = resolvedPlayers.value
    return {
      white: p.white.name,
      black: p.black.name,
      whiteElo: p.white.rating ? `(${p.white.rating})` : '',
      blackElo: p.black.rating ? `(${p.black.rating})` : ''
    }
  })

  const isUserBlack = computed(() => {
    return userStore.isMe(resolvedPlayers.value.black.name) && !userStore.isMe(resolvedPlayers.value.white.name)
  })

  return {
    resolvedPlayers,
    playerNames,
    isUserBlack
  }
}
