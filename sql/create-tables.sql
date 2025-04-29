-- Criar tabela de configurações do site
CREATE TABLE IF NOT EXISTS site_settings (
    id SERIAL PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Criar tabela de bares
CREATE TABLE IF NOT EXISTS bars (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    description TEXT,
    rating NUMERIC(3,1) DEFAULT 0,
    image TEXT,
    additional_images TEXT[],
    events JSONB[],
    tags TEXT[],
    hours TEXT,
    maps_url TEXT,
    phone TEXT,
    instagram TEXT,
    facebook TEXT,
    discount_code TEXT DEFAULT NULL,
    discount_description TEXT DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Inserir configuração inicial da imagem de capa
INSERT INTO site_settings (key, value, description)
VALUES ('cover_image', 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=774&q=80', 'URL da imagem de capa do site')
ON CONFLICT (key) DO NOTHING;

-- Inserir alguns bares de exemplo com cupons de desconto
INSERT INTO bars (name, location, description, rating, image, events, tags, discount_code, discount_description)
VALUES 
    ('Boteco do Blues', 'Centro, Rua Augusta, 123', 'Um bar aconchegante com música ao vivo todas as noites e a melhor seleção de cervejas artesanais da cidade.', 4.8, 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=774&q=80', 
    '[{"name": "Noite de Blues & Jazz", "date": "Sexta, 20:00"}, {"name": "Open Mic Night", "date": "Sábado, 21:00"}]',
    '{"Música ao Vivo", "Cerveja Artesanal", "Petiscos"}',
    'BLUES10',
    '10% de desconto em todas as cervejas artesanais'),
    
    ('Rooftop Lounge', 'Pinheiros, Av. Faria Lima, 500', 'Bar com vista panorâmica da cidade, coquetéis exclusivos e um ambiente sofisticado para aproveitar o pôr do sol.', 4.5, 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1769&q=80',
    '[{"name": "Sunset DJ Session", "date": "Quinta, 18:00"}, {"name": "Cocktail Masterclass", "date": "Domingo, 16:00"}]',
    '{"Rooftop", "Coquetéis", "Pôr do Sol"}',
    'ROOFTOP20',
    '20% de desconto em todos os coquetéis')
ON CONFLICT (id) DO NOTHING; 