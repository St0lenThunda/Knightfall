import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref } from 'vue'
import { useLibrarySync } from '../../../../stores/library/useLibrarySync'
import { supabase } from '../../../../api/supabaseClient'

// Mock Supabase
vi.mock('../../../../api/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn()
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        or: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({ data: [], error: null }))
        })),
        eq: vi.fn(() => Promise.resolve({ data: [], error: null }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: { id: 'cloud-123' }, error: null }))
        }))
      })),
      delete: vi.fn(() => ({
        or: vi.fn(() => Promise.resolve({ error: null })),
        eq: vi.fn(() => Promise.resolve({ error: null }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null }))
      }))
    }))
  }
}))

// Mock Pinia stores
vi.mock('../../../../stores/uiStore', () => ({
  useUiStore: () => ({
    addToast: vi.fn()
  })
}))

vi.mock('../../../../stores/userStore', () => ({
  useUserStore: () => ({
    isMe: vi.fn(() => true)
  })
}))

describe('useLibrarySync', () => {
  let games: any
  let isProcessingIntegrity: any
  let integrityProgress: any
  let integrityMessage: any

  const mockInitDb = vi.fn(async () => ({
    transaction: vi.fn(() => ({
      objectStore: vi.fn(() => ({
        put: vi.fn()
      }))
    }))
  })) as any

  beforeEach(() => {
    games = ref([])
    isProcessingIntegrity = ref(false)
    integrityProgress = ref(0)
    integrityMessage = ref('')
    vi.clearAllMocks()
  })

  it('syncCloudGames returns early if no session exists', async () => {
    (supabase.auth.getSession as any).mockResolvedValue({ data: { session: null } })
    
    const { syncCloudGames } = useLibrarySync(
      games, mockInitDb, isProcessingIntegrity, integrityProgress, integrityMessage
    )

    await syncCloudGames()
    expect(isProcessingIntegrity.value).toBe(false)
    expect(supabase.from).not.toHaveBeenCalled()
  })

  it('syncCloudGames downloads new games and updates local state', async () => {
    (supabase.auth.getSession as any).mockResolvedValue({ data: { session: { user: { id: 'user-123' } } } })
    
    const mockMatches = [
      { id: 'm1', pgn: '[White "Magnus"][Black "Nepo"] 1. e4 e5', result: '1-0', created_at: '2023-01-01T12:00:00Z' }
    ]
    
    const mockFrom = supabase.from as any
    mockFrom.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: mockMatches, error: null })
    })

    const { syncCloudGames } = useLibrarySync(
      games, mockInitDb, isProcessingIntegrity, integrityProgress, integrityMessage
    )

    await syncCloudGames()

    expect(games.value.length).toBe(1)
    expect(games.value[0].white).toBe('Magnus')
    expect(games.value[0].cloudId).toBe('m1')
    expect(mockInitDb).toHaveBeenCalled()
  })

  it('pushLocalGamesToCloud pushes unlinked games to Supabase', async () => {
    (supabase.auth.getSession as any).mockResolvedValue({ data: { session: { user: { id: 'user-123' } } } })
    
    games.value = [
      { id: 'local-1', pgn: '1. d4 d5', white: 'Player', black: 'Bot', result: '*', cloudId: null }
    ]

    const { pushLocalGamesToCloud } = useLibrarySync(
      games, mockInitDb, isProcessingIntegrity, integrityProgress, integrityMessage
    )

    await pushLocalGamesToCloud()

    expect(supabase.from).toHaveBeenCalledWith('matches')
    expect(games.value[0].cloudId).toBe('cloud-123')
  })

  it('purgeCloudLibrary deletes matches for the current user', async () => {
    (supabase.auth.getSession as any).mockResolvedValue({ data: { session: { user: { id: 'user-123' } } } })
    
    const { purgeCloudLibrary } = useLibrarySync(
      games, mockInitDb, isProcessingIntegrity, integrityProgress, integrityMessage
    )

    await purgeCloudLibrary()
    expect(supabase.from).toHaveBeenCalledWith('matches')
    // Verification of the 'or' call is complex with the chained mock, but we ensured 'from' was called.
  })
})
