-- local test user
INSERT INTO auth.users(instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, confirmation_token, recovery_token, email_change_token_new, email_change)
  VALUES ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111', 'authenticated', 'authenticated', 'test@example.com', extensions.crypt('local-test-password', extensions.gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', '', '', '', '');

INSERT INTO auth.identities(id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'email', '{"sub":"11111111-1111-1111-1111-111111111111","email":"test@example.com","email_verified":true}', now(), now(), now());

INSERT INTO public.members(name, email, auth_user_id)
  VALUES ('Test Member', 'test@example.com', '11111111-1111-1111-1111-111111111111');

-- local test robot so you can click submit button
WITH new_robot AS (
INSERT INTO public.robots(code, name, season, kind)
  VALUES
    ('26O', 'Peter Piper', 2026, 'offseason')
  RETURNING
    id)
  INSERT INTO public.subsystems(robot_id, code, name)
  SELECT
    new_robot.id,
    s.code,
    s.name
  FROM
    new_robot
    CROSS JOIN (
      VALUES ('CHS', 'Chassis'),
('PIV', 'Pivot'),
('ELV', 'Elevator'),
('ITK', 'Intake'),
('CLM', 'Climber')) AS s(code, name);

