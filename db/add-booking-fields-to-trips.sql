-- Add comprehensive booking fields to trips table for booking_app
-- IMPORTANT: This database is shared across ALL apps (facility_app, booking_app, dispatcher_app, etc.)
-- Some columns already exist from facility_app migrations - we only add what's NEW

-- Add client demographics fields (NEW - don't exist in facility_app)
-- Using DO blocks to safely check and add columns to prevent conflicts

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'trips' AND column_name = 'weight') THEN
        ALTER TABLE trips ADD COLUMN weight NUMERIC(5,1);
        COMMENT ON COLUMN trips.weight IS 'Client weight in pounds - used for bariatric pricing (300-399 lbs = $150/leg, 400+ lbs = cannot accommodate)';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'trips' AND column_name = 'height_feet') THEN
        ALTER TABLE trips ADD COLUMN height_feet INTEGER;
        COMMENT ON COLUMN trips.height_feet IS 'Client height in feet (4-7)';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'trips' AND column_name = 'height_inches') THEN
        ALTER TABLE trips ADD COLUMN height_inches INTEGER;
        COMMENT ON COLUMN trips.height_inches IS 'Client height in inches (0-11)';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'trips' AND column_name = 'date_of_birth') THEN
        ALTER TABLE trips ADD COLUMN date_of_birth DATE;
        COMMENT ON COLUMN trips.date_of_birth IS 'Client date of birth - required for hospital record verification';
    END IF;
END $$;

-- IMPORTANT: The following columns ALREADY EXIST from facility_app migrations:
-- ============================================================================
-- - additional_passengers (from facility_app/db/add_missing_trip_columns.sql)
-- - pickup_details (from facility_app/db/add_missing_trip_columns.sql)
-- - destination_details (from facility_app/db/add_missing_trip_columns.sql)
-- - special_requirements (from original schema.sql)
--
-- We will use these existing columns in booking_app:
-- - pickup_building_info -> maps to pickup_details
-- - destination_building_info -> maps to destination_details
-- - tripNotes -> maps to special_requirements
--
-- DO NOT create duplicate columns! Update BookingForm.js to use the existing column names.
