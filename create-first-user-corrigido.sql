-- Script para criar um novo usuário diretamente pelo SQL (VERSÃO CORRIGIDA)
-- IMPORTANTE: Este método só deve ser usado em desenvolvimento!

-- 1. Inserir usuário diretamente na tabela auth.users
-- Primeiro verificar se o usuário já existe
DO $$
DECLARE
  user_exists BOOLEAN;
  new_user_id UUID := uuid_generate_v4();
BEGIN
  -- Verificar se o usuário já existe
  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'marcos.rherculano@gmail.com'
  ) INTO user_exists;
  
  IF user_exists THEN
    -- Atualizar usuário existente
    UPDATE auth.users 
    SET 
      encrypted_password = crypt('markinhos123', gen_salt('bf')),
      email_confirmed_at = now(),
      updated_at = now(),
      raw_user_meta_data = '{"name":"Marcos Herculano"}'
    WHERE email = 'marcos.rherculano@gmail.com';
    
    RAISE NOTICE 'Usuário existente atualizado com sucesso.';
  ELSE
    -- Inserir novo usuário
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
      '00000000-0000-0000-0000-000000000000', -- instance_id (substituir pelo valor correto se necessário)
      new_user_id, -- id 
      'authenticated', -- aud
      'authenticated', -- role
      'marcos.rherculano@gmail.com', -- email
      crypt('markinhos123', gen_salt('bf')), -- encrypted_password
      now(), -- email_confirmed_at
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
    );
    
    RAISE NOTICE 'Novo usuário criado com sucesso.';
  END IF;
END
$$;

-- 2. Obter o ID do usuário e atualizar a tabela users
DO $$
DECLARE
  user_id UUID;
  user_exists BOOLEAN;
BEGIN
  -- Obter o ID do usuário
  SELECT id INTO user_id FROM auth.users WHERE email = 'marcos.rherculano@gmail.com';
  
  -- Verificar se o registro já existe na tabela users
  SELECT EXISTS (
    SELECT 1 FROM users WHERE id = user_id
  ) INTO user_exists;
  
  IF user_exists THEN
    -- Atualizar registro existente
    UPDATE users
    SET 
      role = 'super_admin',
      approved = TRUE,
      name = 'Marcos Herculano'
    WHERE id = user_id;
    
    RAISE NOTICE 'Usuário na tabela users atualizado com sucesso.';
  ELSE
    -- Inserir novo registro
    INSERT INTO users (id, email, name, role, approved)
    VALUES (
      user_id,
      'marcos.rherculano@gmail.com',
      'Marcos Herculano',
      'super_admin',
      TRUE
    );
    
    RAISE NOTICE 'Usuário na tabela users criado com sucesso.';
  END IF;
  
  RAISE NOTICE 'ID do usuário: %', user_id;
END
$$;

-- 3. Verificar se o usuário foi criado
SELECT * FROM auth.users WHERE email = 'marcos.rherculano@gmail.com';
SELECT * FROM users WHERE email = 'marcos.rherculano@gmail.com'; 