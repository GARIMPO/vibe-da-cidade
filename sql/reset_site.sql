-- Script para remover configurações de usuários e autenticação
-- ATENÇÃO: Este script removerá todos os usuários e suas configurações
-- Execute com cuidado no SQL Editor do Supabase

-- 1. Remover políticas de segurança da tabela users
DO $$
BEGIN
  -- Remover todas as políticas da tabela users
  DROP POLICY IF EXISTS "Usuários podem ver seus próprios dados" ON users;
  DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios dados" ON users;
  DROP POLICY IF EXISTS "Super admins podem ver todos os usuários" ON users;
  DROP POLICY IF EXISTS "Super admins podem gerenciar todos os usuários" ON users;
  DROP POLICY IF EXISTS "Permitir inserção de novos usuários" ON users;
  DROP POLICY IF EXISTS "Permitir inserção pública" ON users;
  DROP POLICY IF EXISTS "Permitir leitura pelos próprios usuários" ON users;
  DROP POLICY IF EXISTS "Permitir atualização pelos próprios usuários" ON users;
  
  -- Remover todas as políticas da tabela auth.users
  DROP POLICY IF EXISTS "Permitir registro público para qualquer pessoa" ON auth.users;
END
$$;

-- 2. Remover tabela users
DROP TABLE IF EXISTS users CASCADE;

-- 3. Remover todos os usuários da autenticação (exceto o owner do projeto)
-- Isso removerá todos os usuários autenticados, exceto o usuário principal do Supabase
TRUNCATE auth.users CASCADE;

-- 4. Remover buckets de armazenamento relacionados a usuários
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'user-images') THEN
    -- Remover objetos no bucket user-images
    DELETE FROM storage.objects WHERE bucket_id = 'user-images';
    
    -- Remover políticas
    DROP POLICY IF EXISTS "Política de leitura pública para imagens de usuário" ON storage.objects;
    DROP POLICY IF EXISTS "Política de upload para imagens de usuário" ON storage.objects;
    DROP POLICY IF EXISTS "Política de atualização para imagens de usuário" ON storage.objects;
    DROP POLICY IF EXISTS "Política de exclusão para imagens de usuário" ON storage.objects;
    
    -- Remover bucket
    DELETE FROM storage.buckets WHERE name = 'user-images';
  END IF;
END
$$;

-- 5. Desativar o sistema de autenticação por email/senha
-- Se quiser reativar, precisará fazer isso pelo painel de configurações do Supabase
-- UPDATE auth.config
-- SET enable_sign_up = false;

-- 6. Criar tabela e configurações padrão
-- Aqui você pode restaurar a estrutura original se necessário
DO $$
BEGIN
  -- Por exemplo, recriar uma tabela users simples sem autenticação
  -- CREATE TABLE users (
  --   id SERIAL PRIMARY KEY,
  --   name TEXT,
  --   email TEXT,
  --   created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
  -- );
  
  RAISE NOTICE 'Sistema resetado para o estado original sem autenticação de usuários.';
END
$$; 