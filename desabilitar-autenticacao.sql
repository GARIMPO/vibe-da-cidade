-- Script para desabilitar completamente a autenticação
-- Execute este script no SQL Editor do Supabase
-- IMPORTANTE: Isso vai remover completamente a necessidade de login no site

-- Atualizar políticas para a tabela bars
ALTER TABLE bars ENABLE ROW LEVEL SECURITY;

-- Remover todas as políticas existentes
DROP POLICY IF EXISTS "Enable read access for all users" ON bars;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON bars;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON bars;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON bars;
DROP POLICY IF EXISTS "Enable insert for all users" ON bars;
DROP POLICY IF EXISTS "Enable update for all users" ON bars;
DROP POLICY IF EXISTS "Enable delete for all users" ON bars;

-- Criar políticas públicas
CREATE POLICY "Public read access" ON bars FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON bars FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON bars FOR UPDATE USING (true);
CREATE POLICY "Public delete access" ON bars FOR DELETE USING (true);

-- Atualizar políticas para a tabela events
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Remover todas as políticas existentes
DROP POLICY IF EXISTS "Enable read access for all users" ON events;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON events;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON events;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON events;
DROP POLICY IF EXISTS "Enable insert for all users" ON events;
DROP POLICY IF EXISTS "Enable update for all users" ON events;
DROP POLICY IF EXISTS "Enable delete for all users" ON events;

-- Criar políticas públicas
CREATE POLICY "Public read access" ON events FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON events FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON events FOR UPDATE USING (true);
CREATE POLICY "Public delete access" ON events FOR DELETE USING (true);

-- Configurar storage para imagens
-- Remover políticas existentes
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow public insert" ON storage.objects;
DROP POLICY IF EXISTS "Allow public update" ON storage.objects;
DROP POLICY IF EXISTS "Allow public delete" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload their profile images" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update their own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own profile images" ON storage.objects;

-- Criar políticas públicas para storage
CREATE POLICY "Allow public read" ON storage.objects FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON storage.objects FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON storage.objects FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON storage.objects FOR DELETE USING (true); 