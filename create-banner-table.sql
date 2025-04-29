-- Create promotional_banners table
CREATE TABLE IF NOT EXISTS public.promotional_banners (
  id SERIAL PRIMARY KEY,
  image_url TEXT,
  text TEXT,
  link_url TEXT,
  active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE public.promotional_banners ENABLE ROW LEVEL SECURITY;

-- Policy for reading: anyone can read active banners
CREATE POLICY promotional_banners_select_policy ON public.promotional_banners
  FOR SELECT
  USING (active = true OR (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'super_admin'
    )
  ));

-- Policy for inserting and updating: only super_admin can modify
CREATE POLICY promotional_banners_insert_policy ON public.promotional_banners
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'super_admin'
    )
  );

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

CREATE POLICY promotional_banners_delete_policy ON public.promotional_banners
  FOR DELETE
  USING (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'super_admin'
    )
  );

-- Create storage bucket for banner images
INSERT INTO storage.buckets (id, name, public)
VALUES ('banner-images', 'banner-images', true)
ON CONFLICT (id) DO NOTHING;

-- Banner images are publicly accessible
CREATE POLICY "Banner images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'banner-images')
  ON CONFLICT DO NOTHING;

-- Only super_admin can upload banner images
CREATE POLICY "Super admin can upload banner images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'banner-images' AND
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'super_admin'
    )
  )
  ON CONFLICT DO NOTHING;

-- Only super_admin can update banner images
CREATE POLICY "Super admin can update banner images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'banner-images' AND
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'super_admin'
    )
  )
  ON CONFLICT DO NOTHING;

-- Only super_admin can delete banner images
CREATE POLICY "Super admin can delete banner images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'banner-images' AND
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'super_admin'
    )
  )
  ON CONFLICT DO NOTHING; 