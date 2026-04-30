import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { ref, nextTick, shallowRef } from 'vue'
import { useLibraryFilter } from '../../../../stores/library/useLibraryFilter'

describe('useLibraryFilter', () => {
  const mockGames = [
    { id: '1', white: 'Magnus', black: 'Nepo', result: '1-0', date: '2021.11.26', movesCount: 45, addedAt: 100, tags: ['World Champ'], event: 'WC 2021', eco: 'A00' },
    { id: '2', white: 'Hikaru', black: 'Magnus', result: '0-1', date: '2022.05.10', movesCount: 32, addedAt: 200, tags: ['Speed'], event: 'Blitz', eco: 'B00' },
    { id: '3', white: 'Knight', black: 'Stockfish', result: '1/2-1/2', date: '2023.01.01', movesCount: 60, addedAt: 300, tags: ['Local'], event: 'Casual', eco: 'C00' }
  ] as any

  const mockUserStore = {
    profile: { username: 'Knight' }
  }

  let games: any
  let searchQuery: any
  let filterResult: any
  let selectedTag: any
  let filterPerspective: any
  let sortBy: any
  let sortOrder: any

  beforeEach(() => {
    vi.useFakeTimers()
    games = shallowRef([...mockGames])
    searchQuery = ref('')
    filterResult = ref('all')
    selectedTag = ref('all')
    filterPerspective = ref('all')
    sortBy = ref('addedAt')
    sortOrder = ref('desc')
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('initializes with all games when no filters are set', async () => {
    const { filteredGames } = useLibraryFilter(
      games, mockUserStore, searchQuery, filterResult, 
      selectedTag, filterPerspective, sortBy, sortOrder
    )
    
    await nextTick()
    expect(filteredGames.value.length).toBe(3)
  })

  it('filters by search query (case insensitive)', async () => {
    const { filteredGames } = useLibraryFilter(
      games, mockUserStore, searchQuery, filterResult, 
      selectedTag, filterPerspective, sortBy, sortOrder
    )

    searchQuery.value = 'Magnus'
    await nextTick()
    expect(filteredGames.value.length).toBe(2)
  })

  it('filters by result', async () => {
    const { filteredGames } = useLibraryFilter(
      games, mockUserStore, searchQuery, filterResult, 
      selectedTag, filterPerspective, sortBy, sortOrder
    )

    filterResult.value = '1-0'
    await nextTick()
    expect(filteredGames.value.length).toBe(1)
    expect(filteredGames.value[0].id).toBe('1')
  })

  it('filters by tag', async () => {
    const { filteredGames } = useLibraryFilter(
      games, mockUserStore, searchQuery, filterResult, 
      selectedTag, filterPerspective, sortBy, sortOrder
    )

    selectedTag.value = 'Speed'
    await nextTick()
    expect(filteredGames.value.length).toBe(1)
    expect(filteredGames.value[0].id).toBe('2')
  })

  it('filters by perspective (White)', async () => {
    const { filteredGames } = useLibraryFilter(
      games, mockUserStore, searchQuery, filterResult, 
      selectedTag, filterPerspective, sortBy, sortOrder
    )

    filterPerspective.value = 'white'
    await nextTick()
    // User is 'Knight', game 3 has Knight as White
    expect(filteredGames.value.length).toBe(1)
    expect(filteredGames.value[0].id).toBe('3')
  })

  it('sorts games correctly (Moves Count DESC)', async () => {
    const { filteredGames } = useLibraryFilter(
      games, mockUserStore, searchQuery, filterResult, 
      selectedTag, filterPerspective, sortBy, sortOrder
    )

    sortBy.value = 'movesCount'
    sortOrder.value = 'desc'
    await nextTick()
    
    expect(filteredGames.value[0].movesCount).toBe(60)
    expect(filteredGames.value[filteredGames.value.length - 1].movesCount).toBe(32)
  })

  it('updates tag cloud when games list changes (debounced)', async () => {
    const { allTags } = useLibraryFilter(
      games, mockUserStore, searchQuery, filterResult, 
      selectedTag, filterPerspective, sortBy, sortOrder
    )

    vi.advanceTimersByTime(1100)
    await nextTick()
    
    expect(allTags.value).toContain('World Champ')
    expect(allTags.value).toContain('Speed')
    expect(allTags.value.length).toBe(5)

    games.value = [...games.value, { id: '4', tags: ['Unique'], white: '', black: '', result: '', date: '', addedAt: 400, event: '', eco: '' }]
    
    vi.advanceTimersByTime(1100)
    await nextTick()
    expect(allTags.value).toContain('Unique')
  })

  it('re-filters automatically when any ref changes', async () => {
    const { filteredGames } = useLibraryFilter(
      games, mockUserStore, searchQuery, filterResult, 
      selectedTag, filterPerspective, sortBy, sortOrder
    )

    await nextTick()
    expect(filteredGames.value.length).toBe(3)
    
    searchQuery.value = 'Hikaru'
    await nextTick()
    expect(filteredGames.value.length).toBe(1)
    
    searchQuery.value = ''
    filterResult.value = '0-1'
    await nextTick()
    expect(filteredGames.value.length).toBe(1)
  })
})
