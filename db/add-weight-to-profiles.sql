-- Add weight column to profiles table for booking_app
-- This allows clients to set their weight once in their profile
-- and it will be automatically used for pricing calculations

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS weight NUMERIC;

COMMENT ON COLUMN profiles.weight IS 'Client weight in pounds - used for bariatric pricing (300+ lbs = $150/leg)';
