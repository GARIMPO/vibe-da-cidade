-- Script completo para corrigir problemas de registro de usuários
-- Execute este script no SQL Editor do Supabase

-- 1. Correção da tabela users e suas políticas
DO $$
BEGIN
  -- Verificar se a tabela 'users' existe
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') THEN
    -- Remover todas as políticas existentes para evitar conflitos
    DROP POLICY IF EXISTS "Usuários podem ver seus próprios dados" ON users;
    DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios dados" ON users;
    DROP POLICY IF EXISTS "Super admins podem ver todos os usuários" ON users;
    DROP POLICY IF EXISTS "Super admins podem gerenciar todos os usuários" ON users;
    DROP POLICY IF EXISTS "Permitir inserção de novos usuários" ON users;
    
    -- Habilitar RLS se ainda não estiver habilitado
    ALTER TABLE users ENABLE ROW LEVEL SECURITY;
  ELSE
    -- Criar a tabela users se não existir
    CREATE TABLE users (
      id UUID REFERENCES auth.users(id) PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT,
      address TEXT,
      approved BOOLEAN DEFAULT FALSE,
      role TEXT DEFAULT 'user',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
    );
    
    -- Habilitar RLS
    ALTER TABLE users ENABLE ROW LEVEL SECURITY;
  END IF;
END
$$;

-- 2. Criar políticas de acesso para a tabela users
DO $$
BEGIN
  -- Política para permitir que usuários vejam seus próprios dados
  CREATE POLICY "Usuários podem ver seus próprios dados" ON users
    FOR SELECT USING (auth.uid() = id);
  
  -- Política para permitir que usuários atualizem seus próprios dados
  CREATE POLICY "Usuários podem atualizar seus próprios dados" ON users
    FOR UPDATE USING (auth.uid() = id);
  
  -- Política para permitir que super admins vejam todos os usuários
  CREATE POLICY "Super admins podem ver todos os usuários" ON users
    FOR SELECT USING (
      auth.uid() IN (SELECT id FROM users WHERE role = 'super_admin')
      OR role = 'user'
    );
  
  -- Política para permitir que super admins gerenciem todos os usuários
  CREATE POLICY "Super admins podem gerenciar todos os usuários" ON users
    FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE role = 'super_admin'));
  
  -- Política para permitir inserção de novos usuários (importante para o registro)
  CREATE POLICY "Permitir inserção de novos usuários" ON users
    FOR INSERT WITH CHECK (true);
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'Uma ou mais políticas já existem e não foram recriadas.';
END
$$;

-- 3. Configurar storage para imagens de usuários
DO $$
BEGIN
  -- Bucket para imagens de usuário
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE name = 'user-images'
  ) THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('user-images', 'user-images', true);
    
    -- Criar política para leitura pública
    BEGIN
      CREATE POLICY "Política de leitura pública para imagens de usuário" ON storage.objects
        FOR SELECT USING (bucket_id = 'user-images');
    EXCEPTION
      WHEN duplicate_object THEN
        NULL; -- Ignora se a política já existe
    END;
      
    -- Criar política para upload (apenas usuários autenticados)
    BEGIN
      CREATE POLICY "Política de upload para imagens de usuário" ON storage.objects
        FOR INSERT WITH CHECK (
          bucket_id = 'user-images' AND
          auth.role() = 'authenticated'
        );
    EXCEPTION
      WHEN duplicate_object THEN
        NULL; -- Ignora se a política já existe
    END;
      
    -- Criar política para atualização (apenas donos)
    BEGIN
      CREATE POLICY "Política de atualização para imagens de usuário" ON storage.objects
        FOR UPDATE USING (
          bucket_id = 'user-images' AND
          auth.uid()::text = owner
        );
    EXCEPTION
      WHEN duplicate_object THEN
        NULL; -- Ignora se a política já existe
    END;
      
    -- Criar política para exclusão (apenas donos)
    BEGIN
      CREATE POLICY "Política de exclusão para imagens de usuário" ON storage.objects
        FOR DELETE USING (
          bucket_id = 'user-images' AND
          auth.uid()::text = owner
        );
    EXCEPTION
      WHEN duplicate_object THEN
        NULL; -- Ignora se a política já existe
    END;
  END IF;
END
$$;

-- 4. Configurações de autenticação
DO $$
BEGIN
  -- Permitir que todos os usuários se registrem sem restrições
  BEGIN
    CREATE POLICY "Permitir registro público para qualquer pessoa" ON auth.users
      FOR INSERT WITH CHECK (true);
  EXCEPTION
    WHEN duplicate_object THEN
      RAISE NOTICE 'A política de registro público já existe.';
  END;
END
$$;

-- 5. Verificar se existe um super_admin
DO $$
DECLARE
  super_admin_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO super_admin_count FROM users WHERE role = 'super_admin';
  
  IF super_admin_count = 0 THEN
    RAISE WARNING 'Atenção: Não há usuários com role = super_admin. Isso pode causar problemas com políticas RLS.';
  END IF;
END
$$; 