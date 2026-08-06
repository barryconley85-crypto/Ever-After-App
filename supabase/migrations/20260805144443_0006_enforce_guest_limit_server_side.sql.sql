/*
# Server-side enforcement of free-tier guest limit

Adds a trigger on the guests table that prevents inserting beyond the
FREE_GUEST_LIMIT (8) for weddings that are not paid and whose owner is not
a premium account. This is a defence-in-depth measure — the UI already
blocks the action, but this ensures the limit can't be bypassed via a
direct API call.
*/

CREATE OR REPLACE FUNCTION public.enforce_guest_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  w_is_paid boolean;
  w_owner uuid;
  owner_is_premium boolean;
  current_count integer;
BEGIN
  -- Look up the wedding
  SELECT is_paid, owner_id INTO w_is_paid, w_owner
    FROM public.weddings WHERE id = NEW.wedding_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Wedding not found';
  END IF;

  -- If wedding is paid, no limit
  IF w_is_paid THEN
    RETURN NEW;
  END IF;

  -- Check if owner is premium
  SELECT is_premium INTO owner_is_premium
    FROM public.profiles WHERE id = w_owner;

  IF owner_is_premium THEN
    RETURN NEW;
  END IF;

  -- Count existing guests for this wedding
  SELECT count(*) INTO current_count
    FROM public.guests WHERE wedding_id = NEW.wedding_id;

  IF current_count >= 8 THEN
    RAISE EXCEPTION 'Free plan limit reached: max 8 guests per wedding. Upgrade to add more.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_guest_limit ON guests;
CREATE TRIGGER trg_enforce_guest_limit
  BEFORE INSERT ON guests
  FOR EACH ROW EXECUTE FUNCTION public.enforce_guest_limit();
