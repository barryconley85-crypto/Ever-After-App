/*
# Fix infinite recursion in profiles super_admin policy

1. Problem
The `super_admin_read_all_profiles` policy on the `profiles` table queries
`profiles` itself inside the policy predicate, causing infinite recursion
when any SELECT on profiles is evaluated. This blocked the wedding insert
flow because the `weddings` insert policy references `auth.uid()`, which
triggers profile evaluation.

2. Fix
Replace the self-referencing subquery with `auth.jwt() ->> 'role'` check
against the JWT's `user_role` claim. This avoids querying the profiles
table from within its own policy.
*/

-- Drop the recursive policy
DROP POLICY IF EXISTS "super_admin_read_all_profiles" ON profiles;

-- Replace with a JWT-based check that doesn't recurse
CREATE POLICY "super_admin_read_all_profiles" ON profiles FOR SELECT
  TO authenticated
  USING (
    COALESCE((auth.jwt() -> 'user_role')::text, '') = '"super_admin"'
  );

-- Also fix the same pattern on weddings
DROP POLICY IF EXISTS "super_admin_read_all_weddings" ON weddings;

CREATE POLICY "super_admin_read_all_weddings" ON weddings FOR SELECT
  TO authenticated
  USING (
    COALESCE((auth.jwt() -> 'user_role')::text, '') = '"super_admin"'
  );
