-- Script para corrigir problemas de permissão no registro de usuários comuns
-- Execute este script no editor SQL do Supabase

-- 1. Garantir que o registro público esteja habilitado nas configurações de auth
-- Isso não pode ser feito via SQL diretamente, precisa ser habilitado na interface:
-- Authentication > Settings > Desabilite "Enable email confirmations"

-- 2. Configurar corretamente as políticas de auth
BEGIN;
  -- Remover políticas existentes que podem estar conflitando
  DROP POLICY IF EXISTS "Permitir inserção pública" ON users;
  DROP POLICY IF EXISTS "Permitir leitura pelos próprios usuários" ON users;
  DROP POLICY IF EXISTS "Permitir atualização pelos próprios usuários" ON users;
  
  -- Garantir que RLS está habilitado
  ALTER TABLE users ENABLE ROW LEVEL SECURITY;
  
  -- IMPORTANTE: Políticas para permitir que o serviço de auth possa inserir dados
  CREATE POLICY "Permitir inserção para todos" ON users
    FOR INSERT
    WITH CHECK (true);
  
  -- Política para permitir que usuários vejam seus próprios dados
  CREATE POLICY "Usuários podem ver seus próprios dados" ON users
    FOR SELECT
    USING (auth.uid() = id);
  
  -- Política para permitir que usuários atualizem seus próprios dados
  CREATE POLICY "Usuários podem atualizar seus próprios dados" ON users
    FOR UPDATE
    USING (auth.uid() = id);
  
  -- Política para permitir que super_admin veja todos os dados
  CREATE POLICY "Super admin pode ver todos os usuários" ON users
    FOR SELECT
    USING (auth.uid() IN (SELECT id FROM users WHERE role = 'super_admin'));
  
  -- Política para permitir que super_admin gerencie todos os dados
  CREATE POLICY "Super admin pode gerenciar todos os usuários" ON users
    FOR ALL
    USING (auth.uid() IN (SELECT id FROM users WHERE role = 'super_admin'));
COMMIT;

-- 3. Criar uma política especial nas configurações de autenticação
-- Isso permite que novos usuários se registrem sem restrições
DO $$
BEGIN
  -- Verificar se a tabela auth.users existe
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'auth' AND tablename = 'users') THEN
    -- Tentar adicionar a política
    BEGIN
      CREATE POLICY "Permitir registro para todos" ON auth.users
        FOR INSERT
        WITH CHECK (true);
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Não foi possível criar a política na tabela auth.users. Isso é normal se a política já existir.';
    END;
  END IF;
END
$$;

-- 4. Modificar a tabela users para facilitar o registro
ALTER TABLE users ALTER COLUMN name DROP NOT NULL;

-- 5. Verificar configurações do bucket de armazenamento
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'user-images') THEN
    -- Bucket existe, verificar políticas
    BEGIN
      CREATE POLICY "Política de leitura pública" ON storage.objects
        FOR SELECT USING (bucket_id = 'user-images');
    EXCEPTION WHEN OTHERS THEN
      NULL; -- Ignora se a política já existir
    END;
    
    BEGIN
      CREATE POLICY "Política de upload para usuários autenticados" ON storage.objects
        FOR INSERT WITH CHECK (
          bucket_id = 'user-images' AND
          auth.role() = 'authenticated'
        );
    EXCEPTION WHEN OTHERS THEN
      NULL; -- Ignora se a política já existir
    END;
  ELSE
    -- Criar o bucket
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('user-images', 'user-images', true);
    
    -- Adicionar políticas
    CREATE POLICY "Política de leitura pública" ON storage.objects
      FOR SELECT USING (bucket_id = 'user-images');
    
    CREATE POLICY "Política de upload para usuários autenticados" ON storage.objects
      FOR INSERT WITH CHECK (
        bucket_id = 'user-images' AND
        auth.role() = 'authenticated'
      );
  END IF;
END
$$; 