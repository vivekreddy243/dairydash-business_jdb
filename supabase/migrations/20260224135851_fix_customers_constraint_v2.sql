/*
  # Add unique constraint on phone if not exists
*/

DO $$
BEGIN
  BEGIN
    ALTER TABLE customers ADD CONSTRAINT customers_phone_unique UNIQUE (phone);
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END
$$;
