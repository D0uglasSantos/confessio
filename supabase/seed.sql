INSERT INTO public.churches (id, name, slug)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Paróquia Nossa Senhora de Fátima',
  'paroquia-ns-fatima'
);

INSERT INTO public.sessions (
  id,
  church_id,
  name,
  slug,
  status,
  ticket_prefix,
  starts_at,
  ends_at,
  entry_opened_at
)
VALUES (
  '00000000-0000-0000-0000-000000000010',
  '00000000-0000-0000-0000-000000000001',
  'Confissões Domingo 18h',
  '7DHF92',
  'OPEN',
  'C',
  date_trunc('day', now()) + interval '18 hours',
  date_trunc('day', now()) + interval '20 hours',
  now()
);

INSERT INTO public.stations (id, session_id, name, priest_name, status)
VALUES
  ('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000010', 'Confessionário 01', 'Pe. A', 'AVAILABLE'),
  ('00000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000010', 'Confessionário 02', 'Pe. B', 'AVAILABLE'),
  ('00000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000010', 'Confessionário 03', 'Pe. C', 'AVAILABLE');

-- Admin local (somente desenvolvimento)
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000099',
  'authenticated',
  'authenticated',
  'admin@paroquia.local',
  crypt('admin123', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Admin Local"}'::jsonb,
  now(),
  now(),
  '',
  '',
  '',
  ''
);

INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
)
VALUES (
  '00000000-0000-0000-0000-000000000099',
  '00000000-0000-0000-0000-000000000099',
  jsonb_build_object(
    'sub', '00000000-0000-0000-0000-000000000099',
    'email', 'admin@paroquia.local',
    'email_verified', true
  ),
  'email',
  '00000000-0000-0000-0000-000000000099',
  now(),
  now(),
  now()
);

INSERT INTO public.church_admins (user_id, church_id)
VALUES (
  '00000000-0000-0000-0000-000000000099',
  '00000000-0000-0000-0000-000000000001'
);

-- Admin da plataforma (somente desenvolvimento)
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000098',
  'authenticated',
  'authenticated',
  'global@plataforma.local',
  crypt('global123', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Admin Global"}'::jsonb,
  now(),
  now(),
  '',
  '',
  '',
  ''
);

INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
)
VALUES (
  '00000000-0000-0000-0000-000000000098',
  '00000000-0000-0000-0000-000000000098',
  jsonb_build_object(
    'sub', '00000000-0000-0000-0000-000000000098',
    'email', 'global@plataforma.local',
    'email_verified', true
  ),
  'email',
  '00000000-0000-0000-0000-000000000098',
  now(),
  now(),
  now()
);

INSERT INTO public.global_admins (user_id, role, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000098',
  'owner',
  true
);
