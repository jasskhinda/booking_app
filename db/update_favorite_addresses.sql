-- Add favorite_addresses JSONB column to the profiles table
ALTER TABLE profiles ADD COLUMN favorite_addresses JSONB DEFAULT '[]'::JSONB;

-- Update RLS policies to ensure users can only update their own favorite addresses
CREATE OR REPLACE POLICY "Users can update their own favorite addresses" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

-- Comment describing the structure of the favorite_addresses JSONB
COMMENT ON COLUMN profiles.favorite_addresses IS 
'Array of objects representing favorite addresses with structure:
[
  {
    "id": "uuid", -- Unique identifier for this address
    "name": "string", -- User-friendly name like "Home" or "Work"
    "address": "string", -- Full address text
    "type": "string" -- Type of address: "pickup" or "destination" or "both"
  }
]';