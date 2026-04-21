import type { LibraryGame } from '../stores/libraryStore'

let gamesCache: LibraryGame[] = []

self.onmessage = (e: MessageEvent) => {
  const { type, payload } = e.data

  if (type === 'SET_GAMES') {
    gamesCache = payload
    return
  }

  if (type === 'FILTER') {
    const { username, searchQuery, filterResult, selectedTag, filterPerspective, sortBy, sortOrder } = payload
    const sq = searchQuery.toLowerCase()
    const un = username.toLowerCase()

    let result = gamesCache.filter((g: LibraryGame) => {
          const matchesSearch = 
              g.white.toLowerCase().includes(sq) ||
              g.black.toLowerCase().includes(sq) ||
              g.event.toLowerCase().includes(sq)
          
          const matchesResult = filterResult === 'all' || g.result === filterResult
          const matchesTag = selectedTag === 'all' || (g.tags && g.tags.includes(selectedTag))
          
          let matchesPerspective = true
          if (filterPerspective === 'white') {
              matchesPerspective = g.white.toLowerCase() === un
          } else if (filterPerspective === 'black') {
              matchesPerspective = g.black.toLowerCase() === un
          }

          return matchesSearch && matchesResult && matchesTag && matchesPerspective
    })

    result.sort((a: LibraryGame, b: LibraryGame) => {
          let valA: any, valB: any
          switch(sortBy) {
              case 'date': valA = a.date; valB = b.date; break
              case 'movesCount': valA = a.movesCount; valB = b.movesCount; break
              case 'player': valA = a.white; valB = b.white; break
              case 'opening': valA = a.eco; valB = b.eco; break
              default: valA = a.addedAt; valB = b.addedAt
          }
          if (valA < valB) return sortOrder === 'asc' ? -1 : 1
          if (valA > valB) return sortOrder === 'asc' ? 1 : -1
          return 0
    })

    self.postMessage(result)
  }
}
