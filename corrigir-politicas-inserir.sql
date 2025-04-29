-- Script para corrigir as políticas de inserção de bares
-- Execute este script no SQL Editor do Supabase

-- Verificar e atualizar as políticas de inserção para bares
DO $$
BEGIN
  -- Configurar políticas para a tabela bars
  IF EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'bars'
  ) THEN
    -- Remover política de inserção existente que está com problema
    DROP POLICY IF EXISTS "Usuários podem inserir seu próprio bar" ON public.bars;
    
    -- Criar nova política que permite super_admin inserir múltiplos bares
    -- e usuários comuns inserirem apenas um bar próprio
    CREATE POLICY "Usuários podem inserir bares"
      ON public.bars FOR INSERT
      WITH CHECK (
        -- Super admin pode inserir qualquer bar
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'super_admin')
        OR
        -- Usuários comuns só podem inserir seu próprio bar e apenas um
        (
          auth.uid() = user_id
          -- Remova a restrição que impede usuários de terem mais de um bar
          -- Isso será controlado pela constraint no banco de dados
        )
      );
      
    -- Para super_admin também, garantir política ALL
    DROP POLICY IF EXISTS "Super admin pode gerenciar todos os bares" ON public.bars;
    CREATE POLICY "Super admin pode gerenciar todos os bares"
      ON public.bars FOR ALL
      USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'super_admin')
      );
    
    RAISE NOTICE 'Políticas de inserção para bares atualizadas com sucesso';
  ELSE
    RAISE NOTICE 'Tabela bars não encontrada';
  END IF;
END $$; 