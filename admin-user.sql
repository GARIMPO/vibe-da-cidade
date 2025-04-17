-- Script para configurar o primeiro usuário como administrador
-- Execute este script APÓS criar seu primeiro usuário no site
-- Substitua o valor '00000000-0000-0000-0000-000000000000' abaixo pelo ID real do usuário (UUID)
-- Para encontrar este ID, vá até o painel do Supabase > Authentication > Users e copie o UUID do usuário

UPDATE users
SET role = 'super_admin', 
    approved = TRUE
WHERE id = '00000000-0000-0000-0000-000000000000';  -- ⚠️ SUBSTITUA ESTE UUID PELO ID DO SEU USUÁRIO

-- Opcional: Verifique se a atualização foi bem-sucedida
SELECT id, email, name, role, approved 
FROM users 
WHERE id = '00000000-0000-0000-0000-000000000000';  -- ⚠️ SUBSTITUA ESTE UUID PELO ID DO SEU USUÁRIO 