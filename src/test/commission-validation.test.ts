import { describe, it, expect } from 'vitest'

// Commission validation constants
const COMMISSION_VALIDATION = {
  MAX_VALUE: 999999999.99,
  MAX_DECIMAL_PLACES: 2,
  MIN_VALUE: 0
} as const

// Commission validation function (extracted from Transactions.tsx)
const validateCommission = (value: string): string => {
  if (!value || value.trim() === '') {
    return '' // Empty is valid (defaults to 0)
  }

  const trimmedValue = value.trim()

  // Check if it's a valid number (must be entirely numeric, including scientific notation)
  const numValue = parseFloat(trimmedValue)
  if (isNaN(numValue) || !/^-?\d*\.?\d+([eE][+-]?\d+)?$/.test(trimmedValue)) {
    return 'Commission must be a valid number'
  }

  // Check if it's non-negative
  if (numValue < COMMISSION_VALIDATION.MIN_VALUE) {
    return 'Commission cannot be negative'
  }

  // Check for reasonable decimal places
  const decimalPlaces = (trimmedValue.split('.')[1] || '').length
  if (decimalPlaces > COMMISSION_VALIDATION.MAX_DECIMAL_PLACES) {
    return `Commission can have at most ${COMMISSION_VALIDATION.MAX_DECIMAL_PLACES} decimal places`
  }

  // Check for reasonable maximum value (prevent extremely large values)
  if (numValue > COMMISSION_VALIDATION.MAX_VALUE) {
    return `Commission value is too large (maximum: ${COMMISSION_VALIDATION.MAX_VALUE})`
  }

  return ''
}

describe('Commission Validation', () => {
  describe('Valid commission values', () => {
    it('should accept empty string (defaults to 0)', () => {
      expect(validateCommission('')).toBe('')
    })

    it('should accept whitespace-only string (defaults to 0)', () => {
      expect(validateCommission('   ')).toBe('')
    })

    it('should accept zero', () => {
      expect(validateCommission('0')).toBe('')
      expect(validateCommission('0.00')).toBe('')
    })

    it('should accept positive integers', () => {
      expect(validateCommission('10')).toBe('')
      expect(validateCommission('100')).toBe('')
      expect(validateCommission('1000')).toBe('')
    })

    it('should accept positive decimals with up to 3 decimal places', () => {
      expect(validateCommission('10.5')).toBe('')
      expect(validateCommission('10.500')).toBe('')
      expect(validateCommission('999.999')).toBe('')
    })

    it('should accept values with leading/trailing whitespace', () => {
      expect(validateCommission('  25.50  ')).toBe('')
      expect(validateCommission('\t100\n')).toBe('')
    })

    it('should accept maximum allowed value', () => {
      expect(validateCommission('999999999.999')).toBe('')
    })
  })

  describe('Invalid commission values', () => {
    it('should reject negative values', () => {
      expect(validateCommission('-5')).toBe('Commission cannot be negative')
      expect(validateCommission('-0.01')).toBe('Commission cannot be negative')
      expect(validateCommission('-100.50')).toBe('Commission cannot be negative')
    })

    it('should reject non-numeric values', () => {
      expect(validateCommission('abc')).toBe('Commission must be a valid number')
      expect(validateCommission('10.5a')).toBe('Commission must be a valid number')
      expect(validateCommission('$100')).toBe('Commission must be a valid number')
      expect(validateCommission('10,000')).toBe('Commission must be a valid number')
    })

    it('should reject values with more than 3 decimal places', () => {
      expect(validateCommission('10.1234')).toBe('Commission can have at most 3 decimal places')
      expect(validateCommission('5.99999')).toBe('Commission can have at most 3 decimal places')
      expect(validateCommission('0.0001')).toBe('Commission can have at most 3 decimal places')
    })

    it('should reject values exceeding maximum limit', () => {
      expect(validateCommission('1000000000')).toBe('Commission value is too large (maximum: 999999999.999)')
      expect(validateCommission('999999999.9999')).toBe('Commission can have at most 3 decimal places')
    })
  })

  describe('Edge cases', () => {
    it('should handle scientific notation correctly', () => {
      expect(validateCommission('1e2')).toBe('') // 100
      expect(validateCommission('1e10')).toBe('Commission value is too large (maximum: 999999999.99)')
    })

    it('should handle very small positive numbers', () => {
      expect(validateCommission('0.01')).toBe('')
      expect(validateCommission('0.1')).toBe('')
    })

    it('should handle boundary values', () => {
      expect(validateCommission('999999999.98')).toBe('')
      expect(validateCommission('1000000000.00')).toBe('Commission value is too large (maximum: 999999999.99)')
    })
  })
})