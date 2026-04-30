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
    const headers = store.chess.header()
    const wHeader = headers.White
    const bHeader = headers.Black
    
    let w = (wHeader && wHeader !== '?') ? wHeader : 'White'
    let b = (bHeader && bHeader !== '?') ? bHeader : 'Black'

    const libraryGame = store.loadedGameId ? libraryStore.gamesMap.get(store.loadedGameId) : null
    if (libraryGame) {
      if (w === 'White' || w === 'Unknown' || w === '?') w = libraryGame.white
      if (b === 'Black' || b === 'Unknown' || b === '?') b = libraryGame.black
    }

    const myUsername = userStore.profile?.username || userStore.displayName
    if ((w === 'White' || w === 'Unknown') && userStore.isAuthenticated) w = myUsername
    if ((b === 'Black' || b === 'Unknown') && userStore.isAuthenticated) b = myUsername

    const findBot = (name: string) => BOTS.find(bot => bot.name === name)
    const whiteBot = findBot(w)
    const blackBot = findBot(b)

    const getPlayerRating = (header: any, bot: any, isUser: boolean, libraryElo?: string) => {
      if (isUser && userStore.profile?.rating) return userStore.profile.rating
      if (header && header !== '?' && header !== '0') return header
      if (libraryElo && libraryElo !== '?' && libraryElo !== '0') return libraryElo
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

  return {
    resolvedPlayers,
    playerNames
  }
}
