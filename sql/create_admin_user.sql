-- Script para criar/atualizar um usuário super_admin
-- Substitua 'seu-email@exemplo.com' pelo email do usuário administrador
-- Execute este script no SQL Editor do Supabase

-- Este script tenta atualizar um usuário existente com o email especificado para super_admin
-- Se o usuário já existir na tabela users, atualiza o papel para super_admin
-- Senão, ele informa que o usuário precisa ser criado primeiro via autenticação

DO $$
DECLARE
  _user_id uuid;
  _email text := 'seu-email@exemplo.com'; -- ⚠️ SUBSTITUA PELO SEU EMAIL
BEGIN
  -- Verificar se o usuário existe na tabela auth.users
  SELECT id INTO _user_id FROM auth.users WHERE email = _email;
  
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário com email "%" não encontrado. Crie o usuário primeiro através do sistema de registro.', _email;
  ELSE
    -- Verificar se o usuário existe na tabela de perfil
    IF EXISTS (SELECT 1 FROM users WHERE id = _user_id) THEN
      -- Atualizar para super_admin
      UPDATE users
      SET role = 'super_admin'
      WHERE id = _user_id;
      
      RAISE NOTICE 'Usuário % atualizado para super_admin com sucesso!', _email;
    ELSE
      -- Inserir na tabela de perfil
      INSERT INTO users (id, email, name, role, approved)
      VALUES (_user_id, _email, 'Administrador', 'super_admin', true);
      
      RAISE NOTICE 'Usuário % adicionado como super_admin com sucesso!', _email;
    END IF;
  END IF;
END
$$; 