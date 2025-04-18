-- Criar tabela site_settings para armazenar configurações do site
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Adicionar comentário à tabela
COMMENT ON TABLE site_settings IS 'Tabela para armazenar configurações globais do site';

-- Inserir configuração inicial da imagem de capa se não existir
INSERT INTO site_settings (key, value, description)
VALUES (
  'cover_image',
  'https://images.unsplash.com/photo-1519214605650-76a613ee3245?q=80&w=2069&auto=format&fit=crop',
  'URL da imagem de capa exibida na página inicial'
)
ON CONFLICT (key) DO NOTHING;

-- Configurar políticas de segurança (RLS)
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura por qualquer usuário autenticado
CREATE POLICY "Permitir leitura publica das configuracoes do site"
  ON site_settings
  FOR SELECT
  TO authenticated
  USING (true);

-- Política para permitir atualização apenas por super_admin
CREATE POLICY "Permitir atualizacao de configuracoes apenas para super_admin"
  ON site_settings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- Política para permitir inserção apenas por super_admin
CREATE POLICY "Permitir insercao de configuracoes apenas para super_admin"
  ON site_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- Política para permitir exclusão apenas por super_admin
CREATE POLICY "Permitir exclusao de configuracoes apenas para super_admin"
  ON site_settings
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  ); 