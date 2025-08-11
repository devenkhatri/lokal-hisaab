-- Add commission column to transactions table
-- This migration adds a commission field to track commission amounts for transactions

-- Add commission column with default value of 0 for backward compatibility
ALTER TABLE transactions 
ADD COLUMN commission DECIMAL(10,2) DEFAULT 0.00 NOT NULL;

-- Add check constraint to ensure commission is non-negative
ALTER TABLE transactions 
ADD CONSTRAINT check_commission_non_negative 
CHECK (commission >= 0);

-- Add comment to document the column purpose
COMMENT ON COLUMN transactions.commission IS 'Commission amount associated with the transaction, defaults to 0 for backward compatibility';