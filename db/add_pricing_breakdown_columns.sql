-- Add pricing breakdown storage columns to trips table
-- This matches the facility_app implementation for consistency

DO $$ 
BEGIN
    -- Add pricing_breakdown_data column to store the detailed breakdown as JSON
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'trips' AND column_name = 'pricing_breakdown_data') THEN
        ALTER TABLE trips ADD COLUMN pricing_breakdown_data JSONB;
        COMMENT ON COLUMN trips.pricing_breakdown_data IS 'Detailed pricing breakdown from booking (JSON) - locked from booking page';
        RAISE NOTICE '✅ Added pricing_breakdown_data column';
    ELSE
        RAISE NOTICE 'ℹ️ pricing_breakdown_data column already exists';
    END IF;
    
    -- Add pricing_breakdown_total column for quick total access
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'trips' AND column_name = 'pricing_breakdown_total') THEN
        ALTER TABLE trips ADD COLUMN pricing_breakdown_total DECIMAL(10,2);
        COMMENT ON COLUMN trips.pricing_breakdown_total IS 'Total amount from pricing breakdown for quick access';
        RAISE NOTICE '✅ Added pricing_breakdown_total column';
    ELSE
        RAISE NOTICE 'ℹ️ pricing_breakdown_total column already exists';
    END IF;
    
    -- Add pricing_breakdown_locked_at column for tracking when breakdown was saved
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'trips' AND column_name = 'pricing_breakdown_locked_at') THEN
        ALTER TABLE trips ADD COLUMN pricing_breakdown_locked_at TIMESTAMPTZ;
        COMMENT ON COLUMN trips.pricing_breakdown_locked_at IS 'When the pricing breakdown was locked during booking';
        RAISE NOTICE '✅ Added pricing_breakdown_locked_at column';
    ELSE
        RAISE NOTICE 'ℹ️ pricing_breakdown_locked_at column already exists';
    END IF;
    
    -- Update existing trips to have pricing_breakdown_total match their price column
    UPDATE trips 
    SET pricing_breakdown_total = price 
    WHERE pricing_breakdown_total IS NULL AND price IS NOT NULL;
    
    RAISE NOTICE '✅ Migrated existing trip prices to pricing_breakdown_total';
    
END $$;

-- Show confirmation
SELECT 
    'Pricing breakdown storage setup complete!' as status,
    'Individual bookings will now save detailed pricing breakdowns' as note;
