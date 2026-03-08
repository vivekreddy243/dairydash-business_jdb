/*
  # Add customer delivery option fields

  Adds delivery option support directly on customers table.
*/

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS delivery_option text DEFAULT 'Daily';

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS custom_delivery_notes text;

UPDATE customers
SET delivery_option = 'Daily'
WHERE delivery_option IS NULL;

ALTER TABLE customers
  ALTER COLUMN delivery_option SET NOT NULL;
