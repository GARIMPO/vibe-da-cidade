-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create bars table
CREATE TABLE IF NOT EXISTS bars (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    description TEXT,
    rating NUMERIC(3,1) DEFAULT 0,
    image TEXT,
    tags TEXT[],
    hours JSONB,
    instagram TEXT,
    whatsapp TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create events table
CREATE TABLE IF NOT EXISTS events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    time TEXT NOT NULL,
    location TEXT NOT NULL,
    image TEXT,
    youtube_url TEXT,
    bar_id UUID REFERENCES bars(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security for both tables
ALTER TABLE bars ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Create policies for bars
CREATE POLICY "Enable read access for all users" ON bars
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON bars
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON bars
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for authenticated users" ON bars
    FOR DELETE USING (true);

-- Create policies for events
CREATE POLICY "Enable read access for all users" ON events
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON events
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON events
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for authenticated users" ON events
    FOR DELETE USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for both tables
CREATE TRIGGER update_bars_updated_at
    BEFORE UPDATE ON bars
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create storage buckets if they don't exist
DO $$
BEGIN
    -- Bar images bucket
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'bar-images') THEN
        INSERT INTO storage.buckets (id, name, public)
        VALUES ('bar-images', 'bar-images', true);
    END IF;

    -- Event images bucket
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'event-images') THEN
        INSERT INTO storage.buckets (id, name, public)
        VALUES ('event-images', 'event-images', true);
    END IF;
END $$;

-- Create storage policies if they don't exist
DO $$
BEGIN
    -- Bar images policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Bar images are publicly accessible') THEN
        CREATE POLICY "Bar images are publicly accessible"
            ON storage.objects FOR SELECT
            USING (bucket_id = 'bar-images');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can upload bar images') THEN
        CREATE POLICY "Anyone can upload bar images"
            ON storage.objects FOR INSERT
            WITH CHECK (bucket_id = 'bar-images');
    END IF;

    -- Event images policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Event images are publicly accessible') THEN
        CREATE POLICY "Event images are publicly accessible"
            ON storage.objects FOR SELECT
            USING (bucket_id = 'event-images');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can upload event images') THEN
        CREATE POLICY "Anyone can upload event images"
            ON storage.objects FOR INSERT
            WITH CHECK (bucket_id = 'event-images');
    END IF;
END $$;

-- Insert sample data for bars
INSERT INTO bars (name, location, description, rating, image, tags, hours, instagram, whatsapp)
VALUES 
('Bar do Zé', 'Rua das Flores, 123', 'Um bar tradicional com música ao vivo', 4.5, 'https://images.unsplash.com/photo-1514933651103-005eec06c04b', ARRAY['música ao vivo', 'petisco'], 
'{"segunda": {"aberto": true, "inicio": "18:00", "fim": "23:00"}, "terca": {"aberto": true, "inicio": "18:00", "fim": "23:00"}, "quarta": {"aberto": true, "inicio": "18:00", "fim": "23:00"}, "quinta": {"aberto": true, "inicio": "18:00", "fim": "23:00"}, "sexta": {"aberto": true, "inicio": "18:00", "fim": "00:00"}, "sabado": {"aberto": true, "inicio": "18:00", "fim": "00:00"}, "domingo": {"aberto": false}}',
'@bardoze', '5511999999999')
ON CONFLICT DO NOTHING;

-- Insert sample data for events
INSERT INTO events (title, description, date, time, location, image, youtube_url, bar_id)
SELECT 
    'Festa de Aniversário',
    'Venha comemorar conosco! Música ao vivo e drinks especiais.',
    CURRENT_DATE + INTERVAL '7 days',
    '20:00',
    'Bar do Zé',
    'https://images.unsplash.com/photo-1514933651103-005eec06c04b',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    id
FROM bars WHERE name = 'Bar do Zé'
ON CONFLICT DO NOTHING; 