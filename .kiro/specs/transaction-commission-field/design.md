# Design Document: Transaction Commission Field

## Overview

This design outlines the implementation of a commission field for all transactions in the system. The commission field will be added to the database schema, user interface, API layer, and import/export functionality. The implementation will maintain backward compatibility with existing data while providing a seamless user experience for managing commission amounts.

## Architecture

The commission field addition will span across multiple layers of the application:

1. **Database Layer**: Add commission column to the transactions table
2. **API Layer**: Update TypeScript types and API functions to handle commission data
3. **UI Layer**: Modify transaction forms, tables, and displays to include commission
4. **Import/Export Layer**: Update CSV handling to include commission field
5. **Validation Layer**: Add commission validation rules

## Components and Interfaces

### Database Schema Changes

**Table**: `transactions`
- **New Column**: `commission` (DECIMAL/NUMERIC type, nullable, default 0)
- **Migration Strategy**: Add column with default value to preserve existing data
- **Constraints**: Non-negative values only (CHECK constraint)

### TypeScript Type Updates

**File**: `src/integrations/supabase/types.ts`
- Update `transactions` table Row, Insert, and Update types to include `commission?: number`
- Maintain backward compatibility with optional commission field

**File**: `src/lib/api.ts`
- Update Transaction type to include commission field
- Modify API functions to handle commission in CRUD operations

### UI Components

**Transaction Form** (`src/pages/Transactions.tsx`):
- Add commission input field in the transaction form
- Position commission field logically near amount field
- Apply currency formatting and validation
- Include commission in form state management

**Transaction Table**:
- Add commission column to the transactions table display
- Format commission values as currency
- Handle responsive design for additional column

**Import/Export**:
- Update CSV export to include Commission column
- Modify CSV import to accept Commission field
- Update sample CSV file with commission examples
- Handle missing commission values in imports (default to 0)

### Form State Management

**Form Data Structure**:
```typescript
const [formData, setFormData] = useState({
  // ... existing fields
  commission: '', // New field for commission input
})
```

**Validation Rules**:
- Commission must be a non-negative number
- Commission can be empty (defaults to 0)
- Commission supports decimal values (up to 2 decimal places)

## Data Models

### Updated Transaction Model

```typescript
interface Transaction {
  id: string
  transaction_no: string
  date: string
  amount: number
  commission: number // New field
  type: 'credit' | 'debit'
  account_id: string
  location_id: string
  description: string | null
  created_at: string
  updated_at: string
  // Relations
  accounts?: Account
  locations?: Location
}
```

### Database Migration

```sql
-- Add commission column to transactions table
ALTER TABLE transactions 
ADD COLUMN commission DECIMAL(10,2) DEFAULT 0.00 NOT NULL;

-- Add check constraint for non-negative commission
ALTER TABLE transactions 
ADD CONSTRAINT check_commission_non_negative 
CHECK (commission >= 0);
```

## Error Handling

### Validation Errors
- **Invalid Commission Format**: Display user-friendly error for non-numeric commission values
- **Negative Commission**: Prevent negative commission values with validation message
- **Import Errors**: Handle malformed commission data in CSV imports gracefully

### Database Errors
- **Migration Failures**: Provide rollback strategy for schema changes
- **Constraint Violations**: Handle commission constraint violations with appropriate error messages

### API Error Handling
- **Type Validation**: Ensure commission field type safety in API calls
- **Backward Compatibility**: Handle requests without commission field gracefully

## Testing Strategy

### Unit Tests
- **Form Validation**: Test commission field validation rules
- **Currency Formatting**: Test commission display formatting
- **API Functions**: Test CRUD operations with commission field
- **Type Safety**: Test TypeScript type definitions

### Integration Tests
- **Database Operations**: Test commission field storage and retrieval
- **CSV Import/Export**: Test commission handling in file operations
- **Form Submission**: Test end-to-end transaction creation with commission

### User Acceptance Tests
- **Transaction Creation**: Verify users can add commission to new transactions
- **Transaction Editing**: Verify users can modify commission in existing transactions
- **Data Display**: Verify commission appears correctly in transaction lists
- **Import/Export**: Verify commission data is preserved in CSV operations

### Migration Testing
- **Schema Migration**: Test database migration with existing data
- **Data Integrity**: Verify existing transactions maintain their data
- **Default Values**: Verify existing transactions get commission = 0

## Implementation Considerations

### Performance
- Commission field addition should not impact query performance significantly
- Index considerations: Commission field likely doesn't need indexing initially
- CSV processing should handle commission field efficiently

### User Experience
- Commission field should be intuitive and well-positioned in forms
- Currency formatting should be consistent with amount field
- Optional field behavior should be clear to users

### Backward Compatibility
- Existing API calls without commission should continue working
- Database migration should preserve all existing data
- CSV exports from older versions should be importable

### Security
- Commission field should follow same validation patterns as amount field
- No additional security concerns beyond standard input validation
- Audit trail should include commission changes in transaction updates