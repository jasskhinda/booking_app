-- Verify pricing breakdown columns exist
-- Run this AFTER running add_pricing_breakdown_columns.sql

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'trips'
  AND column_name IN ('pricing_breakdown_data', 'pricing_breakdown_total', 'pricing_breakdown_locked_at')
ORDER BY column_name;

-- Expected result:
-- pricing_breakdown_data      | jsonb    | YES |
-- pricing_breakdown_locked_at | timestamptz | YES |
-- pricing_breakdown_total     | numeric  | YES |
