-- Ativar confirmação de email apenas se necessário
-- (Se você quiser que os usuários confirmem o email antes de fazer login, remova o comentário)
-- UPDATE auth.config
-- SET confirm_email_through_sign_in = TRUE;

-- Permitir que todos os usuários se registrem sem restrições
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Permitir registro público para qualquer pessoa'
    AND tablename = 'users'
  ) THEN
    CREATE POLICY "Permitir registro público para qualquer pessoa" ON auth.users
      FOR INSERT WITH CHECK (true);
  END IF;
END
$$;

-- IMPORTANTE: Caso suas políticas usem role = 'super_admin', certifique-se
-- de que exista pelo menos um usuário super_admin
DO $$
DECLARE
  super_admin_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO super_admin_count FROM users WHERE role = 'super_admin';
  
  IF super_admin_count = 0 THEN
    RAISE WARNING 'Atenção: Não há usuários com role = super_admin. Isso pode causar problemas com políticas RLS.';
  END IF;
END
$$; 