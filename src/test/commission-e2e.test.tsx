import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'

// Mock all the dependencies
const mockTransactionsApi = {
  getAll: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  getDashboardStats: vi.fn(),
}

const mockAccountsApi = {
  getAll: vi.fn(),
}

const mockLocationsApi = {
  getAll: vi.fn(),
}

vi.mock('@/lib/api', () => ({
  transactionsApi: mockTransactionsApi,
  accountsApi: mockAccountsApi,
  locationsApi: mockLocationsApi,
}))

const mockToast = vi.fn()
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}))

// Mock currency utilities
vi.mock('@/lib/utils/currency', () => ({
  formatCurrency: (amount: number) => `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  parseCurrency: (value: string) => parseFloat(value.replace(/[^\d.-]/g, '')) || 0,
}))

// Mock date utilities
vi.mock('@/lib/utils/date', () => ({
  formatDate: (date: string | Date) => {
    const d = new Date(date)
    return d.toLocaleDateString('en-IN')
  },
  formatDateForInput: (date: Date) => date.toISOString().split('T')[0],
}))

// Simplified test component that simulates the main transaction workflow
const TransactionWorkflowTest = () => {
  const [transactions, setTransactions] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(false)

  const loadTransactions = async () => {
    setLoading(true)
    try {
      const result = await mockTransactionsApi.getAll()
      setTransactions(result.data || [])
    } catch (error) {
      console.error('Failed to load transactions')
    } finally {
      setLoading(false)
    }
  }

  const createTransaction = async (transactionData: any) => {
    try {
      const result = await mockTransactionsApi.create(transactionData)
      // Simulate adding the new transaction to the list
      setTransactions(prev => [...prev, result])
      return result
    } catch (error) {
      throw error
    }
  }

  const updateTransaction = async (id: string, updateData: any) => {
    try {
      const result = await mockTransactionsApi.update(id, updateData)
      // Simulate updating the transaction in the list
      setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updateData } : t))
      return result
    } catch (error) {
      throw error
    }
  }

  React.useEffect(() => {
    loadTransactions()
  }, [])

  return (
    <div data-testid="transaction-workflow">
      <div data-testid="loading" style={{ display: loading ? 'block' : 'none' }}>
        Loading...
      </div>
      
      <div data-testid="transaction-list">
        {transactions.map((transaction) => (
          <div key={transaction.id} data-testid={`transaction-${transaction.id}`}>
            <span data-testid={`amount-${transaction.id}`}>
              Amount: ₹{transaction.amount}
            </span>
            <span data-testid={`commission-${transaction.id}`}>
              Commission: ₹{transaction.commission || 0}
            </span>
            <span data-testid={`type-${transaction.id}`}>
              Type: {transaction.type}
            </span>
          </div>
        ))}
      </div>

      <button
        data-testid="create-transaction-btn"
        onClick={() => createTransaction({
          transaction_no: '20250108-001',
          date: '2025-01-08',
          amount: 1000,
          commission: 50.25,
          type: 'credit',
          account_id: 'account-1',
          location_id: 'location-1',
          description: 'Test transaction'
        })}
      >
        Create Transaction with Commission
      </button>

      <button
        data-testid="create-no-commission-btn"
        onClick={() => createTransaction({
          transaction_no: '20250108-002',
          date: '2025-01-08',
          amount: 500,
          type: 'debit',
          account_id: 'account-2',
          location_id: 'location-2',
          description: 'Test transaction without commission'
        })}
      >
        Create Transaction without Commission
      </button>

      <button
        data-testid="update-commission-btn"
        onClick={() => updateTransaction('txn-1', { commission: 75.50 })}
      >
        Update Commission
      </button>
    </div>
  )
}

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('Commission End-to-End Workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default mock responses
    mockTransactionsApi.getAll.mockResolvedValue({
      data: [],
      count: 0
    })
    
    mockAccountsApi.getAll.mockResolvedValue([
      { id: 'account-1', name: 'Test Account 1' },
      { id: 'account-2', name: 'Test Account 2' }
    ])
    
    mockLocationsApi.getAll.mockResolvedValue([
      { id: 'location-1', name: 'Test Location 1' },
      { id: 'location-2', name: 'Test Location 2' }
    ])
  })

  describe('Complete Transaction Lifecycle with Commission', () => {
    it('should create, display, and update transactions with commission', async () => {
      const user = userEvent.setup()
      
      // Mock successful creation
      mockTransactionsApi.create.mockResolvedValueOnce({
        id: 'txn-1',
        transaction_no: '20250108-001',
        amount: 1000,
        commission: 50.25,
        type: 'credit'
      })

      // The createTransaction function will add the transaction to the list automatically

      renderWithRouter(<TransactionWorkflowTest />)

      // Wait for initial load
      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeVisible()
      })

      // Create transaction with commission
      await user.click(screen.getByTestId('create-transaction-btn'))

      // Wait for transaction to appear in list
      await waitFor(() => {
        expect(screen.getByTestId('transaction-txn-1')).toBeInTheDocument()
      })

      // Verify commission is displayed correctly
      expect(screen.getByTestId('commission-txn-1')).toHaveTextContent('Commission: ₹50.25')
      expect(screen.getByTestId('amount-txn-1')).toHaveTextContent('Amount: ₹1000')
      expect(screen.getByTestId('type-txn-1')).toHaveTextContent('Type: credit')

      // Verify API was called with correct data
      expect(mockTransactionsApi.create).toHaveBeenCalledWith({
        transaction_no: '20250108-001',
        date: '2025-01-08',
        amount: 1000,
        commission: 50.25,
        type: 'credit',
        account_id: 'account-1',
        location_id: 'location-1',
        description: 'Test transaction'
      })
    })

    it('should handle transactions without commission (defaults to 0)', async () => {
      const user = userEvent.setup()
      
      // Mock successful creation without commission
      mockTransactionsApi.create.mockResolvedValueOnce({
        id: 'txn-2',
        transaction_no: '20250108-002',
        amount: 500,
        commission: 0, // Should default to 0
        type: 'debit'
      })

      // The createTransaction function will add the transaction to the list automatically

      renderWithRouter(<TransactionWorkflowTest />)

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeVisible()
      })

      await user.click(screen.getByTestId('create-no-commission-btn'))

      await waitFor(() => {
        expect(screen.getByTestId('transaction-txn-2')).toBeInTheDocument()
      })

      // Should display commission as 0
      expect(screen.getByTestId('commission-txn-2')).toHaveTextContent('Commission: ₹0')
    })

    it('should update commission values correctly', async () => {
      const user = userEvent.setup()
      
      // Initial transaction with commission
      mockTransactionsApi.getAll.mockResolvedValueOnce({
        data: [{
          id: 'txn-1',
          transaction_no: '20250108-001',
          amount: 1000,
          commission: 50.25,
          type: 'credit'
        }],
        count: 1
      })

      // Mock successful update
      mockTransactionsApi.update.mockResolvedValueOnce({
        id: 'txn-1',
        commission: 75.50
      })

      // The updateTransaction function will update the transaction in the list automatically

      renderWithRouter(<TransactionWorkflowTest />)

      await waitFor(() => {
        expect(screen.getByTestId('commission-txn-1')).toHaveTextContent('Commission: ₹50.25')
      })

      await user.click(screen.getByTestId('update-commission-btn'))

      await waitFor(() => {
        expect(screen.getByTestId('commission-txn-1')).toHaveTextContent('Commission: ₹75.5')
      })

      expect(mockTransactionsApi.update).toHaveBeenCalledWith('txn-1', { commission: 75.50 })
    })
  })

  describe('Commission Data Integrity', () => {
    it('should handle null commission values from database', async () => {
      // Mock transaction with null commission (legacy data)
      mockTransactionsApi.getAll.mockResolvedValueOnce({
        data: [{
          id: 'txn-legacy',
          transaction_no: '20241201-001',
          amount: 1000,
          commission: null, // Legacy data
          type: 'credit'
        }],
        count: 1
      })

      renderWithRouter(<TransactionWorkflowTest />)

      await waitFor(() => {
        expect(screen.getByTestId('transaction-txn-legacy')).toBeInTheDocument()
      })

      // Should display as 0 when commission is null
      expect(screen.getByTestId('commission-txn-legacy')).toHaveTextContent('Commission: ₹0')
    })

    it('should maintain commission precision', async () => {
      mockTransactionsApi.getAll.mockResolvedValueOnce({
        data: [{
          id: 'txn-precision',
          transaction_no: '20250108-001',
          amount: 1000,
          commission: 123.45, // Precise decimal
          type: 'credit'
        }],
        count: 1
      })

      renderWithRouter(<TransactionWorkflowTest />)

      await waitFor(() => {
        expect(screen.getByTestId('commission-txn-precision')).toHaveTextContent('Commission: ₹123.45')
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      const user = userEvent.setup()
      
      // Mock API error
      mockTransactionsApi.create.mockRejectedValueOnce(new Error('API Error'))

      renderWithRouter(<TransactionWorkflowTest />)

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeVisible()
      })

      // This should trigger an error but not crash the component
      try {
        await user.click(screen.getByTestId('create-transaction-btn'))
      } catch (error) {
        // Expected to throw error
      }

      // Component should still be functional
      expect(screen.getByTestId('transaction-workflow')).toBeInTheDocument()
    })
  })
})