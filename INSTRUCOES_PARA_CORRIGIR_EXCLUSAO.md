# Instruções para Corrigir o Problema de Exclusão de Bares

Este documento contém as instruções necessárias para corrigir o problema de exclusão de bares na aplicação VibeDaCidade.

## Problema

Atualmente, há dificuldade em excluir bares devido às relações entre tabelas que impõem restrições de chave estrangeira.

## Solução

A solução envolve duas partes:

1. Uma função SQL que permite excluir bares forçadamente
2. As alterações já implementadas no código React

## Como Aplicar a Função SQL

1. Acesse o painel de controle do Supabase (https://app.supabase.com)
2. Selecione seu projeto "VibeDaCidade"
3. No menu lateral, clique em "SQL Editor"
4. Clique em "New Query" (Novo Query)
5. Cole o código abaixo:

```sql
-- Função para forçar a exclusão de um bar
CREATE OR REPLACE FUNCTION force_delete_bar(target_id INT)
RETURNS VOID AS $$
BEGIN
    -- Excluir primeiro os registros relacionados em bar_views
    DELETE FROM bar_views WHERE bar_id = target_id;
    
    -- Excluir os eventos associados a este bar
    DELETE FROM events WHERE bar_id = target_id;
    
    -- Por fim, excluir o bar
    DELETE FROM bars WHERE id = target_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

6. Clique em "Run" (Executar)
7. Você verá a mensagem "Success. No rows returned" se tudo ocorrer bem

## Verificação

Após aplicar a função:

1. Volte para a aplicação
2. Teste excluir um bar que antes não era possível
3. O processo de exclusão deve funcionar corretamente agora

## Problemas Resolvidos

As alterações resolvem dois problemas:

1. **Exclusão de bares**: Agora conseguimos excluir os bares mesmo quando têm referências em outras tabelas
2. **Duplicação na página de estatísticas**: Os cartões na página bar-stats não serão mais duplicados para o mesmo bar

## Contato

Se encontrar algum outro problema, entre em contato com o desenvolvedor. 