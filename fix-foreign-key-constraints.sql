-- Script para corrigir restrições de chave estrangeira e permitir exclusão de usuários
-- Execute este script no SQL Editor do Supabase

-- 1. Identificar chaves estrangeiras que referenciam auth.users
DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    RAISE NOTICE 'Listando chaves estrangeiras que referenciam auth.users:';
    
    FOR constraint_record IN 
        SELECT tc.table_schema, tc.table_name, tc.constraint_name, ccu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu 
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' 
          AND ccu.table_schema = 'auth' 
          AND ccu.table_name = 'users'
    LOOP
        RAISE NOTICE 'Schema: %, Tabela: %, Constraint: %, Coluna: %', 
            constraint_record.table_schema, 
            constraint_record.table_name, 
            constraint_record.constraint_name,
            constraint_record.column_name;
    END LOOP;
END $$;

-- 2. Modificar a restrição de chave estrangeira em public.users para permitir exclusão em cascata
-- (Este código assume que a tabela public.users tem uma chave estrangeira para auth.users)
DO $$
BEGIN
    -- Primeiro identificamos o nome da restrição
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
            -- Dropamos a restrição existente
            EXECUTE 'ALTER TABLE public.users DROP CONSTRAINT ' || constraint_name;
            RAISE NOTICE 'Restrição % removida', constraint_name;
            
            -- Criamos uma nova restrição com ON DELETE CASCADE
            ALTER TABLE public.users 
            ADD CONSTRAINT users_auth_user_id_fkey 
            FOREIGN KEY (id) 
            REFERENCES auth.users(id) 
            ON DELETE CASCADE;
            
            RAISE NOTICE 'Nova restrição com ON DELETE CASCADE criada';
        END IF;
    END;
END $$;

-- 3. Verificar se há outros objetos bloqueando a exclusão
DO $$
BEGIN
    RAISE NOTICE 'Verificando outras possíveis tabelas ou restrições que possam bloquear a exclusão de usuários:';
    
    -- Verificar se há uma coluna user_id em bars que pode precisar de ON DELETE CASCADE
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'bars' 
        AND column_name = 'user_id'
    ) THEN
        RAISE NOTICE 'A tabela bars tem uma coluna user_id que pode precisar de ON DELETE CASCADE';
        
        -- Verificar se há uma chave estrangeira
        DECLARE
            bar_constraint_name TEXT;
        BEGIN
            SELECT constraint_name INTO bar_constraint_name
            FROM information_schema.table_constraints
            WHERE table_schema = 'public'
            AND table_name = 'bars'
            AND constraint_type = 'FOREIGN KEY'
            AND constraint_name LIKE '%user_id%';
            
            IF bar_constraint_name IS NOT NULL THEN
                EXECUTE 'ALTER TABLE public.bars DROP CONSTRAINT ' || bar_constraint_name;
                RAISE NOTICE 'Restrição % removida da tabela bars', bar_constraint_name;
                
                -- Adicionar nova restrição com ON DELETE CASCADE
                ALTER TABLE public.bars
                ADD CONSTRAINT bars_user_id_fkey
                FOREIGN KEY (user_id)
                REFERENCES auth.users(id)
                ON DELETE CASCADE;
                
                RAISE NOTICE 'Nova restrição com ON DELETE CASCADE criada para bars';
            END IF;
        END;
    END IF;
END $$;

RAISE NOTICE 'Script concluído. Agora você deve conseguir excluir usuários no Supabase.'; 