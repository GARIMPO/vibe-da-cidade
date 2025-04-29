-- SOLUÇÃO RÁPIDA PARA EXCLUIR USUÁRIOS NO SUPABASE
-- Este script modifica as chaves estrangeiras para permitir DELETE CASCADE
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar a estrutura básica
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'users'
) AS users_table_exists;

-- 2. Aplicar correção para a tabela users
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  -- Encontrar a restrição de chave estrangeira
  SELECT tc.constraint_name INTO constraint_name
  FROM information_schema.table_constraints tc
  JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
  WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public' 
    AND tc.table_name = 'users'
    AND ccu.table_schema = 'auth' 
    AND ccu.table_name = 'users';
    
  IF constraint_name IS NULL THEN
    RAISE NOTICE 'Nenhuma restrição encontrada em public.users referenciando auth.users';
  ELSE
    -- Remover a restrição existente
    EXECUTE 'ALTER TABLE public.users DROP CONSTRAINT ' || constraint_name;
    
    -- Criar nova restrição com ON DELETE CASCADE
    ALTER TABLE public.users 
    ADD CONSTRAINT users_auth_id_fkey 
    FOREIGN KEY (id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE;
    
    RAISE NOTICE 'Restrição modificada com sucesso para ON DELETE CASCADE';
  END IF;
  
  -- Verificar também a tabela bars se existir
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'bars'
  ) THEN
    -- Verificar se há uma coluna user_id
    IF EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_schema = 'public' 
        AND table_name = 'bars'
        AND column_name = 'user_id'
    ) THEN
      -- Verificar se há uma restrição de chave estrangeira
      DECLARE
        bar_constraint TEXT;
      BEGIN
        SELECT tc.constraint_name INTO bar_constraint
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
          ON kcu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' 
          AND tc.table_schema = 'public' 
          AND tc.table_name = 'bars'
          AND kcu.column_name = 'user_id';
          
        IF bar_constraint IS NOT NULL THEN
          -- Remover e recriar a restrição
          EXECUTE 'ALTER TABLE public.bars DROP CONSTRAINT ' || bar_constraint;
          
          ALTER TABLE public.bars
          ADD CONSTRAINT bars_user_id_fkey
          FOREIGN KEY (user_id)
          REFERENCES auth.users(id)
          ON DELETE CASCADE;
          
          RAISE NOTICE 'Restrição em bars.user_id modificada com sucesso';
        END IF;
      END;
    END IF;
  END IF;
END $$;

-- 3. Método rápido para usuários que ainda não conseguem excluir
-- Execute este bloco separadamente, substituindo 'EMAIL_DO_USUARIO' pelo email real
/*
DO $$
BEGIN
  -- Desativar temporariamente as restrições de chave estrangeira
  SET session_replication_role = 'replica';
  
  -- Excluir o usuário específico (substitua por email real)
  DELETE FROM public.users WHERE email = 'EMAIL_DO_USUARIO';
  DELETE FROM auth.users WHERE email = 'EMAIL_DO_USUARIO';
  
  -- Reativar as restrições
  SET session_replication_role = 'origin';
END $$;
*/

RAISE NOTICE 'Script concluído! Tente excluir um usuário pelo painel do Supabase agora.';
RAISE NOTICE 'Se ainda tiver problemas, descomente e execute o bloco 3 do script, substituindo EMAIL_DO_USUARIO pelo email real.'; 