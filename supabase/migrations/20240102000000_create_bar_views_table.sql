-- Create bar_views table
CREATE TABLE IF NOT EXISTS public.bar_views (
  id SERIAL PRIMARY KEY,
  bar_id INTEGER REFERENCES public.bars(id) ON DELETE CASCADE,
  view_count INTEGER DEFAULT 0,
  last_viewed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS bar_views_bar_id_idx ON public.bar_views(bar_id);

-- Add RLS policies
ALTER TABLE public.bar_views ENABLE ROW LEVEL SECURITY;

-- Policy for reading: users can read their own bar views, admins can read all
CREATE POLICY bar_views_select_policy ON public.bar_views
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.bars WHERE id = bar_id
    ) OR
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'super_admin'
    )
  );

-- Policy for inserting: anyone can insert (for tracking views)
CREATE POLICY bar_views_insert_policy ON public.bar_views
  FOR INSERT
  WITH CHECK (true);

-- Policy for updating: users can update their own bar views, admins can update all
CREATE POLICY bar_views_update_policy ON public.bar_views
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.bars WHERE id = bar_id
    ) OR
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'super_admin'
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM public.bars WHERE id = bar_id
    ) OR
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'super_admin'
    )
  ); 