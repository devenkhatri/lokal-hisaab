# Database Migrations

## 20241108000001_add_commission_to_transactions.sql

This migration adds a `commission` field to the `transactions` table to track commission amounts associated with each transaction.

### Changes Made:
- Added `commission` column as `DECIMAL(10,3)` with default value `0.000` (updated for 3 decimal precision)
- Added `NOT NULL` constraint for data consistency
- Added check constraint to ensure commission values are non-negative
- Added column comment for documentation

### Backward Compatibility:
- Existing transactions will have commission = 0.00 by default
- The field is optional in Insert operations (TypeScript)
- All existing API calls will continue to work without modification

### To Apply Migration:
Run this migration through your Supabase dashboard or CLI to update the database schema.

## Migration 20241108000002 - Update Decimal Precision to 3

### Purpose
Updates the application to support 3 decimal places instead of 2 for better precision in financial calculations.

### Changes Made:
- Updated `commission` column from `DECIMAL(10,2)` to `DECIMAL(10,3)`
- Updated `amount` column from `DECIMAL(10,2)` to `DECIMAL(10,3)`
- Updated default values to reflect 3 decimal places
- Updated column comments to document the precision change

### Impact:
- All monetary values now support 3 decimal places (e.g., ₹1,234.567)
- Existing data is preserved and automatically converted
- Frontend and backend validation updated to match