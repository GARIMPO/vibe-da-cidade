-- SOLUÇÃO DEFINITIVA PARA EXCLUSÃO DE USUÁRIOS NO SUPABASE
-- Este script identifica e resolve os problemas que impedem a exclusão de usuários
-- Execute este script no SQL Editor do Supabase

-- 1. Verificação da estrutura do banco de dados
DO $$
BEGIN
    RAISE NOTICE '======= DIAGNÓSTICO DO PROBLEMA =======';
    
    -- Verificar se a tabela users existe
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
        RAISE NOTICE 'Tabela users encontrada';
    ELSE
        RAISE NOTICE 'Tabela users não encontrada, não é necessário modificar restrições';
        RETURN;
    END IF;
    
    -- Verificar restrições de chave estrangeira
    RAISE NOTICE '--- Chaves estrangeiras que referenciam auth.users ---';
    FOR r IN (
        SELECT tc.table_schema, tc.table_name, tc.constraint_name, kcu.column_name, 
               ccu.table_schema AS foreign_table_schema,
               ccu.table_name AS foreign_table_name,
               ccu.column_name AS foreign_column_name,
               rc.delete_rule
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu 
          ON ccu.constraint_name = tc.constraint_name
        JOIN information_schema.referential_constraints rc
          ON rc.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' 
          AND ccu.table_schema = 'auth' 
          AND ccu.table_name = 'users'
    ) LOOP
        RAISE NOTICE 'Tabela %.% tem restrição % na coluna % referenciando auth.users.% (regra de exclusão: %)',
            r.table_schema, r.table_name, r.constraint_name, r.column_name, 
            r.foreign_column_name, r.delete_rule;
    END LOOP;
END $$;

-- 2. Solução: modificar todas as chaves estrangeiras relevantes para usar ON DELETE CASCADE
DO $$
DECLARE
    fk_record RECORD;
BEGIN
    RAISE NOTICE '======= APLICANDO CORREÇÕES =======';
    
    FOR fk_record IN (
        SELECT tc.table_schema, tc.table_name, tc.constraint_name, kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu 
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' 
          AND ccu.table_schema = 'auth' 
          AND ccu.table_name = 'users'
    ) LOOP
        RAISE NOTICE 'Modificando restrição % na tabela %.%', 
            fk_record.constraint_name, fk_record.table_schema, fk_record.table_name;
        
        BEGIN
            -- Remover a restrição existente
            EXECUTE format('ALTER TABLE %I.%I DROP CONSTRAINT %I', 
                fk_record.table_schema, fk_record.table_name, fk_record.constraint_name);
            
            -- Adicionar nova restrição com ON DELETE CASCADE
            EXECUTE format('ALTER TABLE %I.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES auth.users(id) ON DELETE CASCADE', 
                fk_record.table_schema, fk_record.table_name, fk_record.constraint_name, fk_record.column_name);
                
            RAISE NOTICE 'Restrição % modificada com sucesso para incluir ON DELETE CASCADE', fk_record.constraint_name;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Erro ao modificar restrição %: %', fk_record.constraint_name, SQLERRM;
        END;
    END LOOP;
END $$;

-- 3. Método alternativo: abordagem específica para a tabela users
DO $$
BEGIN
    RAISE NOTICE '======= ABORDAGEM ESPECÍFICA PARA TABELA USERS =======';
    
    -- Verificar se a tabela users tem uma chave estrangeira para auth.users
    DECLARE
        constraint_name TEXT;
    BEGIN
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
            RAISE NOTICE 'Nenhuma restrição de chave estrangeira encontrada em public.users referenciando auth.users';
        ELSE
            -- Remover a restrição existente
            EXECUTE 'ALTER TABLE public.users DROP CONSTRAINT ' || constraint_name;
            RAISE NOTICE 'Restrição % removida da tabela users', constraint_name;
            
            -- Adicionar nova restrição com ON DELETE CASCADE
            ALTER TABLE public.users 
            ADD CONSTRAINT users_auth_id_fkey 
            FOREIGN KEY (id) 
            REFERENCES auth.users(id) 
            ON DELETE CASCADE;
            
            RAISE NOTICE 'Nova restrição com ON DELETE CASCADE criada para users.id';
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Erro ao modificar restrições em users: %', SQLERRM;
    END;
    
    -- Verificar se há outras tabelas que podem ter referências a users
    RAISE NOTICE '--- Verificando outras tabelas que referenciam users ---';
    FOR r IN (
        SELECT tc.table_schema, tc.table_name, tc.constraint_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu 
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' 
          AND ccu.table_schema = 'public' 
          AND ccu.table_name = 'users'
    ) LOOP
        RAISE NOTICE 'Tabela %.% tem restrição % referenciando public.users', 
            r.table_schema, r.table_name, r.constraint_name;
            
        -- Modificar essa restrição também para ON DELETE CASCADE
        BEGIN
            EXECUTE format('ALTER TABLE %I.%I DROP CONSTRAINT %I', 
                r.table_schema, r.table_name, r.constraint_name);
                
            -- Aqui precisamos determinar a coluna exata, o que é complicado sem conhecer a estrutura
            -- Esta é uma abordagem simplificada que pode precisar de ajustes
            EXECUTE format('ALTER TABLE %I.%I ADD CONSTRAINT %I FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE', 
                r.table_schema, r.table_name, r.constraint_name);
                
            RAISE NOTICE 'Restrição % modificada com sucesso', r.constraint_name;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Erro ao modificar restrição %: %', r.constraint_name, SQLERRM;
        END;
    END LOOP;
END $$;

-- 4. Método de emergência: desabilitar temporariamente as restrições
DO $$
BEGIN
    RAISE NOTICE '======= MÉTODO DE EMERGÊNCIA =======';
    RAISE NOTICE 'Se você ainda não conseguir excluir usuários após executar as etapas anteriores,';
    RAISE NOTICE 'use o seguinte comando SQL para excluir um usuário específico:';
    RAISE NOTICE '';
    RAISE NOTICE 'DO $$ ';
    RAISE NOTICE 'BEGIN';
    RAISE NOTICE '  -- Desativar temporariamente restrições de chave estrangeira';
    RAISE NOTICE '  SET session_replication_role = ''replica'';';
    RAISE NOTICE '  ';
    RAISE NOTICE '  -- Excluir o usuário (substitua o_email_do_usuario pelo email real)';
    RAISE NOTICE '  DELETE FROM public.users WHERE email = ''o_email_do_usuario'';';
    RAISE NOTICE '  DELETE FROM auth.users WHERE email = ''o_email_do_usuario'';';
    RAISE NOTICE '  ';
    RAISE NOTICE '  -- Reativar restrições';
    RAISE NOTICE '  SET session_replication_role = ''origin'';';
    RAISE NOTICE 'END $$;';
END $$;

-- 5. Verificação final
DO $$
DECLARE
    counts RECORD;
BEGIN
    RAISE NOTICE '======= VERIFICAÇÃO FINAL =======';
    
    SELECT 
        (SELECT COUNT(*) FROM auth.users) AS auth_users_count,
        (SELECT COUNT(*) FROM public.users) AS public_users_count
    INTO counts;
    
    RAISE NOTICE 'Total de usuários em auth.users: %', counts.auth_users_count;
    RAISE NOTICE 'Total de usuários em public.users: %', counts.public_users_count;
    
    IF counts.auth_users_count <> counts.public_users_count THEN
        RAISE NOTICE 'AVISO: O número de usuários nas tabelas auth.users e public.users não corresponde.';
        RAISE NOTICE 'Isso pode indicar registros órfãos que precisam ser corrigidos.';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE 'Script concluído! Agora você deve conseguir excluir usuários no Supabase.';
    RAISE NOTICE 'Teste excluindo um usuário pela interface do Supabase.';
END $$; 