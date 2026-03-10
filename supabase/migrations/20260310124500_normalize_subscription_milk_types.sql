/*
  # Normalize subscription milk types

  Converts legacy milk type values to the new allowed values and enforces
  the new set going forward.
*/

UPDATE subscriptions
SET milk_type = CASE
  WHEN milk_type = 'Regular' THEN 'cow_milk'
  WHEN milk_type = 'Toned' THEN 'curd'
  WHEN milk_type = 'Full Cream' THEN 'buffalo_milk'
  WHEN milk_type IS NULL OR btrim(milk_type) = '' THEN 'cow_milk'
  ELSE milk_type
END;

ALTER TABLE subscriptions
  ALTER COLUMN milk_type SET DEFAULT 'cow_milk';

ALTER TABLE subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_milk_type_check;

ALTER TABLE subscriptions
  ADD CONSTRAINT subscriptions_milk_type_check
  CHECK (milk_type IN ('buffalo_milk', 'curd', 'cow_milk'));
