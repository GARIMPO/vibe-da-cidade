-- Script para criar um novo usuário diretamente pelo SQL
-- IMPORTANTE: Este método só deve ser usado em desenvolvimento!
-- ATENÇÃO: A senha será armazenada em texto simples, então mude-a depois no dashboard do Supabase

-- Remover o usuário existente se necessário (descomente se quiser excluir)
-- DELETE FROM auth.users WHERE email = 'marcos.rherculano@gmail.com';

-- 1. Inserir usuário diretamente na tabela auth.users
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
VALUES (
  '00000000-0000-0000-0000-000000000000', -- instance_id
  uuid_generate_v4(), -- id (gerar UUID automático)
  'authenticated', -- aud
  'authenticated', -- role
  'marcos.rherculano@gmail.com', -- email
  crypt('markinhos123', gen_salt('bf')), -- encrypted_password
  now(), -- email_confirmed_at (confirmado automaticamente)
  NULL, -- recovery_sent_at
  NULL, -- last_sign_in_at
  '{"provider":"email","providers":["email"]}', -- raw_app_meta_data
  '{"name":"Marcos Herculano"}', -- raw_user_meta_data
  now(), -- created_at
  now(), -- updated_at
  '', -- confirmation_token
  NULL, -- email_change
  '', -- email_change_token_new
  '' -- recovery_token
)
ON CONFLICT (email) DO 
  UPDATE SET 
    encrypted_password = crypt('markinhos123', gen_salt('bf')),
    email_confirmed_at = now(),
    updated_at = now(),
    raw_user_meta_data = '{"name":"Marcos Herculano"}';

-- 2. Obter o ID do usuário recém-criado ou existente
DO $$
DECLARE
  user_id UUID;
BEGIN
  -- Obter o ID do usuário
  SELECT id INTO user_id FROM auth.users WHERE email = 'marcos.rherculano@gmail.com';
  
  -- Atualizar a tabela public.users
  INSERT INTO users (id, email, name, role, approved)
  VALUES (
    user_id,
    'marcos.rherculano@gmail.com',
    'Marcos Herculano',
    'super_admin',
    TRUE
  )
  ON CONFLICT (id) DO 
    UPDATE SET 
      role = 'super_admin',
      approved = TRUE,
      name = 'Marcos Herculano';
      
  RAISE NOTICE 'Usuário criado com sucesso! ID: %', user_id;
END
$$;

-- 3. Verificar se o usuário foi criado
SELECT * FROM auth.users WHERE email = 'marcos.rherculano@gmail.com';
SELECT * FROM users WHERE email = 'marcos.rherculano@gmail.com'; 