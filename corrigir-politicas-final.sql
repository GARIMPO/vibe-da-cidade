-- Script para corrigir as políticas de inserção de bares e usuários
-- Execute este script no SQL Editor do Supabase

-- Parte 1: Verificar e ajustar políticas da tabela users
DO $$
BEGIN
  -- Garantir que não existam restrições na criação de usuários
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    -- Remover políticas existentes relacionadas a usuários
    DROP POLICY IF EXISTS "Usuários podem ver seus próprios dados" ON users;
    DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios dados" ON users;
    DROP POLICY IF EXISTS "Super admins podem ver todos os usuários" ON users;
    DROP POLICY IF EXISTS "Super admins podem gerenciar todos os usuários" ON users;
    DROP POLICY IF EXISTS "Permitir inserção de novos usuários" ON users;
    
    -- Recriar políticas corretas para usuários
    CREATE POLICY "Usuários podem ver seus próprios dados" ON users
    FOR SELECT USING (auth.uid() = id);
    
    CREATE POLICY "Usuários podem atualizar seus próprios dados" ON users
    FOR UPDATE USING (auth.uid() = id);
    
    CREATE POLICY "Super admins podem ver todos os usuários" ON users
    FOR SELECT USING (
      EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
    );
    
    CREATE POLICY "Super admins podem gerenciar todos os usuários" ON users
    FOR ALL USING (
      EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
    );
    
    -- Permitir a criação de novos usuários SEM LIMITAÇÃO DE QUANTIDADE
    CREATE POLICY "Permitir inserção de novos usuários" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);
    
    RAISE NOTICE 'Políticas de usuários atualizadas com sucesso';
  END IF;
END $$;

-- Parte 2: Verificar e ajustar políticas da tabela bars
DO $$
BEGIN
  -- Configurar políticas para a tabela bars
  IF EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'bars'
  ) THEN
    -- Remover políticas existentes
    DROP POLICY IF EXISTS "Usuários podem ver seu próprio bar" ON public.bars;
    DROP POLICY IF EXISTS "Usuários podem editar seu próprio bar" ON public.bars;
    DROP POLICY IF EXISTS "Usuários podem inserir seu próprio bar" ON public.bars;
    DROP POLICY IF EXISTS "Usuários podem inserir bares" ON public.bars;
    DROP POLICY IF EXISTS "Super admin pode ver todos os bares" ON public.bars;
    DROP POLICY IF EXISTS "Super admin pode editar todos os bares" ON public.bars;
    DROP POLICY IF EXISTS "Super admin pode gerenciar todos os bares" ON public.bars;
    
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

    -- 3. Usuários podem inserir seu próprio bar, mas apenas um por usuário
    CREATE POLICY "Usuários podem inserir seu próprio bar"
      ON public.bars FOR INSERT
      WITH CHECK (
        auth.uid() = user_id AND
        NOT EXISTS (
          SELECT 1 FROM public.bars WHERE user_id = auth.uid()
        )
      );

    -- 4. Super admin pode ver todos os bares
    CREATE POLICY "Super admin pode ver todos os bares"
      ON public.bars FOR SELECT
      USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'super_admin')
      );

    -- 5. Super admin pode gerenciar (inserir, atualizar, excluir) todos os bares sem restrição
    CREATE POLICY "Super admin pode gerenciar todos os bares"
      ON public.bars FOR ALL
      USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'super_admin')
      );
      
    -- Remover a restrição one_bar_per_user se estiver impedindo super_admin
    -- mas apenas se a constraint existir
    BEGIN
      IF EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'one_bar_per_user'
      ) THEN
        -- Como não podemos modificar a constraint, vamos remover e recriar
        -- para que ela não impeça o super_admin
        ALTER TABLE public.bars DROP CONSTRAINT IF EXISTS one_bar_per_user;
        
        -- Criar um trigger que valida a regra apenas para usuários comuns
        CREATE OR REPLACE FUNCTION check_one_bar_per_user()
        RETURNS TRIGGER AS $$
        DECLARE
          user_role TEXT;
        BEGIN
          SELECT role INTO user_role FROM public.users WHERE id = NEW.user_id;
          
          IF user_role != 'super_admin' AND EXISTS (
            SELECT 1 FROM public.bars WHERE user_id = NEW.user_id AND id != NEW.id
          ) THEN
            RAISE EXCEPTION 'Usuários comuns só podem ter um bar';
          END IF;
          
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        
        DROP TRIGGER IF EXISTS enforce_one_bar_per_user ON public.bars;
        CREATE TRIGGER enforce_one_bar_per_user
          BEFORE INSERT OR UPDATE ON public.bars
          FOR EACH ROW
          EXECUTE FUNCTION check_one_bar_per_user();
      END IF;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE 'Erro ao modificar constraint: %', SQLERRM;
    END;
    
    RAISE NOTICE 'Políticas de inserção para bares atualizadas com sucesso';
  ELSE
    RAISE NOTICE 'Tabela bars não encontrada';
  END IF;
END $$; 