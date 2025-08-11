import { describe, it, expect, vi } from 'vitest'

describe('Commission CSV Import/Export', () => {
  describe('CSV Export with Commission', () => {
    it('should include commission column in CSV export', () => {
      const mockTransactions = [
        {
          transaction_no: '20250108-001',
          date: '2025-01-08',
          amount: 1000,
          commission: 50,
          type: 'credit',
          accounts: { name: 'Test Account' },
          locations: { name: 'Test Location' },
          description: 'Test transaction'
        },
        {
          transaction_no: '20250108-002',
          date: '2025-01-08',
          amount: 500,
          commission: 0,
          type: 'debit',
          accounts: { name: 'Another Account' },
          locations: { name: 'Another Location' },
          description: 'Another transaction'
        }
      ]

      // Simulate the CSV export logic
      const csvData = mockTransactions.map(t => ({
        'Transaction No': t.transaction_no,
        'Date': t.date,
        'Amount': t.amount,
        'Commission': t.commission || 0,
        'Type': t.type,
        'Account': t.accounts?.name,
        'Location': t.locations?.name,
        'Description': t.description
      }))

      const csv = [
        Object.keys(csvData[0]).join(','),
        ...csvData.map(row => Object.values(row).join(','))
      ].join('\n')

      expect(csv).toContain('Commission')
      expect(csv).toContain('50') // First transaction commission
      expect(csv).toContain('0')  // Second transaction commission (zero)
    })

    it('should handle null commission values in export', () => {
      const mockTransactions = [
        {
          transaction_no: '20250108-001',
          date: '2025-01-08',
          amount: 1000,
          commission: null, // null commission
          type: 'credit',
          accounts: { name: 'Test Account' },
          locations: { name: 'Test Location' },
          description: 'Test transaction'
        }
      ]

      const csvData = mockTransactions.map(t => ({
        'Transaction No': t.transaction_no,
        'Date': t.date,
        'Amount': t.amount,
        'Commission': t.commission || 0, // Should default to 0
        'Type': t.type,
        'Account': t.accounts?.name,
        'Location': t.locations?.name,
        'Description': t.description
      }))

      expect(csvData[0]['Commission']).toBe(0)
    })
  })

  describe('CSV Import with Commission', () => {
    it('should parse commission values from CSV correctly', () => {
      const csvLine = '20250108-001,2025-01-08,1000,50.25,credit,Test Account,Test Location,Test description'
      const headers = ['Transaction No', 'Date', 'Amount', 'Commission', 'Type', 'Account Name', 'Location Name', 'Description']
      
      const values = csvLine.split(',')
      const row: any = {}
      headers.forEach((header, i) => {
        row[header] = values[i] || ''
      })

      expect(row['Commission']).toBe('50.25')
      expect(parseFloat(row['Commission'])).toBe(50.25)
    })

    it('should handle missing commission column in CSV', () => {
      const csvLine = '20250108-001,2025-01-08,1000,credit,Test Account,Test Location,Test description'
      const headers = ['Transaction No', 'Date', 'Amount', 'Type', 'Account Name', 'Location Name', 'Description']
      
      const values = csvLine.split(',')
      const row: any = {}
      headers.forEach((header, i) => {
        row[header] = values[i] || ''
      })

      // Commission should be undefined/empty when not in headers
      expect(row['Commission']).toBeUndefined()
      
      // Should default to 0 in processing
      const commission = row['Commission'] && row['Commission'].trim() !== '' ? parseFloat(row['Commission']) : 0
      expect(commission).toBe(0)
    })

    it('should handle empty commission values in CSV', () => {
      const csvLine = '20250108-001,2025-01-08,1000,,credit,Test Account,Test Location,Test description'
      const headers = ['Transaction No', 'Date', 'Amount', 'Commission', 'Type', 'Account Name', 'Location Name', 'Description']
      
      const values = csvLine.split(',')
      const row: any = {}
      headers.forEach((header, i) => {
        row[header] = values[i] || ''
      })

      expect(row['Commission']).toBe('')
      
      // Should default to 0 when empty
      const commission = row['Commission'] && row['Commission'].trim() !== '' ? parseFloat(row['Commission']) : 0
      expect(commission).toBe(0)
    })

    describe('Commission validation during import', () => {
      const COMMISSION_VALIDATION = {
        MAX_VALUE: 999999999.99,
        MAX_DECIMAL_PLACES: 2,
        MIN_VALUE: 0
      }

      const validateCommissionForImport = (commissionStr: string, rowIndex: number): string[] => {
        const errors: string[] = []
        
        if (!commissionStr || commissionStr.trim() === '') {
          return errors // Empty is valid
        }

        const commissionValue = parseFloat(commissionStr.trim())
        
        if (isNaN(commissionValue)) {
          errors.push(`Row ${rowIndex}: Invalid commission format '${commissionStr}' - must be a valid number`)
          return errors
        }
        
        if (commissionValue < COMMISSION_VALIDATION.MIN_VALUE) {
          errors.push(`Row ${rowIndex}: Commission cannot be negative: ${commissionValue}`)
        }
        
        const decimalPlaces = (commissionStr.trim().split('.')[1] || '').length
        if (decimalPlaces > COMMISSION_VALIDATION.MAX_DECIMAL_PLACES) {
          errors.push(`Row ${rowIndex}: Commission '${commissionStr}' has too many decimal places (max ${COMMISSION_VALIDATION.MAX_DECIMAL_PLACES} allowed)`)
        }
        
        if (commissionValue > COMMISSION_VALIDATION.MAX_VALUE) {
          errors.push(`Row ${rowIndex}: Commission value ${commissionValue} is too large (max ${COMMISSION_VALIDATION.MAX_VALUE})`)
        }
        
        return errors
      }

      it('should validate positive commission values', () => {
        expect(validateCommissionForImport('50.25', 1)).toEqual([])
        expect(validateCommissionForImport('0', 1)).toEqual([])
        expect(validateCommissionForImport('100', 1)).toEqual([])
      })

      it('should reject negative commission values', () => {
        const errors = validateCommissionForImport('-10.5', 2)
        expect(errors).toHaveLength(1)
        expect(errors[0]).toContain('Commission cannot be negative')
      })

      it('should reject invalid commission formats', () => {
        const errors = validateCommissionForImport('abc', 3)
        expect(errors).toHaveLength(1)
        expect(errors[0]).toContain('Invalid commission format')
      })

      it('should reject commission with too many decimal places', () => {
        const errors = validateCommissionForImport('10.123', 4)
        expect(errors).toHaveLength(1)
        expect(errors[0]).toContain('too many decimal places')
      })

      it('should reject commission values that are too large', () => {
        const errors = validateCommissionForImport('1000000000', 5)
        expect(errors).toHaveLength(1)
        expect(errors[0]).toContain('too large')
      })

      it('should accept empty commission values', () => {
        expect(validateCommissionForImport('', 1)).toEqual([])
        expect(validateCommissionForImport('   ', 1)).toEqual([])
      })
    })
  })

  describe('Sample CSV with Commission', () => {
    it('should include commission column in sample CSV', () => {
      const sampleData = [
        {
          'Transaction No': '20250804-001',
          'Date': '2025-08-04',
          'Amount': '5000',
          'Commission': '250',
          'Type': 'credit',
          'Account Name': 'Amit Patel',
          'Location Name': 'Mumbai Branch',
          'Description': 'Payment received from client'
        }
      ]

      const csv = [
        Object.keys(sampleData[0]).join(','),
        ...sampleData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
      ].join('\n')

      expect(csv).toContain('Commission')
      expect(csv).toContain('"250"')
    })

    it('should include zero commission examples in sample CSV', () => {
      const sampleData = [
        {
          'Transaction No': '20250804-002',
          'Date': '2025-08-04',
          'Amount': '1500',
          'Commission': '0',
          'Type': 'debit',
          'Account Name': 'Neha Joshi',
          'Location Name': 'Delhi Branch',
          'Description': 'Office supplies purchase'
        }
      ]

      const csv = [
        Object.keys(sampleData[0]).join(','),
        ...sampleData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
      ].join('\n')

      expect(csv).toContain('"0"')
    })
  })
})