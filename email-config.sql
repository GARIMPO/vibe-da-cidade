-- Script para configurar a confirmação de email no Supabase
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar configuração atual
SELECT
  raw_app_meta_data->'provider' as provider,
  raw_app_meta_data->'email_confirmed_at' as email_confirmed_at,
  raw_user_meta_data->'email_confirmed' as email_confirmed,
  email,
  confirmed_at,
  confirmation_sent_at,
  last_sign_in_at,
  email_change_sent_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- 2. Informações sobre como configurar emails
DO $$
BEGIN
  RAISE NOTICE 'CONFIGURAÇÃO DE EMAIL NO SUPABASE:';
  RAISE NOTICE '1. Acesse Authentication > Email Templates e configure os templates de email';
  RAISE NOTICE '2. Acesse Authentication > Providers > Email e certifique-se de que:';
  RAISE NOTICE '   - "Confirm email" está ATIVADO para exigir confirmação de email';
  RAISE NOTICE '   - "Secure email change" está ATIVADO para segurança';
  RAISE NOTICE '';
  RAISE NOTICE '3. Para configurar SMTP para envio de emails reais:';
  RAISE NOTICE '   - Acesse Project Settings > API > SMTP Settings';
  RAISE NOTICE '   - Configure um provedor SMTP como SendGrid, Mailgun, etc.';
  RAISE NOTICE '   - Insira host, porta, usuário, senha e email sender';
  RAISE NOTICE '';
  RAISE NOTICE 'IMPORTANTE: Para testes, você pode ver os emails simulados em:';
  RAISE NOTICE 'Authentication > Users > Selecione um usuário > Logs';
END $$;

-- 3. Verificar se os usuários existentes precisam de confirmação
SELECT 
  email, 
  raw_app_meta_data,
  CASE 
    WHEN raw_app_meta_data->>'email_confirmed_at' IS NULL THEN 'Não confirmado'
    ELSE 'Confirmado em ' || raw_app_meta_data->>'email_confirmed_at'
  END as status_confirmacao
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- 4. Para confirmar manualmente um email específico (use com cuidado, apenas para testes)
-- Descomente e substitua o email para o email real
/*
UPDATE auth.users
SET 
  raw_app_meta_data = 
    CASE 
      WHEN raw_app_meta_data IS NULL THEN 
        jsonb_build_object('provider', 'email', 'providers', array['email'], 'email_confirmed_at', now()::text)
      ELSE 
        raw_app_meta_data || 
        jsonb_build_object('email_confirmed_at', now()::text)
    END,
  email_confirmed_at = now(),
  confirmed_at = now()
WHERE email = 'EMAIL_DO_USUARIO';

RAISE NOTICE 'Email confirmado manualmente para o usuário especificado';
*/

-- 5. Para reenviar email de confirmação (simulação do que a API faz)
-- Descomente e substitua o email para o email real
/*
UPDATE auth.users
SET confirmation_sent_at = now()
WHERE email = 'EMAIL_DO_USUARIO'
AND (confirmed_at IS NULL);

RAISE NOTICE 'Simulação de reenvio de email de confirmação realizada';
*/ 