/*
  # Fix subscriptions RLS for client-side anon access

  This app currently uses the Supabase anon key directly from the browser and
  does not create a Supabase Auth session. That means writes run as the `anon`
  role, not `authenticated`.

  The original subscriptions policy allowed only `authenticated`, which blocks
  inserts/updates from this app. This migration replaces that policy with a
  public policy so the current client-side flow can read/write subscriptions.
*/

DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON subscriptions;
DROP POLICY IF EXISTS "Allow all operations for public users" ON subscriptions;

CREATE POLICY "Allow all operations for public users"
  ON subscriptions
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);
