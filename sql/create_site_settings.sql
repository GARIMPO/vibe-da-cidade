-- Create site_settings table to store global configuration
-- This table will use a key-value pattern for flexibility

CREATE TABLE IF NOT EXISTS "public"."site_settings" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "key" text NOT NULL,
    "value" text,
    "created_at" timestamp with time zone NOT NULL DEFAULT now(),
    "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
    PRIMARY KEY ("id"),
    UNIQUE ("key")
);

-- Add RLS policies for site_settings table
ALTER TABLE "public"."site_settings" ENABLE ROW LEVEL SECURITY;

-- Only superadmins can read and modify site settings
CREATE POLICY "Allow superadmins to read site_settings" 
    ON "public"."site_settings" 
    FOR SELECT 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM "public"."users" 
            WHERE "public"."users".id = auth.uid() 
            AND "public"."users".role = 'super_admin'
        )
    );

CREATE POLICY "Allow superadmins to insert site_settings" 
    ON "public"."site_settings" 
    FOR INSERT 
    TO authenticated 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM "public"."users" 
            WHERE "public"."users".id = auth.uid() 
            AND "public"."users".role = 'super_admin'
        )
    );

CREATE POLICY "Allow superadmins to update site_settings" 
    ON "public"."site_settings" 
    FOR UPDATE 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM "public"."users" 
            WHERE "public"."users".id = auth.uid() 
            AND "public"."users".role = 'super_admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM "public"."users" 
            WHERE "public"."users".id = auth.uid() 
            AND "public"."users".role = 'super_admin'
        )
    );

CREATE POLICY "Allow superadmins to delete site_settings" 
    ON "public"."site_settings" 
    FOR DELETE 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM "public"."users" 
            WHERE "public"."users".id = auth.uid() 
            AND "public"."users".role = 'super_admin'
        )
    );

-- Also permit anonymous users to read site settings, but not modify
CREATE POLICY "Allow anon to read site_settings" 
    ON "public"."site_settings" 
    FOR SELECT 
    TO anon 
    USING (true);

-- Add comment for documentation
COMMENT ON TABLE "public"."site_settings" IS 'Global site settings with key-value pairs for configuration';

-- Insert default settings
INSERT INTO "public"."site_settings" ("key", "value")
VALUES 
    ('cover_image', 'https://images.unsplash.com/photo-1516450360452-9312f5463357?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3'),
    ('maps_link', 'https://www.google.com/maps/search/bares+e+restaurantes')
ON CONFLICT ("key") DO NOTHING; 