-- Add payment_method_id column to trips table
-- This column will store the Stripe payment method ID used for the trip

ALTER TABLE trips 
ADD COLUMN payment_method_id TEXT;

-- Add a comment to document what this column stores
COMMENT ON COLUMN trips.payment_method_id IS 'Stripe payment method ID used for this trip';

-- Add return_pickup_time column for round trips (if it doesn't exist)
-- This will store when the passenger wants to be picked up for the return journey
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'trips' AND column_name = 'return_pickup_time') THEN
        ALTER TABLE trips ADD COLUMN return_pickup_time TIMESTAMPTZ;
        COMMENT ON COLUMN trips.return_pickup_time IS 'Pickup time for return journey in round trips';
    END IF;
END $$;

-- Add is_veteran column to profiles table (if it doesn't exist)
-- This will help determine discount eligibility
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'is_veteran') THEN
        ALTER TABLE profiles ADD COLUMN is_veteran BOOLEAN DEFAULT FALSE;
        COMMENT ON COLUMN profiles.is_veteran IS 'Whether the user is a veteran (for discount eligibility)';
    END IF;
END $$;
