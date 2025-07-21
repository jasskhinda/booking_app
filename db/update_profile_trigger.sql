-- Update the handle_new_user function to include phone_number and address fields
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
  first_name_val TEXT;
  last_name_val TEXT;
  phone_number_val TEXT;
  address_val TEXT;
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
    phone_number_val := NEW.raw_user_meta_data->>'phone_number';
    address_val := NEW.raw_user_meta_data->>'address';
    
    -- Fallback: if we have a full_name but no first/last name (for backward compatibility)
    IF first_name_val IS NULL AND NEW.raw_user_meta_data->>'full_name' IS NOT NULL THEN
      first_name_val := SPLIT_PART(NEW.raw_user_meta_data->>'full_name', ' ', 1);
      last_name_val := SUBSTRING(NEW.raw_user_meta_data->>'full_name' FROM POSITION(' ' IN NEW.raw_user_meta_data->>'full_name') + 1);
    END IF;
  END IF;
  
  INSERT INTO public.profiles (id, first_name, last_name, phone_number, address, role)
  VALUES (
    NEW.id, 
    first_name_val,
    last_name_val,
    phone_number_val,
    address_val,
    COALESCE(NEW.raw_user_meta_data->>'role', 'client') -- Use role from metadata or default to 'client'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;