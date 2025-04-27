-- Criar uma função para ser chamada via RPC para criar a tabela de banners promocionais
CREATE OR REPLACE FUNCTION public.create_promotional_banners_if_not_exists()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Criar a tabela se não existir
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

  -- Verificar e criar as políticas
  -- Policy for reading: anyone can read active banners
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

  -- Policy for inserting: only super_admin can modify
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

  -- Policy for updating: only super_admin can modify
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

  -- Policy for deleting: only super_admin can modify
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

  -- Criar bucket de storage se não existir
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'banner-images') THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('banner-images', 'banner-images', true);
  END IF;

  -- Criar políticas de acesso ao storage
  -- Banner images are publicly accessible
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' AND policyname = 'Banner images are publicly accessible'
  ) THEN
    CREATE POLICY "Banner images are publicly accessible"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'banner-images');
  END IF;

  -- Only super_admin can upload banner images
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

  -- Only super_admin can update banner images
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

  -- Only super_admin can delete banner images
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

END;
$$; 