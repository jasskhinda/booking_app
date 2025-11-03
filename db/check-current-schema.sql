-- Check current database schema for trips and profiles tables
-- Run this in Supabase SQL Editor to see what columns actually exist

-- 1. Check if trips table exists and show all columns
SELECT
    table_name,
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'trips'
ORDER BY ordinal_position;

-- 2. Check if profiles table exists and show all columns
SELECT
    table_name,
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- 3. List all tables in the public schema
SELECT
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 4. Check for any client-related tables
SELECT
    table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND (table_name LIKE '%client%' OR table_name LIKE '%trip%' OR table_name LIKE '%booking%')
ORDER BY table_name;

-- 5. Show table constraints (primary keys, foreign keys, etc.)
SELECT
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name IN ('trips', 'profiles')
ORDER BY tc.table_name, tc.constraint_type;
