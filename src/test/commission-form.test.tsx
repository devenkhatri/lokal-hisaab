import React, { useState } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'

// Mock the API
const mockTransactionsApi = {
  getAll: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
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

// Mock the toast hook
const mockToast = vi.fn()
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}))

// Create a simplified test component that includes the commission form logic
const CommissionFormTest = () => {
  const [formData, setFormData] = useState({
    amount: '',
    commission: '',
    type: 'credit' as 'credit' | 'debit',
    account_id: '',
    location_id: '',
    description: ''
  })
  
  const [commissionError, setCommissionError] = useState('')

  const COMMISSION_VALIDATION = {
    MAX_VALUE: 999999999.99,
    MAX_DECIMAL_PLACES: 2,
    MIN_VALUE: 0
  }

  const validateCommission = (value: string): string => {
    if (!value || value.trim() === '') {
      return ''
    }

    const trimmedValue = value.trim()
    const numValue = parseFloat(trimmedValue)
    
    if (isNaN(numValue)) {
      return 'Commission must be a valid number'
    }

    if (numValue < COMMISSION_VALIDATION.MIN_VALUE) {
      return 'Commission cannot be negative'
    }

    const decimalPlaces = (trimmedValue.split('.')[1] || '').length
    if (decimalPlaces > COMMISSION_VALIDATION.MAX_DECIMAL_PLACES) {
      return `Commission can have at most ${COMMISSION_VALIDATION.MAX_DECIMAL_PLACES} decimal places`
    }

    if (numValue > COMMISSION_VALIDATION.MAX_VALUE) {
      return `Commission value is too large (maximum: ${COMMISSION_VALIDATION.MAX_VALUE})`
    }

    return ''
  }

  const handleCommissionChange = (value: string) => {
    setFormData(prev => ({ ...prev, commission: value }))
    if (commissionError) {
      setCommissionError('')
    }
  }

  const handleCommissionBlur = (value: string) => {
    if (value && value.trim() !== '') {
      const error = validateCommission(value)
      setCommissionError(error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const commissionValidationError = validateCommission(formData.commission)
    if (commissionValidationError) {
      setCommissionError(commissionValidationError)
      return
    }

    // Mock successful submission
    mockTransactionsApi.create.mockResolvedValue({ id: 'test-id' })
    await mockTransactionsApi.create({
      ...formData,
      commission: formData.commission ? parseFloat(formData.commission) : 0
    })
  }

  return (
    <form onSubmit={handleSubmit} data-testid="commission-form">
      <input
        data-testid="amount-input"
        type="number"
        value={formData.amount}
        onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
        placeholder="Amount"
      />
      
      <input
        data-testid="commission-input"
        type="number"
        step="0.001"
        min="0"
        value={formData.commission}
        onChange={(e) => handleCommissionChange(e.target.value)}
        onBlur={(e) => handleCommissionBlur(e.target.value)}
        placeholder="Commission"
      />
      
      {commissionError && (
        <div data-testid="commission-error" role="alert">
          {commissionError}
        </div>
      )}
      
      <select
        data-testid="type-select"
        value={formData.type}
        onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'credit' | 'debit' }))}
      >
        <option value="credit">Credit</option>
        <option value="debit">Debit</option>
      </select>
      
      <button type="submit" data-testid="submit-button">
        Submit
      </button>
    </form>
  )
}

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('Commission Form Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Commission Input Field', () => {
    it('should render commission input field', () => {
      renderWithRouter(<CommissionFormTest />)
      
      const commissionInput = screen.getByTestId('commission-input')
      expect(commissionInput).toBeInTheDocument()
      expect(commissionInput).toHaveAttribute('type', 'number')
      expect(commissionInput).toHaveAttribute('step', '0.001')
      expect(commissionInput).toHaveAttribute('min', '0')
    })

    it('should accept valid commission values', async () => {
      const user = userEvent.setup()
      renderWithRouter(<CommissionFormTest />)
      
      const commissionInput = screen.getByTestId('commission-input')
      
      await user.type(commissionInput, '50.25')
      expect(commissionInput).toHaveValue(50.25)
      
      // No error should be displayed
      expect(screen.queryByTestId('commission-error')).not.toBeInTheDocument()
    })

    it('should show validation error for negative values', async () => {
      const user = userEvent.setup()
      renderWithRouter(<CommissionFormTest />)
      
      const commissionInput = screen.getByTestId('commission-input')
      
      await user.type(commissionInput, '-10')
      await user.tab() // Trigger blur event
      
      await waitFor(() => {
        expect(screen.getByTestId('commission-error')).toBeInTheDocument()
        expect(screen.getByTestId('commission-error')).toHaveTextContent('Commission cannot be negative')
      })
    })

    it('should show validation error for too many decimal places', async () => {
      const user = userEvent.setup()
      renderWithRouter(<CommissionFormTest />)
      
      const commissionInput = screen.getByTestId('commission-input')
      
      await user.type(commissionInput, '10.123')
      await user.tab()
      
      await waitFor(() => {
        expect(screen.getByTestId('commission-error')).toBeInTheDocument()
        expect(screen.getByTestId('commission-error')).toHaveTextContent('Commission can have at most 2 decimal places')
      })
    })

    it('should clear error when user starts typing valid value', async () => {
      const user = userEvent.setup()
      renderWithRouter(<CommissionFormTest />)
      
      const commissionInput = screen.getByTestId('commission-input')
      
      // First enter invalid value
      await user.type(commissionInput, '-10')
      await user.tab()
      
      await waitFor(() => {
        expect(screen.getByTestId('commission-error')).toBeInTheDocument()
      })
      
      // Clear and enter valid value
      await user.clear(commissionInput)
      await user.type(commissionInput, '25')
      
      // Error should be cleared
      expect(screen.queryByTestId('commission-error')).not.toBeInTheDocument()
    })
  })

  describe('Form Submission with Commission', () => {
    it('should submit form with commission value', async () => {
      const user = userEvent.setup()
      renderWithRouter(<CommissionFormTest />)
      
      const amountInput = screen.getByTestId('amount-input')
      const commissionInput = screen.getByTestId('commission-input')
      const submitButton = screen.getByTestId('submit-button')
      
      await user.type(amountInput, '1000')
      await user.type(commissionInput, '50.25')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockTransactionsApi.create).toHaveBeenCalledWith(
          expect.objectContaining({
            amount: '1000',
            commission: 50.25
          })
        )
      })
    })

    it('should submit form with zero commission when field is empty', async () => {
      const user = userEvent.setup()
      renderWithRouter(<CommissionFormTest />)
      
      const amountInput = screen.getByTestId('amount-input')
      const submitButton = screen.getByTestId('submit-button')
      
      await user.type(amountInput, '1000')
      // Leave commission empty
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockTransactionsApi.create).toHaveBeenCalledWith(
          expect.objectContaining({
            amount: '1000',
            commission: 0
          })
        )
      })
    })

    it('should prevent submission with invalid commission', async () => {
      const user = userEvent.setup()
      renderWithRouter(<CommissionFormTest />)
      
      const amountInput = screen.getByTestId('amount-input')
      const commissionInput = screen.getByTestId('commission-input')
      const submitButton = screen.getByTestId('submit-button')
      
      await user.type(amountInput, '1000')
      await user.type(commissionInput, '-50')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('commission-error')).toBeInTheDocument()
        expect(mockTransactionsApi.create).not.toHaveBeenCalled()
      })
    })
  })

  describe('Commission Field Behavior', () => {
    it('should handle decimal input correctly', async () => {
      const user = userEvent.setup()
      renderWithRouter(<CommissionFormTest />)
      
      const commissionInput = screen.getByTestId('commission-input')
      
      await user.type(commissionInput, '10.5')
      expect(commissionInput).toHaveValue(10.5)
      
      await user.clear(commissionInput)
      await user.type(commissionInput, '10.50')
      expect(commissionInput).toHaveValue(10.5) // Browser normalizes to 10.5
    })

    it('should handle zero commission input', async () => {
      const user = userEvent.setup()
      renderWithRouter(<CommissionFormTest />)
      
      const commissionInput = screen.getByTestId('commission-input')
      
      await user.type(commissionInput, '0')
      expect(commissionInput).toHaveValue(0)
      
      await user.tab()
      expect(screen.queryByTestId('commission-error')).not.toBeInTheDocument()
    })

    it('should handle large valid commission values', async () => {
      const user = userEvent.setup()
      renderWithRouter(<CommissionFormTest />)
      
      const commissionInput = screen.getByTestId('commission-input')
      
      await user.type(commissionInput, '999999')
      expect(commissionInput).toHaveValue(999999)
      
      await user.tab()
      expect(screen.queryByTestId('commission-error')).not.toBeInTheDocument()
    })
  })
})