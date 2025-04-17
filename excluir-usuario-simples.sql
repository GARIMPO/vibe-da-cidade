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

-- Script para configurar contas de usuário e permissões de bar

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
    DROP POLICY IF EXISTS "Usuários podem inserir seu próprio bar" ON public.bars;
    DROP POLICY IF EXISTS "Super admin pode ver todos os bares" ON public.bars;
    DROP POLICY IF EXISTS "Super admin pode editar todos os bares" ON public.bars;
    
    -- Criar novas políticas
    -- 1. Usuários podem ver apenas seu próprio bar
    CREATE POLICY "Usuários podem ver seu próprio bar" 
      ON public.bars FOR SELECT 
      USING (auth.uid() = user_id);
    
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