-- Script para corrigir políticas e permissões no Supabase
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

    -- Remover políticas existentes
    DROP POLICY IF EXISTS "Usuários podem inserir seu próprio bar" ON public.bars;
    DROP POLICY IF EXISTS "Usuários podem inserir bares" ON public.bars;
    DROP POLICY IF EXISTS "Super admin pode gerenciar todos os bares" ON public.bars;
    
    -- POLICY 1: Super admin pode fazer TUDO com TODOS os bares (sem restrições)
    CREATE POLICY "Super admin pode gerenciar todos os bares"
      ON public.bars FOR ALL
      USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'super_admin')
      );
    
    -- POLICY 2: Usuários comuns podem inserir seus próprios bares
    -- Removendo a restrição de um bar por usuário para funcionar corretamente
    CREATE POLICY "Usuários podem inserir seus próprios bares"
      ON public.bars FOR INSERT
      WITH CHECK (
        auth.uid() = user_id
      );
    
    -- POLICY 3: Usuários comuns podem ver seus próprios bares apenas
    DROP POLICY IF EXISTS "Usuários podem ver seu próprio bar" ON public.bars;
    CREATE POLICY "Usuários podem ver seu próprio bar"
      ON public.bars FOR SELECT
      USING (auth.uid() = user_id);
    
    -- POLICY 4: Usuários comuns podem editar apenas seus próprios bares
    DROP POLICY IF EXISTS "Usuários podem editar seu próprio bar" ON public.bars;
    CREATE POLICY "Usuários podem editar seu próprio bar"
      ON public.bars FOR UPDATE
      USING (auth.uid() = user_id);
    
    -- POLICY 5: Usuários comuns podem excluir apenas seus próprios bares
    DROP POLICY IF EXISTS "Usuários podem excluir seu próprio bar" ON public.bars;
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