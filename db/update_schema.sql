-- Add new columns to profiles table for Stripe integration
ALTER TABLE IF EXISTS profiles 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS default_payment_method_id TEXT;

-- Add first_name and last_name columns to profiles table
ALTER TABLE IF EXISTS profiles
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Migrate existing data from full_name to first_name and last_name
UPDATE profiles 
SET 
  first_name = SPLIT_PART(full_name, ' ', 1),
  last_name = SUBSTRING(full_name FROM POSITION(' ' IN full_name) + 1)
WHERE 
  full_name IS NOT NULL AND 
  first_name IS NULL;

-- Add client role column to profiles table
ALTER TABLE IF EXISTS profiles
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'client';

-- Add feedback column to trips table
ALTER TABLE IF EXISTS trips
ADD COLUMN IF NOT EXISTS feedback TEXT;

-- Update status CHECK constraint to include 'pending'
ALTER TABLE trips DROP CONSTRAINT IF EXISTS trips_status_check;
ALTER TABLE trips ADD CONSTRAINT trips_status_check 
CHECK (status IN ('pending', 'upcoming', 'completed', 'cancelled', 'in_progress'));

-- Add round_trip column to trips table
ALTER TABLE IF EXISTS trips
ADD COLUMN IF NOT EXISTS wheelchair_type TEXT,
ADD COLUMN IF NOT EXISTS is_round_trip BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS distance DECIMAL(10,1);

-- Update existing users to have the 'client' role
UPDATE profiles SET role = 'client' WHERE role IS NULL;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Dispatchers can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Dispatchers can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Dispatchers can delete profiles" ON profiles;
DROP POLICY IF EXISTS "Dispatchers can view all trips" ON trips;
DROP POLICY IF EXISTS "Dispatchers can update all trips" ON trips;
DROP POLICY IF EXISTS "Dispatchers can delete trips" ON trips;

-- Drop and recreate triggers to avoid conflicts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Update the handle_new_user function to use first_name and last_name
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$$
DECLARE
  first_name_val TEXT;
  last_name_val TEXT;
BEGIN
  -- For OAuth logins, handle OAuth provider specific metadata formats
  IF NEW.raw_user_meta_data->>'provider' = 'google' THEN
    first_name_val := NEW.raw_user_meta_data->'user_name'->>'first_name';
    last_name_val := NEW.raw_user_meta_data->'user_name'->>'last_name';
    
    -- Fallback for older format or other variations
    IF first_name_val IS NULL THEN
      first_name_val := NEW.raw_user_meta_data->>'given_name';
      last_name_val := NEW.raw_user_meta_data->>'family_name';
    END IF;
  ELSE
    -- For email signup with our form
    first_name_val := NEW.raw_user_meta_data->>'first_name';
    last_name_val := NEW.raw_user_meta_data->>'last_name';
    
    -- Fallback: if we have a full_name but no first/last name (for backward compatibility)
    IF first_name_val IS NULL AND NEW.raw_user_meta_data->>'full_name' IS NOT NULL THEN
      first_name_val := SPLIT_PART(NEW.raw_user_meta_data->>'full_name', ' ', 1);
      last_name_val := SUBSTRING(NEW.raw_user_meta_data->>'full_name' FROM POSITION(' ' IN NEW.raw_user_meta_data->>'full_name') + 1);
    END IF;
  END IF;
  
  INSERT INTO public.profiles (id, first_name, last_name, role)
  VALUES (
    NEW.id, 
    first_name_val,
    last_name_val,
    COALESCE(NEW.raw_user_meta_data->>'role', 'client') -- Use role from metadata or default to 'client'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policies for profiles table
-- Policy to allow dispatchers to view all profiles
CREATE POLICY IF NOT EXISTS "Dispatchers can view all profiles" 
ON profiles FOR SELECT 
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'dispatcher'
);

-- Policy to allow dispatchers to update all profiles
CREATE POLICY IF NOT EXISTS "Dispatchers can update all profiles" 
ON profiles FOR UPDATE 
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'dispatcher'
);

-- Policy to allow dispatchers to delete profiles
CREATE POLICY IF NOT EXISTS "Dispatchers can delete profiles" 
ON profiles FOR DELETE 
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'dispatcher'
);

-- Policies for trips table (must be applied after profiles are updated)
-- Policy to allow dispatchers to view all trips
CREATE POLICY IF NOT EXISTS "Dispatchers can view all trips" 
ON trips FOR SELECT 
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'dispatcher'
);

-- Policy to allow dispatchers to update all trips
CREATE POLICY IF NOT EXISTS "Dispatchers can update all trips" 
ON trips FOR UPDATE 
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'dispatcher'
);

-- Policy to allow dispatchers to delete trips
CREATE POLICY IF NOT EXISTS "Dispatchers can delete trips" 
ON trips FOR DELETE 
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'dispatcher'
);

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();