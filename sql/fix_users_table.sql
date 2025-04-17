-- Primeiro, verificar se a tabela 'users' existe
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') THEN
    -- Remover todas as políticas existentes
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

-- Criar as políticas necessárias
DO $$
BEGIN
  -- Política para permitir que usuários vejam seus próprios dados
  IF NOT EXISTS (SELECT FROM pg_policies WHERE policyname = 'Usuários podem ver seus próprios dados' AND tablename = 'users') THEN
    CREATE POLICY "Usuários podem ver seus próprios dados" ON users
      FOR SELECT USING (auth.uid() = id);
  END IF;
  
  -- Política para permitir que usuários atualizem seus próprios dados
  IF NOT EXISTS (SELECT FROM pg_policies WHERE policyname = 'Usuários podem atualizar seus próprios dados' AND tablename = 'users') THEN
    CREATE POLICY "Usuários podem atualizar seus próprios dados" ON users
      FOR UPDATE USING (auth.uid() = id);
  END IF;
  
  -- Política para permitir que super admins vejam todos os usuários
  IF NOT EXISTS (SELECT FROM pg_policies WHERE policyname = 'Super admins podem ver todos os usuários' AND tablename = 'users') THEN
    CREATE POLICY "Super admins podem ver todos os usuários" ON users
      FOR SELECT USING (
        auth.uid() IN (SELECT id FROM users WHERE role = 'super_admin')
        OR role = 'user'
      );
  END IF;
  
  -- Política para permitir que super admins gerenciem todos os usuários
  IF NOT EXISTS (SELECT FROM pg_policies WHERE policyname = 'Super admins podem gerenciar todos os usuários' AND tablename = 'users') THEN
    CREATE POLICY "Super admins podem gerenciar todos os usuários" ON users
      FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE role = 'super_admin'));
  END IF;
  
  -- Política para permitir inserção de novos usuários (importante para o registro)
  IF NOT EXISTS (SELECT FROM pg_policies WHERE policyname = 'Permitir inserção de novos usuários' AND tablename = 'users') THEN
    CREATE POLICY "Permitir inserção de novos usuários" ON users
      FOR INSERT WITH CHECK (true);
  END IF;
END
$$; 