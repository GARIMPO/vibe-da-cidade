-- Criar buckets de armazenamento (se não existirem)
DO $$
BEGIN
  -- Bucket para imagens de usuário
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE name = 'user-images'
  ) THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('user-images', 'user-images', true);
    
    -- Criar política para leitura pública
    CREATE POLICY "Política de leitura pública para imagens de usuário" ON storage.objects
      FOR SELECT USING (bucket_id = 'user-images');
      
    -- Criar política para upload (apenas usuários autenticados)
    CREATE POLICY "Política de upload para imagens de usuário" ON storage.objects
      FOR INSERT WITH CHECK (
        bucket_id = 'user-images' AND
        auth.role() = 'authenticated'
      );
      
    -- Criar política para atualização (apenas donos)
    CREATE POLICY "Política de atualização para imagens de usuário" ON storage.objects
      FOR UPDATE USING (
        bucket_id = 'user-images' AND
        auth.uid()::text = owner
      );
      
    -- Criar política para exclusão (apenas donos)
    CREATE POLICY "Política de exclusão para imagens de usuário" ON storage.objects
      FOR DELETE USING (
        bucket_id = 'user-images' AND
        auth.uid()::text = owner
      );
  END IF;
END
$$; 