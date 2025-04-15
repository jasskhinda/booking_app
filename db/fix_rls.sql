-- Fix the missing RLS policy for user profile updates

-- First, let's check if the policy already exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles' 
    AND policyname = 'Users can update their own profile'
  ) THEN
    -- Re-create the missing policy
    CREATE POLICY "Users can update their own profile" 
    ON profiles FOR UPDATE 
    USING (auth.uid() = id);
    
    RAISE NOTICE 'Created policy "Users can update their own profile"';
  ELSE
    RAISE NOTICE 'Policy "Users can update their own profile" already exists';
  END IF;
END $$;

-- Also add an insert policy which might be missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles' 
    AND policyname = 'Users can insert their own profile'
  ) THEN
    -- Create insert policy
    CREATE POLICY "Users can insert their own profile" 
    ON profiles FOR INSERT 
    WITH CHECK (auth.uid() = id);
    
    RAISE NOTICE 'Created policy "Users can insert their own profile"';
  ELSE
    RAISE NOTICE 'Policy "Users can insert their own profile" already exists';
  END IF;
END $$;