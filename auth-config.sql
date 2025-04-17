-- Configuração de Autenticação e Validação de Usuários no Supabase
-- Execute este script no SQL Editor do Supabase

-- PARTE 1: Configuração da tabela de usuários
-- Primeiro, dropar todas as políticas existentes para evitar conflitos
DO $$
BEGIN
  -- Verificar e remover políticas existentes na tabela users
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') THEN
    DROP POLICY IF EXISTS "Usuários podem ver seus próprios dados" ON users;
    DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios dados" ON users;
    DROP POLICY IF EXISTS "Super admins podem ver todos os usuários" ON users;
    DROP POLICY IF EXISTS "Super admins podem gerenciar todos os usuários" ON users;
    DROP POLICY IF EXISTS "Permitir inserção de novos usuários" ON users;
    DROP POLICY IF EXISTS "Permitir leitura pelos próprios usuários" ON users;
    DROP POLICY IF EXISTS "Permitir atualização pelos próprios usuários" ON users;
  END IF;
END
$$;

-- Recriar a tabela users com todas as colunas necessárias
CREATE TABLE IF NOT EXISTS users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'super_admin')),
  approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Habilitar Row Level Security (RLS) para a tabela users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- PARTE 2: Criar políticas de segurança (RLS Policies)
-- Política para permitir que usuários vejam apenas seus próprios dados
CREATE POLICY "Usuários podem ver seus próprios dados" ON users
FOR SELECT USING (auth.uid() = id);

-- Política para permitir que usuários atualizem apenas seus próprios dados
CREATE POLICY "Usuários podem atualizar seus próprios dados" ON users
FOR UPDATE USING (auth.uid() = id);

-- Política para permitir que super_admins vejam todos os usuários
CREATE POLICY "Super admins podem ver todos os usuários" ON users
FOR SELECT USING (
  auth.uid() IN (SELECT id FROM users WHERE role = 'super_admin')
);

-- Política para permitir que super_admins gerenciem todos os usuários (operações CRUD)
CREATE POLICY "Super admins podem gerenciar todos os usuários" ON users
FOR ALL USING (
  auth.uid() IN (SELECT id FROM users WHERE role = 'super_admin')
);

-- Política para permitir inserção de novos usuários durante o registro
CREATE POLICY "Permitir inserção de novos usuários" ON users
FOR INSERT WITH CHECK (auth.uid() = id);

-- PARTE 3: Triggers para atualização automática de timestamps
-- Função para atualizar o timestamp 'updated_at'
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar o timestamp 'updated_at' quando um registro é atualizado
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- PARTE 4: Configurar primeiro super_admin manualmente (deve ser executado após o primeiro registro)
-- Você pode comentar esta parte e descomentá-la após registrar o primeiro usuário

/*
-- Substitua o UUID abaixo pelo UUID do seu primeiro usuário após o registro
UPDATE users
SET role = 'super_admin', approved = TRUE
WHERE id = '00000000-0000-0000-0000-000000000000';  -- Substitua por um UUID válido
*/

-- PARTE 5: Função para criar um perfil de usuário automaticamente após o registro
-- Esta função é acionada quando um novo usuário é criado no auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role, approved)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    'user',
    FALSE
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar automaticamente um perfil quando um novo usuário se registra
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- PARTE 6: Configuração de proteção para tabelas relacionadas (bars e events)
-- Atualizar políticas para garantir que apenas usuários autenticados podem modificar dados

-- Políticas para a tabela 'bars'
ALTER TABLE bars ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON bars;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON bars;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON bars;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON bars;

CREATE POLICY "Enable read access for all users" ON bars
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON bars
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() IN (SELECT id FROM users WHERE role = 'super_admin')
  );

CREATE POLICY "Enable update for authenticated users" ON bars
  FOR UPDATE TO authenticated USING (
    auth.uid() IN (SELECT id FROM users WHERE role = 'super_admin')
  );

CREATE POLICY "Enable delete for authenticated users" ON bars
  FOR DELETE TO authenticated USING (
    auth.uid() IN (SELECT id FROM users WHERE role = 'super_admin')
  );

-- Políticas para a tabela 'events'
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON events;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON events;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON events;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON events;

CREATE POLICY "Enable read access for all users" ON events
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON events
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() IN (SELECT id FROM users WHERE role = 'super_admin')
  );

CREATE POLICY "Enable update for authenticated users" ON events
  FOR UPDATE TO authenticated USING (
    auth.uid() IN (SELECT id FROM users WHERE role = 'super_admin')
  );

CREATE POLICY "Enable delete for authenticated users" ON events
  FOR DELETE TO authenticated USING (
    auth.uid() IN (SELECT id FROM users WHERE role = 'super_admin')
  );

-- PARTE 7: Configurar storage para imagens de perfil
-- Criar bucket para imagens de perfil se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas para o bucket de imagens de perfil
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
CREATE POLICY "Allow public read access" ON storage.objects FOR SELECT
USING (bucket_id = 'profile-images');

DROP POLICY IF EXISTS "Allow authenticated users to upload their profile images" ON storage.objects;
CREATE POLICY "Allow authenticated users to upload their profile images" ON storage.objects FOR INSERT
TO authenticated WITH CHECK (
  bucket_id = 'profile-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Allow users to update their own profile images" ON storage.objects;
CREATE POLICY "Allow users to update their own profile images" ON storage.objects FOR UPDATE
TO authenticated USING (
  bucket_id = 'profile-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Allow users to delete their own profile images" ON storage.objects;
CREATE POLICY "Allow users to delete their own profile images" ON storage.objects FOR DELETE
TO authenticated USING (
  bucket_id = 'profile-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
); 