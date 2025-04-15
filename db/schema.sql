-- Create UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the trips table
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  pickup_address TEXT NOT NULL,
  destination_address TEXT NOT NULL,
  pickup_time TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'upcoming', 'completed', 'cancelled', 'in_progress')),
  driver_name TEXT,
  vehicle TEXT,
  price DECIMAL(10,2),
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  feedback TEXT,
  cancellation_reason TEXT,
  refund_status TEXT,
  special_requirements TEXT,
  wheelchair_type TEXT,
  is_round_trip BOOLEAN DEFAULT FALSE,
  distance DECIMAL(10,1),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to see only their own trips
CREATE POLICY "Users can view their own trips" 
ON trips FOR SELECT USING (auth.uid() = user_id);

-- Policy to allow users to insert their own trips
CREATE POLICY "Users can insert their own trips" 
ON trips FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to update their own trips
CREATE POLICY "Users can update their own trips" 
ON trips FOR UPDATE USING (auth.uid() = user_id);

-- Dispatcher policies for trips will be added after profiles table is created

-- Add trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_trips_updated_at
BEFORE UPDATE ON trips
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  first_name TEXT,
  last_name TEXT,
  full_name TEXT GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
  avatar_url TEXT,
  phone_number TEXT,
  address TEXT,
  accessibility_needs TEXT,
  medical_requirements TEXT,
  emergency_contact TEXT,
  preferred_payment_method TEXT,
  stripe_customer_id TEXT,
  default_payment_method_id TEXT,
  role TEXT DEFAULT 'client',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to see only their own profile
CREATE POLICY "Users can view their own profile" 
ON profiles FOR SELECT USING (auth.uid() = id);

-- Policy to allow users to update their own profile
CREATE POLICY "Users can update their own profile" 
ON profiles FOR UPDATE USING (auth.uid() = id);

-- Simple policy for dispatcher role check
CREATE POLICY "Dispatchers can view all profiles" 
ON profiles FOR SELECT 
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'dispatcher'
);

-- Policy to allow dispatchers to update all profiles
CREATE POLICY "Dispatchers can update all profiles" 
ON profiles FOR UPDATE 
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'dispatcher'
);

-- Policy to allow dispatchers to delete profiles
CREATE POLICY "Dispatchers can delete profiles" 
ON profiles FOR DELETE 
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'dispatcher'
);

-- Function to create a profile when a new user signs up
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

-- Trigger to call the function on user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Add trip policies for dispatchers (now that profiles table exists)
-- Policy to allow dispatchers to view all trips
CREATE POLICY "Dispatchers can view all trips" 
ON trips FOR SELECT 
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'dispatcher'
);

-- Policy to allow dispatchers to update all trips
CREATE POLICY "Dispatchers can update all trips" 
ON trips FOR UPDATE 
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'dispatcher'
);

-- Policy to allow dispatchers to delete trips
CREATE POLICY "Dispatchers can delete trips" 
ON trips FOR DELETE 
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'dispatcher'
);