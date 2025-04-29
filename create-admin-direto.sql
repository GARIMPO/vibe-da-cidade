-- Script SQL direto para criar usuário administrador
-- Execute este script no SQL Editor do Supabase

-- 1. Configuração da tabela users
CREATE TABLE IF NOT EXISTS users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  address TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 2. Habilitar Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 3. Adicionar políticas básicas de segurança
DROP POLICY IF EXISTS "Permitir acesso público" ON users;
CREATE POLICY "Permitir acesso público" ON users FOR SELECT USING (true);

-- 4. Remover e recriar o usuário administrador pelo email
DO $$
DECLARE
  admin_id UUID;
BEGIN
  -- Verificar se o usuário já existe na autenticação
  SELECT id INTO admin_id FROM auth.users WHERE email = 'marcos.rherculano@gmail.com';

  -- Se não existe, mostrar mensagem (não podemos criar diretamente pelo SQL)
  IF admin_id IS NULL THEN
    RAISE NOTICE 'Usuário não encontrado na autenticação. Você precisará criar o usuário manualmente pelo aplicativo antes.';
  ELSE
    -- Remover registro existente na tabela users se houver
    DELETE FROM users WHERE email = 'marcos.rherculano@gmail.com';
    
    -- Inserir o usuário como admin
    INSERT INTO users (id, email, name, role, approved)
    VALUES (
      admin_id,
      'marcos.rherculano@gmail.com',
      'Marcos Herculano',
      'super_admin',
      TRUE
    );
    
    RAISE NOTICE 'Usuário configurado como administrador com sucesso!';
  END IF;
END $$;

-- 5. Verificar se o usuário foi configurado
SELECT * FROM users WHERE email = 'marcos.rherculano@gmail.com'; 