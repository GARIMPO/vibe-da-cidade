-- Create registration_requests table
CREATE TABLE IF NOT EXISTS public.registration_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  cnpj TEXT NOT NULL,
  address TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS registration_requests_user_id_idx ON public.registration_requests(user_id);
CREATE INDEX IF NOT EXISTS registration_requests_status_idx ON public.registration_requests(status);
CREATE INDEX IF NOT EXISTS registration_requests_email_idx ON public.registration_requests(email);

-- Set up Row Level Security (RLS)
ALTER TABLE public.registration_requests ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Registration requests are viewable by admins only" 
ON public.registration_requests FOR SELECT 
USING (auth.uid() IN (
  SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'super_admin'
));

CREATE POLICY "Registration requests can be inserted by anyone" 
ON public.registration_requests FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Registration requests can be updated by admins only" 
ON public.registration_requests FOR UPDATE 
USING (auth.uid() IN (
  SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'super_admin'
));

-- Create function to update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at
CREATE TRIGGER update_registration_requests_updated_at
BEFORE UPDATE ON public.registration_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column(); 