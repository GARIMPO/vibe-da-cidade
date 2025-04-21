-- Script para verificar e ajustar permissões de acesso ao Admin
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar políticas existentes na tabela bars
SELECT
  policyname,
  tablename,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM
  pg_policies
WHERE
  tablename = 'bars';

-- 2. Verificar perfil do usuário logado (execute após login)
-- Substitua 'SEU_EMAIL' pelo email do usuário que está testando
SELECT
  id,
  email,
  role,
  approved
FROM
  public.users
WHERE
  email = 'SEU_EMAIL';

-- 3. Verificar bares associados ao usuário (execute após login)
-- Substitua 'SEU_EMAIL' pelo email do usuário que está testando
SELECT
  b.*
FROM
  public.bars b
JOIN
  public.users u ON b.user_id = u.id
WHERE
  u.email = 'SEU_EMAIL';

-- 4. Verificar se a política que permite usuários inserirem bares está correta
DO $$
BEGIN
  -- Verificar a política "Usuários podem inserir seu próprio bar"
  IF EXISTS (
    SELECT FROM pg_policies
    WHERE tablename = 'bars' AND policyname = 'Usuários podem inserir seu próprio bar'
  ) THEN
    RAISE NOTICE 'A política de inserção de bares existe, verificando configuração...';
    
    -- Recriar a política para garantir que está correta
    DROP POLICY IF EXISTS "Usuários podem inserir seu próprio bar" ON public.bars;
    
    CREATE POLICY "Usuários podem inserir seu próprio bar" 
    ON public.bars FOR INSERT 
    WITH CHECK (
      auth.uid() = user_id AND 
      NOT EXISTS (SELECT 1 FROM public.bars WHERE user_id = auth.uid())
    );
    
    RAISE NOTICE 'Política de inserção de bares reconfigurada com sucesso.';
  ELSE
    RAISE NOTICE 'Política de inserção de bares não encontrada, criando...';
    
    CREATE POLICY "Usuários podem inserir seu próprio bar" 
    ON public.bars FOR INSERT 
    WITH CHECK (
      auth.uid() = user_id AND 
      NOT EXISTS (SELECT 1 FROM public.bars WHERE user_id = auth.uid())
    );
    
    RAISE NOTICE 'Política de inserção de bares criada com sucesso.';
  END IF;
END $$;

-- 5. Instruções para o frontend
DO $$
BEGIN
  RAISE NOTICE '-----------------------------------------------';
  RAISE NOTICE 'INSTRUÇÕES PARA AJUSTAR O FRONTEND:';
  RAISE NOTICE '-----------------------------------------------';
  RAISE NOTICE '1. Verifique o componente de rota protegida em seu código:';
  RAISE NOTICE '   - Procure por ProtectedRoute.tsx ou similar';
  RAISE NOTICE '   - Modifique para permitir acesso à página Admin para usuários comuns';
  RAISE NOTICE '';
  RAISE NOTICE '2. Na página Admin, ajuste a exibição:';
  RAISE NOTICE '   - Para super_admin: mostrar todos os bares';
  RAISE NOTICE '   - Para usuários comuns: mostrar apenas seu próprio bar';
  RAISE NOTICE '';
  RAISE NOTICE '3. Verifique a função de carregamento de bares:';
  RAISE NOTICE '   - A query supabase deve respeitar as políticas RLS';
  RAISE NOTICE '   - Não filtre bares por role no frontend (deixe o RLS fazer isso)';
  RAISE NOTICE '';
  RAISE NOTICE '4. Ajuste os botões e ações:';
  RAISE NOTICE '   - Para super_admin: mostrar todas as opções';
  RAISE NOTICE '   - Para usuários comuns: mostrar apenas opções para seu bar';
  RAISE NOTICE '';
  RAISE NOTICE '5. Teste com diferentes tipos de usuário:';
  RAISE NOTICE '   - super_admin deve ver e editar todos os bares';
  RAISE NOTICE '   - usuário comum deve ver e editar apenas seu próprio bar';
  RAISE NOTICE '-----------------------------------------------';
END $$; 