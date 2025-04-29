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