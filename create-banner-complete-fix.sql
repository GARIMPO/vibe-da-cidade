-- Script completo para criar a tabela promotional_banners, bucket e todas as políticas
-- Execute este script no console SQL do Supabase (https://app.supabase.com, seção SQL Editor)

-- Criar a tabela promotional_banners
CREATE TABLE IF NOT EXISTS public.promotional_banners (
  id SERIAL PRIMARY KEY,
  image_url TEXT,
  text TEXT,
  link_url TEXT,
  active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS na tabela
ALTER TABLE public.promotional_banners ENABLE ROW LEVEL SECURITY;

-- Política para SELECT: qualquer um pode ler banners ativos, super_admin pode ler todos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'promotional_banners' AND policyname = 'promotional_banners_select_policy'
  ) THEN
    CREATE POLICY promotional_banners_select_policy ON public.promotional_banners
      FOR SELECT
      USING (active = true OR (
        auth.uid() IN (
          SELECT id FROM public.users WHERE role = 'super_admin'
        )
      ));
  END IF;
END
$$;

-- Política para INSERT: apenas super_admin pode inserir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'promotional_banners' AND policyname = 'promotional_banners_insert_policy'
  ) THEN
    CREATE POLICY promotional_banners_insert_policy ON public.promotional_banners
      FOR INSERT
      WITH CHECK (
        auth.uid() IN (
          SELECT id FROM public.users WHERE role = 'super_admin'
        )
      );
  END IF;
END
$$;

-- Política para UPDATE: apenas super_admin pode atualizar
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'promotional_banners' AND policyname = 'promotional_banners_update_policy'
  ) THEN
    CREATE POLICY promotional_banners_update_policy ON public.promotional_banners
      FOR UPDATE
      USING (
        auth.uid() IN (
          SELECT id FROM public.users WHERE role = 'super_admin'
        )
      )
      WITH CHECK (
        auth.uid() IN (
          SELECT id FROM public.users WHERE role = 'super_admin'
        )
      );
  END IF;
END
$$;

-- Política para DELETE: apenas super_admin pode excluir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'promotional_banners' AND policyname = 'promotional_banners_delete_policy'
  ) THEN
    CREATE POLICY promotional_banners_delete_policy ON public.promotional_banners
      FOR DELETE
      USING (
        auth.uid() IN (
          SELECT id FROM public.users WHERE role = 'super_admin'
        )
      );
  END IF;
END
$$;

-- Criar bucket de armazenamento para imagens dos banners
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'banner-images') THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('banner-images', 'banner-images', true);
  END IF;
END
$$;

-- Políticas de storage para imagens dos banners

-- Política para SELECT: imagens são publicamente acessíveis
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' AND policyname = 'Banner images are publicly accessible'
  ) THEN
    CREATE POLICY "Banner images are publicly accessible"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'banner-images');
  END IF;
END
$$;

-- Política para INSERT: apenas super_admin pode fazer upload
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' AND policyname = 'Super admin can upload banner images'
  ) THEN
    CREATE POLICY "Super admin can upload banner images"
      ON storage.objects FOR INSERT
      WITH CHECK (
        bucket_id = 'banner-images' AND
        auth.uid() IN (
          SELECT id FROM public.users WHERE role = 'super_admin'
        )
      );
  END IF;
END
$$;

-- Política para UPDATE: apenas super_admin pode atualizar imagens
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' AND policyname = 'Super admin can update banner images'
  ) THEN
    CREATE POLICY "Super admin can update banner images"
      ON storage.objects FOR UPDATE
      USING (
        bucket_id = 'banner-images' AND
        auth.uid() IN (
          SELECT id FROM public.users WHERE role = 'super_admin'
        )
      );
  END IF;
END
$$;

-- Política para DELETE: apenas super_admin pode excluir imagens
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' AND policyname = 'Super admin can delete banner images'
  ) THEN
    CREATE POLICY "Super admin can delete banner images"
      ON storage.objects FOR DELETE
      USING (
        bucket_id = 'banner-images' AND
        auth.uid() IN (
          SELECT id FROM public.users WHERE role = 'super_admin'
        )
      );
  END IF;
END
$$;

-- Criar a função RPC para criação da tabela (opcional, mas pode ser útil para chamadas futuras do código)
CREATE OR REPLACE FUNCTION public.create_promotional_banners_if_not_exists()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- A função está vazia pois a tabela e políticas já foram criadas acima
  RAISE NOTICE 'Tabela promotional_banners já criada pelo script principal.';
END;
$$; 