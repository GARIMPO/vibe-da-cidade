-- Script para verificar e proteger usuários super_admin
-- Execute este script no SQL Editor do Supabase

-- 1. Listar todos os super_admin ativos no sistema
SELECT 
  id,
  email,
  name,
  created_at,
  updated_at
FROM 
  public.users
WHERE 
  role = 'super_admin'
ORDER BY 
  created_at;

-- 2. Verificar e aplicar flags de proteção para todos os super_admin
DO $$
DECLARE
  admin_record RECORD;
  admin_count INTEGER := 0;
BEGIN
  -- Contar super_admins
  SELECT COUNT(*) INTO admin_count FROM public.users WHERE role = 'super_admin';
  
  -- Se não existirem super_admins, exibir um aviso
  IF admin_count = 0 THEN
    RAISE WARNING 'Nenhum super_admin encontrado no sistema! Recomenda-se criar pelo menos um.';
    RETURN;
  END IF;
  
  -- Informar quantos super_admins existem
  RAISE NOTICE 'Encontrados % super_admin(s) no sistema.', admin_count;
  
  -- Adicionar uma coluna 'protected' se não existir
  -- Esta coluna é uma flag adicional de proteção
  BEGIN
    ALTER TABLE public.users ADD COLUMN IF NOT EXISTS protected BOOLEAN DEFAULT FALSE;
    RAISE NOTICE 'Coluna de proteção verificada/criada.';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'A coluna de proteção já existe.';
  END;
  
  -- Marcar todos os super_admins como protegidos
  UPDATE public.users SET protected = TRUE WHERE role = 'super_admin';
  
  -- Contar quantos foram atualizados
  GET DIAGNOSTICS admin_count = ROW_COUNT;
  RAISE NOTICE '% usuários super_admin foram marcados como protegidos.', admin_count;
  
  -- Listar informações de todos os super_admins
  RAISE NOTICE '--------------------------------------------------------';
  RAISE NOTICE 'Lista de super_admins ativos no sistema:';
  RAISE NOTICE '--------------------------------------------------------';
  
  FOR admin_record IN 
    SELECT id, email, name, created_at FROM public.users WHERE role = 'super_admin' ORDER BY created_at
  LOOP
    RAISE NOTICE 'ID: %, Email: %, Nome: %, Criado em: %',
      admin_record.id,
      admin_record.email,
      admin_record.name,
      admin_record.created_at;
  END LOOP;
  
  RAISE NOTICE '--------------------------------------------------------';
  RAISE NOTICE 'Proteções para super_admin aplicadas com sucesso!';
  RAISE NOTICE '--------------------------------------------------------';
END $$;

-- 3. Criar um trigger adicional que verifica a flag 'protected'
CREATE OR REPLACE FUNCTION prevent_protected_user_deletion()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.protected = TRUE THEN
    RAISE EXCEPTION 'Este usuário está marcado como protegido e não pode ser excluído';
    RETURN NULL;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Associar o trigger à tabela users
DROP TRIGGER IF EXISTS prevent_protected_user_delete_trigger ON public.users;
CREATE TRIGGER prevent_protected_user_delete_trigger
BEFORE DELETE ON public.users
FOR EACH ROW
EXECUTE FUNCTION prevent_protected_user_deletion();

-- 4. Informar que a configuração foi concluída
DO $$
BEGIN
  RAISE NOTICE 'Configuração de proteção para super_admin concluída com sucesso!';
  RAISE NOTICE 'Os usuários super_admin agora estão protegidos contra exclusão.';
END $$; 