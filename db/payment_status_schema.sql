-- Add payment status tracking columns to trips table
-- These columns will support the comprehensive payment and approval ecosystem

-- Add payment-related columns if they don't exist
ALTER TABLE IF EXISTS trips 
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
ADD COLUMN IF NOT EXISTS payment_intent_id TEXT,
ADD COLUMN IF NOT EXISTS charged_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS payment_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS payment_method_id TEXT,
ADD COLUMN IF NOT EXISTS payment_error TEXT,
ADD COLUMN IF NOT EXISTS payment_attempted_at TIMESTAMPTZ;

-- Add trip_type column for differentiating facility vs individual bookings
ALTER TABLE IF EXISTS trips
ADD COLUMN IF NOT EXISTS trip_type VARCHAR(50) DEFAULT 'individual' CHECK (trip_type IN ('individual', 'facility_booking'));

-- Create index for payment status queries
CREATE INDEX IF NOT EXISTS idx_trips_payment_status ON trips(payment_status);
CREATE INDEX IF NOT EXISTS idx_trips_status_payment_status ON trips(status, payment_status);
CREATE INDEX IF NOT EXISTS idx_trips_trip_type ON trips(trip_type);

-- Comment on new columns
COMMENT ON COLUMN trips.payment_status IS 'Payment status: pending, paid, failed, refunded';
COMMENT ON COLUMN trips.payment_intent_id IS 'Stripe PaymentIntent ID for tracking';
COMMENT ON COLUMN trips.charged_at IS 'Timestamp when payment was successfully charged';
COMMENT ON COLUMN trips.payment_amount IS 'Amount actually charged (may differ from price due to discounts/fees)';
COMMENT ON COLUMN trips.payment_method_id IS 'Stripe PaymentMethod ID used for payment';
COMMENT ON COLUMN trips.payment_error IS 'Error message if payment failed';
COMMENT ON COLUMN trips.payment_attempted_at IS 'Timestamp of last payment attempt';
COMMENT ON COLUMN trips.trip_type IS 'Type of trip: individual (BookingCCT) or facility_booking (facility app)';
