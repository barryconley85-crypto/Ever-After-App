-- Allow anon to read weddings by guest_slug (for the guest welcome page + slideshow)
CREATE POLICY "anon_select_weddings_by_guest_slug" ON weddings
  FOR SELECT TO anon
  USING (true);

-- Allow anon to read guests belonging to any wedding (guest list page + slideshow)
CREATE POLICY "anon_select_guests" ON guests
  FOR SELECT TO anon
  USING (true);

-- Allow anon to read submissions (slideshow page)
CREATE POLICY "anon_select_submissions" ON submissions
  FOR SELECT TO anon
  USING (true);
