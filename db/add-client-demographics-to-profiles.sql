-- Add client demographics to profiles table for booking_app individual clients
-- IMPORTANT: This database is shared. facility_app uses facility_managed_clients table.
-- We need these fields in profiles table for individual clients (non-facility users).

-- weight column already exists, but we'll check and add the others

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'profiles' AND column_name = 'height_feet') THEN
        ALTER TABLE profiles ADD COLUMN height_feet INTEGER;
        COMMENT ON COLUMN profiles.height_feet IS 'Client height in feet (4-7) - for individual clients in booking_app';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'profiles' AND column_name = 'height_inches') THEN
        ALTER TABLE profiles ADD COLUMN height_inches INTEGER;
        COMMENT ON COLUMN profiles.height_inches IS 'Client height in inches (0-11) - for individual clients in booking_app';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'profiles' AND column_name = 'date_of_birth') THEN
        ALTER TABLE profiles ADD COLUMN date_of_birth DATE;
        COMMENT ON COLUMN profiles.date_of_birth IS 'Client date of birth - required for hospital verification';
    END IF;
END $$;

-- Note: weight column already exists in profiles table (verified from your schema query)
-- Note: facility_app stores this same data in facility_managed_clients table for their managed clients
-- This keeps facility clients and individual clients separate in the database
