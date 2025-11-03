-- Verify that all migrations were successful
-- Run this to check if columns were added correctly

-- 1. Check trips table has the new demographic columns
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'trips'
  AND column_name IN ('weight', 'height_feet', 'height_inches', 'date_of_birth',
                      'pickup_details', 'destination_details', 'additional_passengers')
ORDER BY column_name;

-- Expected result: 7 rows showing all these columns exist

-- 2. Check profiles table has the demographic columns
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name IN ('weight', 'height_feet', 'height_inches', 'date_of_birth')
ORDER BY column_name;

-- Expected result: 4 rows showing these columns exist

-- 3. Quick summary - should show counts
SELECT
    'trips' as table_name,
    COUNT(*) as new_columns_count
FROM information_schema.columns
WHERE table_name = 'trips'
  AND column_name IN ('weight', 'height_feet', 'height_inches', 'date_of_birth')
UNION ALL
SELECT
    'profiles' as table_name,
    COUNT(*) as new_columns_count
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name IN ('weight', 'height_feet', 'height_inches', 'date_of_birth');

-- Expected result:
-- trips: 4
-- profiles: 4
