-- Revert overly-broad anon policies added in 0003
DROP POLICY IF EXISTS "anon_select_weddings_by_guest_slug" ON weddings;
DROP POLICY IF EXISTS "anon_select_guests" ON guests;
DROP POLICY IF EXISTS "anon_select_submissions" ON submissions;
