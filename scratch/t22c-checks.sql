-- T22c checks, run with psql against the local stack.
-- Everything happens in one transaction that rolls back, so nothing is changed.
-- Runs as postgres: Auth's inserts and updates are simulated directly on
-- auth.users, which fires the same triggers as the real service.
-- Each step says what to expect just above it.
\set ON_ERROR_ROLLBACK on
\set ON_ERROR_STOP off
BEGIN;
SELECT
    gen_random_uuid() AS a_id,
    gen_random_uuid() AS b_id,
    gen_random_uuid() AS c_id \gset
-- ---------------------------------------------------------------------------
\echo
\echo '== 1. member first, then account =='
INSERT INTO public.members(name, email)
    VALUES ('Check A', '  Check.A@Example.com ');
\echo 'expect email check.a@example.com (lowercased, trimmed), auth_user_id empty:'
SELECT
    email,
    auth_user_id
FROM
    public.members
WHERE
    name = 'Check A';
INSERT INTO auth.users(id, instance_id, aud, role, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES (:'a_id', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'check.a@example.com', now(), '{}', '{}', now(), now());
\echo 'expect auth_user_id' :a_id
SELECT
    auth_user_id
FROM
    public.members
WHERE
    name = 'Check A';
-- ---------------------------------------------------------------------------
\echo
\echo '== 2. account first, then member =='
INSERT INTO auth.users(id, instance_id, aud, role, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES (:'b_id', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'check.b@example.com', now(), '{}', '{}', now(), now());
INSERT INTO public.members(name, email)
    VALUES ('Check B', 'CHECK.B@example.com');
\echo 'expect auth_user_id' :b_id
SELECT
    auth_user_id
FROM
    public.members
WHERE
    name = 'Check B';
-- ---------------------------------------------------------------------------
\echo
\echo '== 3. an account with no member row is not a member =='
INSERT INTO auth.users(id, instance_id, aud, role, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES (:'c_id', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'check.c@example.com', now(), '{}', '{}', now(), now());
\echo 'expect 0 members linked:'
SELECT
    count(*) AS linked
FROM
    public.members
WHERE
    auth_user_id = :'c_id';
SAVEPOINT as_c;
SET local ROLE authenticated;
SELECT
    set_config('request.jwt.claims', json_build_object('sub', :'c_id', 'role', 'authenticated')::text, TRUE);
\echo 'expect is_member = f:'
SELECT
    private.is_member() AS is_member;
ROLLBACK TO SAVEPOINT as_c;

-- ---------------------------------------------------------------------------
\echo
\echo '== 4. an account email change moves the link =='
INSERT INTO public.members(name, email)
    VALUES ('Check B2', 'check.b2@example.com');

UPDATE
    auth.users
SET
    email = 'check.b2@example.com'
WHERE
    id = :'b_id';

\echo 'expect Check B empty, Check B2 linked to' :b_id
SELECT
    name,
    auth_user_id
FROM
    public.members
WHERE
    name IN ('Check B', 'Check B2')
ORDER BY
    name;

-- ---------------------------------------------------------------------------
\echo
\echo '== 5. a direct edit of auth_user_id is overwritten =='
UPDATE
    public.members
SET
    auth_user_id = NULL
WHERE
    name = 'Check A';

\echo 'expect still' :a_id
SELECT
    auth_user_id
FROM
    public.members
WHERE
    name = 'Check A';

-- ---------------------------------------------------------------------------
\echo
\echo '== 6. deleting the account unlinks the member =='
DELETE FROM auth.users
WHERE id = :'a_id';

\echo 'expect auth_user_id empty:'
SELECT
    auth_user_id
FROM
    public.members
WHERE
    name = 'Check A';

-- ---------------------------------------------------------------------------
\echo
\echo '== 7. the seed test member is linked by email =='
\echo 'expect one row with an email and auth_user_id 1111…:'
SELECT
    name,
    email,
    auth_user_id
FROM
    public.members
WHERE
    auth_user_id = '11111111-1111-1111-1111-111111111111';

ROLLBACK;

