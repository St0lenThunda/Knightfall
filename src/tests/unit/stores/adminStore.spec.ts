import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAdminStore } from '../../../stores/adminStore'
import { supabase } from '../../../api/supabaseClient'

// Mock the Supabase client
vi.mock('../../../api/supabaseClient', () => {
  const selectMock = vi.fn().mockReturnThis()
  const orderMock = vi.fn().mockReturnThis()
  const orMock = vi.fn().mockReturnThis()
  
  return {
    supabase: {
      from: vi.fn(() => ({
        select: selectMock,
        order: orderMock,
        or: orMock,
        then: (cb: any) => cb({ data: [], error: null })
      })),
      rpc: vi.fn()
    }
  }
})

describe('AdminStore - User Management Operations', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('initializes with empty users list and fetching set to false', () => {
    const adminStore = useAdminStore()
    expect(adminStore.users).toEqual([])
    expect(adminStore.isFetchingUsers).toBe(false)
  })

  it('populates users list after successful fetchUsers', async () => {
    const adminStore = useAdminStore()
    const mockUsers = [
      { id: '1', username: 'alex', email: 'alex@test.com', rating: 1200, role: 'user' },
      { id: '2', username: 'tony', email: 'tonym415@gmail.com', rating: 1800, role: 'admin' }
    ]

    // Setup temporary promise mock for profiles query
    const selectMock = vi.fn().mockReturnThis()
    const orderMock = vi.fn().mockResolvedValue({ data: mockUsers, error: null })
    vi.spyOn(supabase, 'from').mockReturnValue({
      select: selectMock,
      order: orderMock
    } as any)

    await adminStore.fetchUsers()

    expect(adminStore.users).toEqual(mockUsers)
    expect(adminStore.isFetchingUsers).toBe(false)
    expect(supabase.from).toHaveBeenCalledWith('profiles')
  })

  it('successfully calls admin_purge_user RPC and filters out purged user', async () => {
    const adminStore = useAdminStore()
    
    // Set up initial state with two users
    adminStore.users = [
      { id: 'usr-1', username: 'cheater123', email: 'cheat@cheat.com' },
      { id: 'usr-2', username: 'tony', email: 'tonym415@gmail.com' }
    ]

    // Mock RPC success response
    vi.spyOn(supabase, 'rpc').mockResolvedValue({ data: null, error: null } as any)

    const result = await adminStore.purgeUser('usr-1')

    expect(result.success).toBe(true)
    expect(supabase.rpc).toHaveBeenCalledWith('admin_purge_user', {
      target_user_id: 'usr-1'
    })
    
    // Verify user list no longer contains purged user
    expect(adminStore.users).toEqual([
      { id: 'usr-2', username: 'tony', email: 'tonym415@gmail.com' }
    ])
  })

  it('returns success: false when database RPC fails', async () => {
    const adminStore = useAdminStore()
    const mockError = { message: 'Unauthorized' }
    
    vi.spyOn(supabase, 'rpc').mockResolvedValue({ data: null, error: mockError } as any)

    const result = await adminStore.purgeUser('usr-invalid')

    expect(result.success).toBe(false)
    expect(result.error).toEqual(mockError)
  })
})
