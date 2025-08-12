-- Update decimal precision from 2 to 3 decimal places
-- This migration updates both amount and commission fields to support 3 decimal places

-- Update commission column to support 3 decimal places
ALTER TABLE transactions 
ALTER COLUMN commission TYPE DECIMAL(10,3);

-- Update the default value to reflect 3 decimal places
ALTER TABLE transactions 
ALTER COLUMN commission SET DEFAULT 0.000;

-- Update amount column to support 3 decimal places (if it exists)
-- Note: This assumes the amount column exists and is currently DECIMAL(10,2)
ALTER TABLE transactions 
ALTER COLUMN amount TYPE DECIMAL(10,3);

-- Add comment to document the precision change
COMMENT ON COLUMN transactions.commission IS 'Commission amount associated with the transaction, supports 3 decimal places for precision';
COMMENT ON COLUMN transactions.amount IS 'Transaction amount with 3 decimal places precision';