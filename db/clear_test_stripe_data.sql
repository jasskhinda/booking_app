-- Clear test Stripe customer IDs to allow fresh creation
UPDATE profiles SET stripe_customer_id = NULL WHERE stripe_customer_id LIKE 'cus_%';

-- Clear test payment method references
UPDATE profiles SET default_payment_method_id = NULL WHERE default_payment_method_id IS NOT NULL;
