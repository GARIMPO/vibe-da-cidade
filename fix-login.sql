-- Script para corrigir problemas de login e autenticação
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se a tabela 'users' existe
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') THEN
    -- Atualizar a estrutura da tabela se necessário
    ALTER TABLE users 
      ALTER COLUMN email TYPE TEXT, 
      ALTER COLUMN email SET NOT NULL,
      ALTER COLUMN name SET DEFAULT '',
      ALTER COLUMN approved SET DEFAULT FALSE;
  ELSE
    -- Criar a tabela users se não existir
    CREATE TABLE users (
      id UUID REFERENCES auth.users(id) PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL DEFAULT '',
      phone TEXT,
      address TEXT,
      role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'super_admin')),
      approved BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
    );
  END IF;
  
  -- Habilitar Row Level Security (RLS)
  ALTER TABLE users ENABLE ROW LEVEL SECURITY;
  
  -- Remover políticas existentes
  DROP POLICY IF EXISTS "Usuários podem ver seus próprios dados" ON users;
  DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios dados" ON users;
  DROP POLICY IF EXISTS "Super admins podem ver todos os usuários" ON users;
  DROP POLICY IF EXISTS "Super admins podem gerenciar todos os usuários" ON users;
  DROP POLICY IF EXISTS "Permitir inserção de novos usuários" ON users;
  
  -- Criar políticas de segurança
  CREATE POLICY "Usuários podem ver seus próprios dados" ON users
  FOR SELECT USING (auth.uid() = id);
  
  CREATE POLICY "Usuários podem atualizar seus próprios dados" ON users
  FOR UPDATE USING (auth.uid() = id);
  
  CREATE POLICY "Super admins podem ver todos os usuários" ON users
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM users WHERE role = 'super_admin')
  );
  
  CREATE POLICY "Super admins podem gerenciar todos os usuários" ON users
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM users WHERE role = 'super_admin')
  );
  
  CREATE POLICY "Permitir inserção de novos usuários" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);
END $$;

-- 2. Função para garantir que cada usuário autenticado tenha um registro na tabela users
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
  )
  ON CONFLICT (id) DO
    UPDATE SET email = NEW.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Criar ou recriar o trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- 4. Garantir que todos os usuários autenticados existentes tenham um registro na tabela users
DO $$
DECLARE
  auth_user RECORD;
BEGIN
  FOR auth_user IN 
    SELECT id, email, raw_user_meta_data 
    FROM auth.users
  LOOP
    INSERT INTO users (id, email, name, role, approved)
    VALUES (
      auth_user.id,
      auth_user.email,
      COALESCE(auth_user.raw_user_meta_data->>'name', auth_user.email),
      'user',
      FALSE
    )
    ON CONFLICT (id) DO NOTHING;
  END LOOP;
END $$;

-- 5. Promover o usuário especificado a administrador
-- Substitua o email abaixo pelo email do usuário que deve ser administrador
UPDATE users
SET role = 'super_admin', approved = TRUE
WHERE email = 'marcos.rherculano@gmail.com';

-- 6. Verificar se o usuário foi promovido a administrador
SELECT id, email, name, role, approved 
FROM users 
WHERE email = 'marcos.rherculano@gmail.com';

-- Script corrigido para atualizar políticas e permissões no Supabase
-- Execute este script no SQL Editor do Supabase

-- PARTE 1: CORRIGIR POLÍTICAS PARA BARS
DO $$
BEGIN
  -- Configurar políticas para a tabela bars
  IF EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'bars'
  ) THEN
    -- Habilitar RLS na tabela bars
    ALTER TABLE public.bars ENABLE ROW LEVEL SECURITY;

    -- Remover TODAS as políticas existentes relacionadas a bares
    DROP POLICY IF EXISTS "Usuários podem inserir seu próprio bar" ON public.bars;
    DROP POLICY IF EXISTS "Usuários podem inserir bares" ON public.bars;
    DROP POLICY IF EXISTS "Usuários podem inserir seus próprios bares" ON public.bars;
    DROP POLICY IF EXISTS "Super admin pode gerenciar todos os bares" ON public.bars;
    DROP POLICY IF EXISTS "Super admin pode ver todos os bares" ON public.bars;
    DROP POLICY IF EXISTS "Super admin pode editar todos os bares" ON public.bars;
    DROP POLICY IF EXISTS "Usuários podem ver seu próprio bar" ON public.bars;
    DROP POLICY IF EXISTS "Usuários podem editar seu próprio bar" ON public.bars;
    DROP POLICY IF EXISTS "Usuários podem excluir seu próprio bar" ON public.bars;
    
    -- POLICY 1: Super admin pode fazer TUDO com TODOS os bares (sem restrições)
    CREATE POLICY "Super admin pode gerenciar todos os bares"
      ON public.bars FOR ALL
      USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'super_admin')
      );
    
    -- POLICY 2: Usuários comuns podem inserir seus próprios bares
    CREATE POLICY "Usuários podem inserir seus próprios bares"
      ON public.bars FOR INSERT
      WITH CHECK (
        auth.uid() = user_id
      );
    
    -- POLICY 3: Usuários comuns podem ver seus próprios bares apenas
    CREATE POLICY "Usuários podem ver seu próprio bar"
      ON public.bars FOR SELECT
      USING (auth.uid() = user_id);
    
    -- POLICY 4: Usuários comuns podem editar apenas seus próprios bares
    CREATE POLICY "Usuários podem editar seu próprio bar"
      ON public.bars FOR UPDATE
      USING (auth.uid() = user_id);
    
    -- POLICY 5: Usuários comuns podem excluir apenas seus próprios bares
    CREATE POLICY "Usuários podem excluir seu próprio bar"
      ON public.bars FOR DELETE
      USING (auth.uid() = user_id);
    
    RAISE NOTICE 'Políticas para a tabela bars atualizadas com sucesso';
  END IF;
END $$;

-- PARTE 2: VERIFICAR E REMOVER CONSTRAINT QUE LIMITA UM BAR POR USUÁRIO (se existir)
DO $$
BEGIN
  -- Verificar se existe a constraint e removê-la
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'one_bar_per_user'
  ) THEN
    ALTER TABLE public.bars DROP CONSTRAINT IF EXISTS one_bar_per_user;
    RAISE NOTICE 'Constraint one_bar_per_user removida com sucesso';
  ELSE
    RAISE NOTICE 'Constraint one_bar_per_user não encontrada';
  END IF;
END $$; 