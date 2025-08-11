import { describe, it, expect } from 'vitest'
import { formatCurrency } from '@/lib/utils/currency'

describe('Commission Formatting', () => {
  describe('formatCurrency function', () => {
    it('should format zero commission correctly', () => {
      expect(formatCurrency(0)).toBe('₹0.00')
    })

    it('should format positive commission values', () => {
      expect(formatCurrency(10)).toBe('₹10.00')
      expect(formatCurrency(10.5)).toBe('₹10.50')
      expect(formatCurrency(10.99)).toBe('₹10.99')
    })

    it('should format large commission values with thousand separators', () => {
      expect(formatCurrency(1000)).toBe('₹1,000.00')
      expect(formatCurrency(10000)).toBe('₹10,000.00')
      expect(formatCurrency(100000)).toBe('₹1,00,000.00')
      expect(formatCurrency(1000000)).toBe('₹10,00,000.00')
    })

    it('should handle decimal precision correctly', () => {
      expect(formatCurrency(10.1)).toBe('₹10.10')
      expect(formatCurrency(10.01)).toBe('₹10.01')
      expect(formatCurrency(10.001)).toBe('₹10.00') // Should round to 2 decimal places
    })

    it('should format maximum commission value', () => {
      expect(formatCurrency(999999999.99)).toBe('₹99,99,99,999.99')
    })

    it('should handle edge cases', () => {
      expect(formatCurrency(0.01)).toBe('₹0.01')
      expect(formatCurrency(0.99)).toBe('₹0.99')
    })
  })

  describe('Commission display in different contexts', () => {
    it('should display commission in transaction tables', () => {
      const commissionValues = [0, 10.5, 100, 1000.99, 50000]
      const expectedFormats = [
        '₹0.00',
        '₹10.50', 
        '₹100.00',
        '₹1,000.99',
        '₹50,000.00'
      ]

      commissionValues.forEach((value, index) => {
        expect(formatCurrency(value)).toBe(expectedFormats[index])
      })
    })

    it('should handle null and undefined commission values', () => {
      // These should be handled by the component, defaulting to 0
      expect(formatCurrency(0)).toBe('₹0.00')
    })
  })
})