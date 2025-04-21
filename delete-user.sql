-- Script para excluir corretamente um usuário no Supabase
-- Substitua 'ID_DO_USUARIO' pelo ID real (UUID) do usuário que você deseja excluir
-- Execute este script no SQL Editor do Supabase

DO $$
DECLARE
    user_id UUID := 'ID_DO_USUARIO'; -- Substitua pelo UUID real do usuário
    user_email TEXT;
BEGIN
    -- Obter o email do usuário para confirmar a exclusão
    SELECT email INTO user_email FROM auth.users WHERE id = user_id;
    
    IF user_email IS NULL THEN
        RAISE EXCEPTION 'Usuário com ID % não encontrado', user_id;
    END IF;
    
    RAISE NOTICE 'Preparando para excluir o usuário: % (ID: %)', user_email, user_id;
    
    -- 1. Remover registros relacionados em outras tabelas que possam ter chaves estrangeiras
    -- Exemplo: remover relacionamentos com eventos
    DELETE FROM events WHERE bar_id IN (SELECT id FROM bars WHERE user_id = user_id);
    RAISE NOTICE 'Eventos relacionados removidos';
    
    -- 2. Remover perfil do usuário na tabela 'users'
    DELETE FROM users WHERE id = user_id;
    RAISE NOTICE 'Perfil do usuário removido da tabela users';
    
    -- 3. Remover arquivos de storage associados ao usuário
    -- Nota: Isso tentará excluir todos os objetos de storage que pertencem ao usuário em todos os buckets
    DELETE FROM storage.objects WHERE owner = user_id::TEXT;
    RAISE NOTICE 'Arquivos de storage removidos';
    
    -- 4. Remover sessões do usuário
    DELETE FROM auth.sessions WHERE user_id = user_id;
    RAISE NOTICE 'Sessões do usuário removidas';
    
    -- 5. Finalmente, remover o usuário da tabela auth.users
    DELETE FROM auth.users WHERE id = user_id;
    RAISE NOTICE 'Usuário % excluído com sucesso da auth.users', user_email;
    
    RAISE NOTICE '------------------------------------------------';
    RAISE NOTICE 'Exclusão completa do usuário % (ID: %) concluída com sucesso', user_email, user_id;
    RAISE NOTICE '------------------------------------------------';
END $$; 