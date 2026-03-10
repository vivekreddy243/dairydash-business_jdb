/*
  # Create or fix settings table and public RLS policy

  The current app reads/writes settings from the browser using the anon key.
  This migration ensures the `settings` table exists and can be read/written
  by the current client-side app model.
*/

CREATE TABLE IF NOT EXISTS settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL DEFAULT 'Jai Durga Bhavani Milk Center',
  default_milk_price decimal NOT NULL DEFAULT 50.00,
  tax_rate decimal NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON settings;
DROP POLICY IF EXISTS "Allow all operations for public users" ON settings;

CREATE POLICY "Allow all operations for public users"
  ON settings
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);
