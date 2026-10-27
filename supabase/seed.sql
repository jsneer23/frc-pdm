-- local test user
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data,
  confirmation_token, recovery_token, email_change_token_new, email_change
) values (
  '00000000-0000-0000-0000-000000000000',
  '11111111-1111-1111-1111-111111111111',
  'authenticated', 'authenticated',
  'test@example.com',
  extensions.crypt('local-test-password', extensions.gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}', '{}',
  '', '', '', ''
);

insert into auth.identities (
  id, user_id, provider_id, provider, identity_data,
  last_sign_in_at, created_at, updated_at
) values (
  gen_random_uuid(),
  '11111111-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-111111111111',
  'email',
  '{"sub":"11111111-1111-1111-1111-111111111111","email":"test@example.com","email_verified":true}',
  now(), now(), now()
);

insert into public.members (name, auth_user_id)
values ('Test Member', '11111111-1111-1111-1111-111111111111');

-- local test robot so you can click submit button
with new_robot as (
  insert into public.robots (code, name, season, kind)
  values ('26O', 'Peter Piper', 2026, 'offseason')
  returning id
)
insert into public.subsystems (robot_id, code, name)
select new_robot.id, s.code, s.name
from new_robot
cross join (values
  ('CHS', 'Chassis'),
  ('PIV', 'Pivot'),
  ('ELV', 'Elevator'),
  ('ITK', 'Intake'),
  ('CLM', 'Climber')
) as s(code, name);