/*
# Server-side enforcement of 1-wedding-per-account free-tier limit

Prevents a non-premium account from creating more than 1 wedding.
Premium accounts (is_premium = true) bypass this limit.
*/

CREATE OR REPLACE FUNCTION public.enforce_wedding_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  owner_is_premium boolean;
  wedding_count integer;
BEGIN
  -- Check if owner is premium
  SELECT is_premium INTO owner_is_premium
    FROM public.profiles WHERE id = NEW.owner_id;

  IF owner_is_premium THEN
    RETURN NEW;
  END IF;

  -- Count existing weddings for this owner (excluding the one being updated, if UPDATE)
  IF TG_OP = 'INSERT' THEN
    SELECT count(*) INTO wedding_count
      FROM public.weddings WHERE owner_id = NEW.owner_id;
  ELSE
    SELECT count(*) INTO wedding_count
      FROM public.weddings WHERE owner_id = NEW.owner_id AND id <> NEW.id;
  END IF;

  IF wedding_count >= 1 THEN
    RAISE EXCEPTION 'Free plan limit reached: max 1 wedding per account. Upgrade to create more.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_wedding_limit ON weddings;
CREATE TRIGGER trg_enforce_wedding_limit
  BEFORE INSERT ON weddings
  FOR EACH ROW EXECUTE FUNCTION public.enforce_wedding_limit();
