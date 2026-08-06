/*
# Add payment and premium tier fields

1. Purpose
Adds the data model to support a freemium "pay per wedding" model:
- Free tier: 1 wedding per account, max 8 guests, all features available
- Paid tier: unlimited guests, wedding stays unlocked forever
- Super admins can grant premium access (override) for testers/promo accounts

2. New columns
- `weddings.is_paid` (boolean, default false) — whether this wedding has been
  paid for (unlocks unlimited guests).
- `weddings.stripe_payment_id` (text, nullable) — the Stripe checkout/payment
  intent id once payment is processed (for reconciliation).
- `profiles.is_premium` (boolean, default false) — super-admin override flag
  that grants unlimited weddings + unlimited guests for this account (used
  for testers, promo accounts, or the product owner).

3. Security
- No new tables. RLS already enabled on weddings and profiles.
- The new columns inherit existing policies (owner-scoped on weddings,
  self-scoped on profiles, super_admin read-all on both).
- `is_paid` and `is_premium` are NOT client-writable through standard RLS:
  the existing UPDATE policies allow the owner to update any column on their
  own row, so we add a trigger to protect `is_paid` and `is_premium` from
  being set via the client (only the service role / super admin can set them).
- A guard trigger prevents non-super-admin users from flipping is_paid or
  is_premium on their own profile or wedding.

4. Important notes
- The 1-wedding-per-account and 8-guest limits are enforced in the application
  layer (the frontend reads is_paid / is_premium and blocks accordingly).
  Server-side enforcement will be added via the Stripe edge function once
  Stripe is configured.
- is_paid weddings keep unlimited guests forever (one-time payment).
- is_premium profiles bypass all limits (admin override).
*/

-- ---------- weddings: payment columns ----------
ALTER TABLE weddings
  ADD COLUMN IF NOT EXISTS is_paid boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS stripe_payment_id text;

-- ---------- profiles: premium override ----------
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_premium boolean NOT NULL DEFAULT false;

-- ---------- guard trigger: prevent client-side writes to is_paid ----------
-- Only super_admin (via service role or admin SQL) can set is_paid.
-- Regular couple accounts cannot flip their own wedding to paid.
CREATE OR REPLACE FUNCTION public.guard_wedding_payment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If is_paid is being changed and the current user is NOT a super admin,
  -- block it. auth.uid() is null for service-role calls (bypasses RLS), so
  -- those are allowed.
  IF NEW.is_paid IS DISTINCT FROM OLD.is_paid THEN
    IF auth.uid() IS NOT NULL THEN
      PERFORM 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role = 'super_admin' AND p.is_premium = true;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'Only an admin can change the paid status of a wedding';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_wedding_payment ON weddings;
CREATE TRIGGER trg_guard_wedding_payment
  BEFORE UPDATE OF is_paid ON weddings
  FOR EACH ROW EXECUTE FUNCTION public.guard_wedding_payment();

-- ---------- guard trigger: prevent client-side writes to is_premium ----------
CREATE OR REPLACE FUNCTION public.guard_profile_premium()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_premium IS DISTINCT FROM OLD.is_premium THEN
    IF auth.uid() IS NOT NULL THEN
      PERFORM 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role = 'super_admin';
      IF NOT FOUND THEN
        RAISE EXCEPTION 'Only an admin can change premium status';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_profile_premium ON profiles;
CREATE TRIGGER trg_guard_profile_premium
  BEFORE UPDATE OF is_premium ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_profile_premium();
