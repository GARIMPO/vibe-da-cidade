-- Script para verificar se o usuário com email marcos.rherculano@gmail.com está como super_admin
-- Execute este script no SQL Editor do Supabase

-- Verificar a role do usuário
SELECT 
  u.id,
  u.email,
  u.name,
  u.role,
  u.approved
FROM 
  public.users u
WHERE 
  u.email = 'marcos.rherculano@gmail.com';

-- Verificação de permissões (opcional)
DO $$
BEGIN
  -- Verificar se o usuário existe
  IF EXISTS (SELECT 1 FROM public.users WHERE email = 'marcos.rherculano@gmail.com') THEN
    -- Verificar se é super_admin
    IF EXISTS (SELECT 1 FROM public.users WHERE email = 'marcos.rherculano@gmail.com' AND role = 'super_admin') THEN
      RAISE NOTICE 'O usuário marcos.rherculano@gmail.com está configurado como super_admin.';
    ELSE
      RAISE NOTICE 'O usuário marcos.rherculano@gmail.com NÃO está configurado como super_admin.';
      
      -- Mostrar a role atual
      RAISE NOTICE 'Role atual: %', (SELECT role FROM public.users WHERE email = 'marcos.rherculano@gmail.com');
    END IF;
  ELSE
    RAISE NOTICE 'Usuário marcos.rherculano@gmail.com não encontrado na tabela users.';
  END IF;
END $$;

-- Atualizar usuário para super_admin (descomente se quiser executar)
/*
UPDATE public.users
SET role = 'super_admin'
WHERE email = 'marcos.rherculano@gmail.com';
RAISE NOTICE 'Usuário atualizado para super_admin com sucesso!';
*/ 