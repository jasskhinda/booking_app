-- Add new columns to profiles table for Stripe integration
ALTER TABLE IF EXISTS profiles 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS default_payment_method_id TEXT,
ADD COLUMN IF NOT EXISTS birthdate DATE,
ADD COLUMN IF NOT EXISTS marketing_consent BOOLEAN DEFAULT FALSE;

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
ADD COLUMN IF NOT EXISTS distance DECIMAL(10,1),
ADD COLUMN IF NOT EXISTS driver_id UUID REFERENCES auth.users(id);

-- Update existing users to have the 'client' role
UPDATE profiles SET role = 'client' WHERE role IS NULL;

-- Migrate drivers: This will attempt to find users with matching full_name to populate driver_id
-- Note: This is a best-effort migration. Manual intervention may be required if names don't match exactly.
UPDATE trips t
SET driver_id = p.id
FROM profiles p
WHERE t.driver_name IS NOT NULL 
AND t.driver_name != '' 
AND p.full_name = t.driver_name
AND p.role = 'driver';

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
RETURNS TRIGGER AS $$
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
  
  INSERT INTO public.profiles (
    id, 
    first_name, 
    last_name, 
    role, 
    birthdate, 
    marketing_consent
  )
  VALUES (
    NEW.id, 
    first_name_val,
    last_name_val,
    COALESCE(NEW.raw_user_meta_data->>'role', 'client'), -- Use role from metadata or default to 'client'
    CAST(NEW.raw_user_meta_data->>'birthdate' AS DATE), -- Cast birthdate string to DATE
    COALESCE((NEW.raw_user_meta_data->>'marketing_consent')::boolean, FALSE) -- Boolean conversion with default
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a stored procedure to avoid the infinite recursion
CREATE OR REPLACE FUNCTION is_dispatcher(uid uuid)
RETURNS boolean AS $$
DECLARE
  user_role text;
BEGIN
  -- Direct access to the profiles table without RLS
  SELECT role INTO user_role FROM profiles WHERE id = uid;
  RETURN user_role = 'dispatcher';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- A simpler approach with direct policy creation
-- Policies for profiles table
CREATE POLICY "Dispatchers can view all profiles" 
ON profiles FOR SELECT 
USING (is_dispatcher(auth.uid()));

CREATE POLICY "Dispatchers can update all profiles" 
ON profiles FOR UPDATE 
USING (is_dispatcher(auth.uid()));

CREATE POLICY "Dispatchers can delete profiles" 
ON profiles FOR DELETE 
USING (is_dispatcher(auth.uid()));

-- Policies for trips table
CREATE POLICY "Dispatchers can view all trips" 
ON trips FOR SELECT 
USING (is_dispatcher(auth.uid()));

CREATE POLICY "Dispatchers can update all trips" 
ON trips FOR UPDATE 
USING (is_dispatcher(auth.uid()));

CREATE POLICY "Dispatchers can delete trips" 
ON trips FOR DELETE 
USING (is_dispatcher(auth.uid()));

-- Policies for drivers to view and update their assigned trips
CREATE POLICY "Drivers can view trips assigned to them"
ON trips FOR SELECT
USING (auth.uid() = driver_id);

CREATE POLICY "Drivers can update trips assigned to them"
ON trips FOR UPDATE
USING (auth.uid() = driver_id);

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();