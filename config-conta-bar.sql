-- Script para configurar contas de usuário e permissões de bar
-- Execute este script no SQL Editor do Supabase

-- Parte 1: Verificar e ajustar a tabela de usuários
DO $$
BEGIN
  -- Verificar se a coluna 'role' está configurada corretamente
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'role'
  ) THEN
    RAISE NOTICE 'Coluna role já existe na tabela users';
  ELSE
    RAISE NOTICE 'Adicionando coluna role à tabela users';
    ALTER TABLE public.users ADD COLUMN role TEXT NOT NULL DEFAULT 'user';
  END IF;
  
  -- Verificar se a coluna 'approved' existe
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'approved'
  ) THEN
    RAISE NOTICE 'Coluna approved já existe na tabela users';
  ELSE
    RAISE NOTICE 'Adicionando coluna approved à tabela users';
    ALTER TABLE public.users ADD COLUMN approved BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Parte 2: Verificar e ajustar a tabela de bares
DO $$
BEGIN
  -- Verificar se a tabela bars existe
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'bars'
  ) THEN
    RAISE NOTICE 'Tabela bars já existe';
    
    -- Verificar se a coluna user_id existe na tabela bars
    IF EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'bars' AND column_name = 'user_id'
    ) THEN
      RAISE NOTICE 'Coluna user_id já existe na tabela bars';
    ELSE
      RAISE NOTICE 'Adicionando coluna user_id à tabela bars';
      ALTER TABLE public.bars ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    -- Adicionar restrição para permitir apenas um bar por usuário
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'one_bar_per_user'
    ) THEN
      RAISE NOTICE 'Adicionando restrição um bar por usuário';
      ALTER TABLE public.bars ADD CONSTRAINT one_bar_per_user UNIQUE (user_id);
    ELSE
      RAISE NOTICE 'Restrição um bar por usuário já existe';
    END IF;
  ELSE
    RAISE NOTICE 'Tabela bars não encontrada. Certifique-se de que a tabela bars está criada.';
  END IF;
END $$;

-- Parte 3: Configurar políticas de segurança RLS (Row Level Security)
DO $$
BEGIN
  -- Configurar políticas para a tabela bars
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'bars'
  ) THEN
    -- Primeiro, habilitar RLS na tabela
    ALTER TABLE public.bars ENABLE ROW LEVEL SECURITY;
    
    -- Remover políticas existentes, se houver
    DROP POLICY IF EXISTS "Usuários podem ver seu próprio bar" ON public.bars;
    DROP POLICY IF EXISTS "Usuários podem editar seu próprio bar" ON public.bars;
    DROP POLICY IF EXISTS "Super admin pode ver todos os bares" ON public.bars;
    DROP POLICY IF EXISTS "Super admin pode editar todos os bares" ON public.bars;
    
    -- Criar novas políticas
    -- 1. Usuários podem ver apenas seu próprio bar
    CREATE POLICY "Usuários podem ver seu próprio bar" 
      ON public.bars FOR SELECT 
      USING (
        auth.uid() = user_id OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'super_admin')
      );
    
    -- 2. Usuários podem editar apenas seu próprio bar
    CREATE POLICY "Usuários podem editar seu próprio bar" 
      ON public.bars FOR UPDATE 
      USING (auth.uid() = user_id);
    
    -- 3. Usuários podem inserir seu próprio bar
    CREATE POLICY "Usuários podem inserir seu próprio bar" 
      ON public.bars FOR INSERT 
      WITH CHECK (
        auth.uid() = user_id AND 
        NOT EXISTS (SELECT 1 FROM public.bars WHERE user_id = auth.uid())
      );
    
    -- 4. Super admin pode ver todos os bares
    CREATE POLICY "Super admin pode ver todos os bares" 
      ON public.bars FOR SELECT 
      USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'super_admin')
      );
    
    -- 5. Super admin pode editar todos os bares
    CREATE POLICY "Super admin pode editar todos os bares" 
      ON public.bars FOR ALL 
      USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'super_admin')
      );
    
    RAISE NOTICE 'Políticas de segurança configuradas para a tabela bars';
  END IF;
END $$;

-- Parte 4: Configurar autenticação por e-mail
DO $$
BEGIN
  RAISE NOTICE 'Para configurar a autenticação por e-mail:';
  RAISE NOTICE '1. Acesse o painel do Supabase > Authentication > Email Templates';
  RAISE NOTICE '2. Verifique se os modelos de e-mail (Confirmação, Recuperação, etc.) estão configurados';
  RAISE NOTICE '3. Acesse Authentication > Providers > Email e verifique:';
  RAISE NOTICE '   - Confirm Email deve estar ATIVADO';
  RAISE NOTICE '   - Secure Email Change deve estar ATIVADO';
  RAISE NOTICE '   - Certifique-se de que tem um domínio SMTP configurado para envio de e-mails';
END $$;

-- Parte 5: Função para Limpar Bares Órfãos (sem usuário associado)
CREATE OR REPLACE FUNCTION public.clean_orphaned_bars()
RETURNS void AS $$
DECLARE
  count_removed INTEGER;
BEGIN
  DELETE FROM public.bars WHERE user_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM auth.users WHERE id = bars.user_id
  );
  
  GET DIAGNOSTICS count_removed = ROW_COUNT;
  RAISE NOTICE 'Removidos % bares sem usuário associado', count_removed;
END;
$$ LANGUAGE plpgsql; 