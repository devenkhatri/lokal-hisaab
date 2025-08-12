import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the supabase client first
const mockSupabaseChain = {
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  gte: vi.fn().mockReturnThis(),
  lte: vi.fn().mockReturnThis(),
  or: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  range: vi.fn().mockReturnThis(),
  single: vi.fn(),
}

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => mockSupabaseChain),
  },
}))

// Import after mocking
const { transactionsApi } = await import('@/lib/api')

describe('Commission API Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Transaction Creation with Commission', () => {
    it('should create transaction with commission field', async () => {
      const mockTransaction = {
        transaction_no: '20250108-001',
        date: '2025-01-08',
        amount: 1000,
        commission: 50,
        type: 'credit' as const,
        account_id: 'account-1',
        location_id: 'location-1',
        description: 'Test transaction'
      }

      const mockResponse = { ...mockTransaction, id: 'txn-1', created_at: '2025-01-08T10:00:00Z', updated_at: '2025-01-08T10:00:00Z' }
      
      mockSupabaseChain.single.mockResolvedValue({ data: mockResponse, error: null })

      const result = await transactionsApi.create(mockTransaction)

      expect(result).toEqual(mockResponse)
      expect(result).toEqual(mockResponse)
    })

    it('should default commission to 0 when not provided', async () => {
      const mockTransaction = {
        transaction_no: '20250108-002',
        date: '2025-01-08',
        amount: 1000,
        type: 'credit' as const,
        account_id: 'account-1',
        location_id: 'location-1',
        description: 'Test transaction without commission'
      }

      const expectedTransaction = { ...mockTransaction, commission: 0 }
      const mockResponse = { ...expectedTransaction, id: 'txn-2', created_at: '2025-01-08T10:00:00Z', updated_at: '2025-01-08T10:00:00Z' }
      
      mockSupabaseChain.single.mockResolvedValue({ data: mockResponse, error: null })

      await transactionsApi.create(mockTransaction)

      // Verify that commission was set to 0
      const insertCall = mockSupabaseChain.insert
      expect(insertCall).toHaveBeenCalledWith([expectedTransaction])
    })

    it('should handle commission value of 0 explicitly', async () => {
      const mockTransaction = {
        transaction_no: '20250108-003',
        date: '2025-01-08',
        amount: 1000,
        commission: 0,
        type: 'debit' as const,
        account_id: 'account-1',
        location_id: 'location-1',
        description: 'Test transaction with zero commission'
      }

      const mockResponse = { ...mockTransaction, id: 'txn-3', created_at: '2025-01-08T10:00:00Z', updated_at: '2025-01-08T10:00:00Z' }
      
      mockSupabaseChain.single.mockResolvedValue({ data: mockResponse, error: null })

      const result = await transactionsApi.create(mockTransaction)

      expect(result.commission).toBe(0)
    })
  })

  describe('Transaction Updates with Commission', () => {
    it('should update transaction commission field', async () => {
      const updateData = {
        commission: 75.500,
        description: 'Updated with commission'
      }

      const mockResponse = {
        id: 'txn-1',
        commission: 75.50,
        description: 'Updated with commission',
        updated_at: '2025-01-08T11:00:00Z'
      }
      
      mockSupabaseChain.single.mockResolvedValue({ data: mockResponse, error: null })

      const result = await transactionsApi.update('txn-1', updateData)

      expect(result.commission).toBe(75.500)
      expect(result.commission).toBe(75.50)
    })

    it('should handle commission update to 0', async () => {
      const updateData = { commission: 0 }
      const mockResponse = { id: 'txn-1', commission: 0, updated_at: '2025-01-08T11:00:00Z' }
      
      mockSupabaseChain.single.mockResolvedValue({ data: mockResponse, error: null })

      const result = await transactionsApi.update('txn-1', updateData)

      expect(result.commission).toBe(0)
    })

    it('should handle undefined commission in update (should not change existing value)', async () => {
      const updateData = { description: 'Updated description only' }
      const mockResponse = { id: 'txn-1', description: 'Updated description only', updated_at: '2025-01-08T11:00:00Z' }
      
      mockSupabaseChain.single.mockResolvedValue({ data: mockResponse, error: null })

      await transactionsApi.update('txn-1', updateData)

      // Verify commission field is not included in update when undefined
      const updateCall = mockSupabaseChain.update
      const updateCallArgs = updateCall.mock.calls[0][0]
      expect(updateCallArgs).not.toHaveProperty('commission')
    })
  })

  describe('Transaction Retrieval with Commission', () => {
    it('should retrieve transactions with commission data', async () => {
      const mockTransactions = [
        {
          id: 'txn-1',
          transaction_no: '20250108-001',
          amount: 1000,
          commission: 50,
          type: 'credit',
          accounts: { id: 'acc-1', name: 'Test Account' },
          locations: { id: 'loc-1', name: 'Test Location' }
        },
        {
          id: 'txn-2',
          transaction_no: '20250108-002',
          amount: 500,
          commission: 0,
          type: 'debit',
          accounts: { id: 'acc-2', name: 'Another Account' },
          locations: { id: 'loc-2', name: 'Another Location' }
        }
      ]

      mockSupabaseChain.range.mockResolvedValue({ 
        data: mockTransactions, 
        error: null, 
        count: 2 
      })

      const result = await transactionsApi.getAll()

      expect(result.data).toHaveLength(2)
      expect(result.data[0].commission).toBe(50)
      expect(result.data[1].commission).toBe(0)
    })

    it('should retrieve single transaction with commission', async () => {
      const mockTransaction = {
        id: 'txn-1',
        transaction_no: '20250108-001',
        amount: 1000,
        commission: 25.750,
        type: 'credit',
        accounts: { id: 'acc-1', name: 'Test Account' },
        locations: { id: 'loc-1', name: 'Test Location' }
      }

      mockSupabaseChain.single.mockResolvedValue({ data: mockTransaction, error: null })

      const result = await transactionsApi.getById('txn-1')

      expect(result.commission).toBe(25.750)
    })
  })

  describe('Dashboard Stats with Commission', () => {
    it('should calculate today commission totals correctly', async () => {
      const mockTransactions = [
        {
          id: 'txn-1',
          date: '2025-01-08',
          amount: 1000,
          commission: 50,
          type: 'credit'
        },
        {
          id: 'txn-2',
          date: '2025-01-08',
          amount: 500,
          commission: 25,
          type: 'credit'
        },
        {
          id: 'txn-3',
          date: '2025-01-08',
          amount: 200,
          commission: 0,
          type: 'debit'
        },
        {
          id: 'txn-4',
          date: '2025-01-07', // Different date
          amount: 300,
          commission: 15,
          type: 'credit'
        }
      ]

      // Mock today's date
      const mockToday = '2025-01-08'
      vi.spyOn(Date.prototype, 'toISOString').mockReturnValue(`${mockToday}T10:00:00.000Z`)

      // For dashboard stats, we need to mock the query chain differently
      const mockQuery = vi.fn().mockResolvedValue({ data: mockTransactions, error: null })
      mockSupabaseChain.mockReturnValue(mockQuery)

      const result = await transactionsApi.getDashboardStats()

      // Should only include today's transactions (first 3)
      // Total commission: 50 + 25 + 0 = 75
      expect(result.todayCommissions).toBe(75)
    })

    it('should handle null/undefined commission values in stats', async () => {
      const mockTransactions = [
        {
          id: 'txn-1',
          date: '2025-01-08',
          amount: 1000,
          commission: null, // null commission
          type: 'credit'
        },
        {
          id: 'txn-2',
          date: '2025-01-08',
          amount: 500,
          commission: undefined, // undefined commission
          type: 'credit'
        },
        {
          id: 'txn-3',
          date: '2025-01-08',
          amount: 200,
          commission: 10,
          type: 'debit'
        }
      ]

      const mockToday = '2025-01-08'
      vi.spyOn(Date.prototype, 'toISOString').mockReturnValue(`${mockToday}T10:00:00.000Z`)

      // For dashboard stats, we need to mock the query chain differently
      const mockQuery = vi.fn().mockResolvedValue({ data: mockTransactions, error: null })
      mockSupabaseChain.mockReturnValue(mockQuery)

      const result = await transactionsApi.getDashboardStats()

      // Should treat null/undefined as 0: 0 + 0 + 10 = 10
      expect(result.todayCommissions).toBe(10)
    })
  })
})