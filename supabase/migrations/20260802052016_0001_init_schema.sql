/*
# EverAfter — initial schema

1. Purpose
A digital wedding guest book. Couples (admins) create a wedding, upload a guest
list, and share a QR code per guest. Guests open the link, take a selfie, write a
message, and optionally record video/voice. Admins get a live dashboard and a
slideshow mode for the reception.

2. Roles & access model
- Couple (admin): an authenticated Supabase user who owns one or more weddings.
  All admin reads/writes are scoped by `weddings.admin_user_id = auth.uid()`.
- Guest: NOT authenticated. Guests reach their page via a private token in the
  QR URL. Guest reads/writes go through edge functions using the service role
  key, which validate the token server-side. The anon key is only used for
  media uploads to a dedicated storage bucket.
- Super admin: an authenticated user with `role = 'super_admin'` in profiles.

3. New tables
- `profiles` — extends auth.users with a role.
- `weddings` — one per couple.
- `guests` — the guest list.
- `submissions` — one per guest (unique on guest_id).
- `notification_log` — admin-initiated messages sent to guests.

4. Security
- RLS enabled on every table.
- Admin (couple) policies use `auth.uid() = weddings.admin_user_id` directly on
  weddings, and an EXISTS check through weddings for guests/submissions/
  notification_log.
- Guest access is NOT via RLS — it is via edge functions using the service role
  key, which validate `guests.access_token`. No anon SELECT/INSERT policies are
  needed on the data tables.
- `profiles`: each user reads/updates only their own row.

5. Storage
- Bucket `wedding-media` (public read; anon upload; authenticated can delete).
*/

-- ---------- profiles ----------
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'couple' CHECK (role IN ('couple', 'super_admin')),
  full_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "super_admin_read_all_profiles" ON profiles;
CREATE POLICY "super_admin_read_all_profiles" ON profiles FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin')
  );

-- ---------- weddings ----------
CREATE TABLE IF NOT EXISTS weddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_one_name text NOT NULL,
  partner_two_name text NOT NULL,
  couple_display_name text NOT NULL,
  wedding_date date,
  venue text,
  guest_slug text NOT NULL UNIQUE,
  admin_slug text NOT NULL UNIQUE,
  welcome_message text NOT NULL DEFAULT 'Please help us create memories we''ll treasure forever.',
  slideshow_enabled boolean NOT NULL DEFAULT false,
  theme jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','live','archived')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE weddings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_weddings" ON weddings;
CREATE POLICY "select_own_weddings" ON weddings FOR SELECT
  TO authenticated USING (auth.uid() = admin_user_id);

DROP POLICY IF EXISTS "insert_own_weddings" ON weddings;
CREATE POLICY "insert_own_weddings" ON weddings FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = admin_user_id);

DROP POLICY IF EXISTS "update_own_weddings" ON weddings;
CREATE POLICY "update_own_weddings" ON weddings FOR UPDATE
  TO authenticated USING (auth.uid() = admin_user_id) WITH CHECK (auth.uid() = admin_user_id);

DROP POLICY IF EXISTS "delete_own_weddings" ON weddings;
CREATE POLICY "delete_own_weddings" ON weddings FOR DELETE
  TO authenticated USING (auth.uid() = admin_user_id);

DROP POLICY IF EXISTS "super_admin_read_all_weddings" ON weddings;
CREATE POLICY "super_admin_read_all_weddings" ON weddings FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin')
  );

-- ---------- guests ----------
CREATE TABLE IF NOT EXISTS guests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  mobile_number text,
  email text,
  table_number text,
  rsvp_status text NOT NULL DEFAULT 'pending' CHECK (rsvp_status IN ('pending','confirmed','declined')),
  group_name text,
  access_token uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_guests_wedding_id ON guests(wedding_id);
CREATE INDEX IF NOT EXISTS idx_guests_wedding_completed ON guests(wedding_id, completed);
CREATE INDEX IF NOT EXISTS idx_guests_access_token ON guests(access_token);

ALTER TABLE guests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_guests" ON guests;
CREATE POLICY "select_own_guests" ON guests FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM weddings w WHERE w.id = guests.wedding_id AND w.admin_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_guests" ON guests;
CREATE POLICY "insert_own_guests" ON guests FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM weddings w WHERE w.id = guests.wedding_id AND w.admin_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_guests" ON guests;
CREATE POLICY "update_own_guests" ON guests FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM weddings w WHERE w.id = guests.wedding_id AND w.admin_user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM weddings w WHERE w.id = guests.wedding_id AND w.admin_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_guests" ON guests;
CREATE POLICY "delete_own_guests" ON guests FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM weddings w WHERE w.id = guests.wedding_id AND w.admin_user_id = auth.uid())
  );

-- ---------- submissions ----------
CREATE TABLE IF NOT EXISTS submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id uuid NOT NULL UNIQUE REFERENCES guests(id) ON DELETE CASCADE,
  wedding_id uuid NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  message text NOT NULL DEFAULT '',
  photo_path text,
  video_path text,
  voice_path text,
  device_info text,
  submitted_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_submissions_wedding_id ON submissions(wedding_id);

ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_submissions" ON submissions;
CREATE POLICY "select_own_submissions" ON submissions FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM weddings w WHERE w.id = submissions.wedding_id AND w.admin_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_submissions" ON submissions;
CREATE POLICY "insert_own_submissions" ON submissions FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM weddings w WHERE w.id = submissions.wedding_id AND w.admin_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_submissions" ON submissions;
CREATE POLICY "update_own_submissions" ON submissions FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM weddings w WHERE w.id = submissions.wedding_id AND w.admin_user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM weddings w WHERE w.id = submissions.wedding_id AND w.admin_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_submissions" ON submissions;
CREATE POLICY "delete_own_submissions" ON submissions FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM weddings w WHERE w.id = submissions.wedding_id AND w.admin_user_id = auth.uid())
  );

-- ---------- notification_log ----------
CREATE TABLE IF NOT EXISTS notification_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (channel IN ('whatsapp','sms','email')),
  template text NOT NULL CHECK (template IN ('welcome','reminder','last_chance','custom')),
  message_body text,
  recipient_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','failed')),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_wedding_id ON notification_log(wedding_id);

ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_notifications" ON notification_log;
CREATE POLICY "select_own_notifications" ON notification_log FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM weddings w WHERE w.id = notification_log.wedding_id AND w.admin_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_notifications" ON notification_log;
CREATE POLICY "insert_own_notifications" ON notification_log FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM weddings w WHERE w.id = notification_log.wedding_id AND w.admin_user_id = auth.uid())
  );

-- ---------- auto-create profile on signup ----------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---------- storage bucket ----------
INSERT INTO storage.buckets (id, name, public)
VALUES ('wedding-media', 'wedding-media', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "read_wedding_media" ON storage.objects;
CREATE POLICY "read_wedding_media" ON storage.objects FOR SELECT
  TO anon, authenticated USING (bucket_id = 'wedding-media');

DROP POLICY IF EXISTS "upload_wedding_media" ON storage.objects;
CREATE POLICY "upload_wedding_media" ON storage.objects FOR INSERT
  TO anon, authenticated WITH CHECK (bucket_id = 'wedding-media');

DROP POLICY IF EXISTS "update_wedding_media" ON storage.objects;
CREATE POLICY "update_wedding_media" ON storage.objects FOR UPDATE
  TO authenticated USING (bucket_id = 'wedding-media') WITH CHECK (bucket_id = 'wedding-media');

DROP POLICY IF EXISTS "delete_wedding_media" ON storage.objects;
CREATE POLICY "delete_wedding_media" ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'wedding-media');
