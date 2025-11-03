-- Add comprehensive booking fields to trips table for booking_app
-- This migration adds all the enhanced client information and booking details

-- Add building/apartment information fields
ALTER TABLE trips
ADD COLUMN IF NOT EXISTS pickup_building_info TEXT;

ALTER TABLE trips
ADD COLUMN IF NOT EXISTS destination_building_info TEXT;

-- Add client demographics fields
ALTER TABLE trips
ADD COLUMN IF NOT EXISTS weight INTEGER;

ALTER TABLE trips
ADD COLUMN IF NOT EXISTS height_feet INTEGER;

ALTER TABLE trips
ADD COLUMN IF NOT EXISTS height_inches INTEGER;

ALTER TABLE trips
ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- Add additional passengers field
ALTER TABLE trips
ADD COLUMN IF NOT EXISTS additional_passengers INTEGER DEFAULT 0;

-- Add comments to document the purpose of each field
COMMENT ON COLUMN trips.pickup_building_info IS 'Additional pickup location details (apartment, suite, building entrance, etc.)';
COMMENT ON COLUMN trips.destination_building_info IS 'Additional destination details (building, entrance, room number, etc.)';
COMMENT ON COLUMN trips.weight IS 'Client weight in pounds - used for bariatric pricing (300-399 lbs = $150/leg, 400+ lbs = cannot accommodate)';
COMMENT ON COLUMN trips.height_feet IS 'Client height in feet (4-7)';
COMMENT ON COLUMN trips.height_inches IS 'Client height in inches (0-11)';
COMMENT ON COLUMN trips.date_of_birth IS 'Client date of birth - required for hospital record verification';
COMMENT ON COLUMN trips.additional_passengers IS 'Number of additional passengers (0-4) accompanying the primary client';

-- Note: special_requirements field already exists and is being used for trip_notes
COMMENT ON COLUMN trips.special_requirements IS 'Special instructions, medical equipment needs, and other trip-specific notes';
