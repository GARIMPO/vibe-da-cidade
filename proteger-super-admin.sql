-- Script para proteger usuários super_admin contra exclusão
-- Execute este script no SQL Editor do Supabase

-- 1. Criar políticas de proteção para super_admin

-- Verificar se existem políticas de exclusão para a tabela users
DROP POLICY IF EXISTS "Proibir exclusão de super_admin" ON public.users;

-- Criar política que impede exclusão de usuários com role='super_admin'
CREATE POLICY "Proibir exclusão de super_admin" ON public.users
FOR DELETE USING (
  role <> 'super_admin'
);

-- 2. Criar um trigger para impedir a exclusão de super_admin, mesmo por outros super_admin

-- Criar função para o trigger
CREATE OR REPLACE FUNCTION prevent_super_admin_deletion()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.role = 'super_admin' THEN
    RAISE EXCEPTION 'Não é possível excluir contas de administrador (super_admin)';
    RETURN NULL;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Associar o trigger à tabela users
DROP TRIGGER IF EXISTS prevent_super_admin_delete_trigger ON public.users;
CREATE TRIGGER prevent_super_admin_delete_trigger
BEFORE DELETE ON public.users
FOR EACH ROW
EXECUTE FUNCTION prevent_super_admin_deletion();

-- 3. Criar uma função adicional para validar a alteração de papéis
-- Isto impede que um super_admin seja rebaixado a um papel de menor privilégio

CREATE OR REPLACE FUNCTION prevent_super_admin_demotion()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.role = 'super_admin' AND NEW.role <> 'super_admin' THEN
    RAISE EXCEPTION 'Não é possível alterar o papel de um super_admin';
    RETURN NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Associar o trigger de prevenção de rebaixamento
DROP TRIGGER IF EXISTS prevent_super_admin_demotion_trigger ON public.users;
CREATE TRIGGER prevent_super_admin_demotion_trigger
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION prevent_super_admin_demotion();

-- 4. Verificar se ainda existem super_admins
DO $$
DECLARE
  admin_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO admin_count FROM public.users WHERE role = 'super_admin';
  IF admin_count = 0 THEN
    RAISE WARNING 'Não existem contas de super_admin configuradas no sistema!';
  ELSE
    RAISE NOTICE 'Proteção contra exclusão de super_admin configurada com sucesso! Existem % super_admin(s) no sistema.', admin_count;
  END IF;
END $$; 