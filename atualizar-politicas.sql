-- Script SQL para atualizar políticas de segurança
-- Execute este script no SQL Editor do Supabase DEPOIS do create-admin-direto.sql

-- Atualizar políticas para a tabela bars
ALTER TABLE bars ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON bars;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON bars;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON bars;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON bars;

CREATE POLICY "Enable read access for all users" ON bars
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON bars
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON bars
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON bars
  FOR DELETE USING (true);

-- Atualizar políticas para a tabela events
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON events;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON events;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON events;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON events;

CREATE POLICY "Enable read access for all users" ON events
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON events
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON events
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON events
  FOR DELETE USING (true);

-- Configurar storage para imagens
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
CREATE POLICY "Allow public read access" ON storage.objects FOR SELECT
USING (bucket_id IN ('bar-images', 'event-images', 'profile-images'));

DROP POLICY IF EXISTS "Allow public insert" ON storage.objects;
CREATE POLICY "Allow public insert" ON storage.objects FOR INSERT
WITH CHECK (bucket_id IN ('bar-images', 'event-images', 'profile-images'));

DROP POLICY IF EXISTS "Allow public update" ON storage.objects;
CREATE POLICY "Allow public update" ON storage.objects FOR UPDATE
USING (bucket_id IN ('bar-images', 'event-images', 'profile-images'));

DROP POLICY IF EXISTS "Allow public delete" ON storage.objects;
CREATE POLICY "Allow public delete" ON storage.objects FOR DELETE
USING (bucket_id IN ('bar-images', 'event-images', 'profile-images')); 