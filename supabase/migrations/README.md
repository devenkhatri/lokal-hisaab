# Database Migrations

## 20241108000001_add_commission_to_transactions.sql

This migration adds a `commission` field to the `transactions` table to track commission amounts associated with each transaction.

### Changes Made:
- Added `commission` column as `DECIMAL(10,2)` with default value `0.00`
- Added `NOT NULL` constraint for data consistency
- Added check constraint to ensure commission values are non-negative
- Added column comment for documentation

### Backward Compatibility:
- Existing transactions will have commission = 0.00 by default
- The field is optional in Insert operations (TypeScript)
- All existing API calls will continue to work without modification

### To Apply Migration:
Run this migration through your Supabase dashboard or CLI to update the database schema.