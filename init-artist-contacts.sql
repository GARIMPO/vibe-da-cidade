-- Função para criar a tabela artist_contacts se não existir
CREATE OR REPLACE FUNCTION public.create_artist_contacts_if_not_exists()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se a tabela artist_contacts já existe
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'artist_contacts'
  ) THEN
    -- Criar a tabela artist_contacts
    CREATE TABLE public.artist_contacts (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      url TEXT,
      active BOOLEAN DEFAULT true
    );

    -- Configurar permissões RLS (Row Level Security)
    ALTER TABLE public.artist_contacts ENABLE ROW LEVEL SECURITY;

    -- Criar políticas de segurança
    CREATE POLICY "Permitir leitura para todos os usuários autenticados"
      ON public.artist_contacts
      FOR SELECT
      TO authenticated
      USING (true);

    CREATE POLICY "Permitir inserção e atualização apenas para super_admin"
      ON public.artist_contacts
      FOR ALL
      TO authenticated
      USING (
        (SELECT role FROM public.users WHERE id = auth.uid()) = 'super_admin'
      );
  END IF;

  -- Verificar se a entrada 'show_artist_contacts' existe na tabela site_settings
  IF NOT EXISTS (
    SELECT FROM public.site_settings
    WHERE key = 'show_artist_contacts'
  ) THEN
    -- Inserir a configuração padrão (desativada)
    INSERT INTO public.site_settings (key, value)
    VALUES ('show_artist_contacts', 'false');
  END IF;
END;
$$;

-- Conceder permissões para funções
GRANT EXECUTE ON FUNCTION public.create_artist_contacts_if_not_exists() TO authenticated;

-- Verificar se a tabela site_settings existe e criá-la se necessário
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'site_settings'
  ) THEN
    -- Criar a tabela site_settings
    CREATE TABLE public.site_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    -- Configurar permissões RLS
    ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

    -- Criar políticas de segurança
    CREATE POLICY "Permitir leitura para todos os usuários autenticados"
      ON public.site_settings
      FOR SELECT
      TO authenticated
      USING (true);

    CREATE POLICY "Permitir inserção e atualização apenas para super_admin"
      ON public.site_settings
      FOR ALL
      TO authenticated
      USING (
        (SELECT role FROM public.users WHERE id = auth.uid()) = 'super_admin'
      );
  END IF;
END
$$;

-- Chamar a função para garantir que a tabela artist_contacts exista
SELECT create_artist_contacts_if_not_exists(); 