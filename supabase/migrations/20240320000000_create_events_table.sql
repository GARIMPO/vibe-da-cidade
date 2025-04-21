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

-- Enable Row Level Security
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

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

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create storage bucket for event images if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'event-images') THEN
        INSERT INTO storage.buckets (id, name, public)
        VALUES ('event-images', 'event-images', true);
    END IF;
END $$;

-- Create storage policies for event images if they don't exist
DO $$
BEGIN
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