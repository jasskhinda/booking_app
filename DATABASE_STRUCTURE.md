# CCT APPS - Shared Database Structure

## 🚨 CRITICAL: All Apps Share ONE Supabase Database

**ALL** applications connect to the **SAME** Supabase database:
- facility_app
- facility_mobile
- booking_app
- booking_mobile
- dispatcher_app
- admin_app
- driver_app

## Core Tables

### 1. `trips` Table (Shared by ALL apps)

**Original columns** (from base schema.sql):
```sql
- id (UUID, PRIMARY KEY)
- user_id (UUID, REFERENCES auth.users)
- pickup_address (TEXT)
- destination_address (TEXT)
- pickup_time (TIMESTAMPTZ)
- status (TEXT) - 'pending', 'upcoming', 'completed', 'cancelled', 'in_progress'
- driver_name (TEXT)
- vehicle (TEXT)
- price (DECIMAL)
- rating (INTEGER)
- feedback (TEXT)
- cancellation_reason (TEXT)
- refund_status (TEXT)
- special_requirements (TEXT)
- wheelchair_type (TEXT)
- is_round_trip (BOOLEAN)
- distance (DECIMAL)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

**Added by facility_app** (facility_schema.sql):
```sql
- facility_id (UUID, REFERENCES facilities)
```

**Added by facility_app** (add_missing_trip_columns.sql):
```sql
- additional_passengers (INTEGER) ✅ Already exists
- trip_notes (TEXT)
- pickup_details (TEXT) ✅ Already exists - use this instead of pickup_building_info
- destination_details (TEXT) ✅ Already exists - use this instead of destination_building_info
- booked_by (UUID)
- bill_to (TEXT) - 'facility' or 'client'
- managed_client_id (UUID)
- route_duration (TEXT)
- route_distance_text (TEXT)
- route_duration_text (TEXT)
- related_trip_id (UUID)
```

**NEW columns we're adding** (booking_app/booking_mobile):
```sql
- weight (NUMERIC(5,1)) - NEW ✅
- height_feet (INTEGER) - NEW ✅
- height_inches (INTEGER) - NEW ✅
- date_of_birth (DATE) - NEW ✅
```

### 2. `profiles` Table (Shared by ALL apps)

**Original columns** (from base schema.sql):
```sql
- id (UUID, PRIMARY KEY, REFERENCES auth.users)
- first_name (TEXT)
- last_name (TEXT)
- full_name (TEXT, GENERATED)
- avatar_url (TEXT)
- phone_number (TEXT)
- address (TEXT)
- accessibility_needs (TEXT)
- medical_requirements (TEXT)
- emergency_contact (TEXT)
- preferred_payment_method (TEXT)
- stripe_customer_id (TEXT)
- default_payment_method_id (TEXT)
- role (TEXT) - 'client', 'dispatcher', 'admin', 'facility'
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

**Added by facility_app** (facility_schema.sql):
```sql
- facility_id (UUID, REFERENCES facilities)
```

**NEW column we're adding** (booking_app/booking_mobile):
```sql
- weight (NUMERIC) - NEW ✅
```

### 3. `facilities` Table (Added by facility_app)

```sql
- id (UUID, PRIMARY KEY)
- name (TEXT)
- address (TEXT)
- phone_number (TEXT)
- contact_email (TEXT)
- billing_email (TEXT)
- payment_method_id (TEXT)
- stripe_customer_id (TEXT)
- facility_type (TEXT)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

### 4. `facility_managed_clients` Table (facility_app only)

```sql
- id (UUID, PRIMARY KEY)
- facility_id (UUID, REFERENCES facilities)
- full_name (TEXT)
- phone (TEXT)
- address (TEXT)
- medical_notes (TEXT)
- accessibility_needs (TEXT)
- weight (NUMERIC) - For bariatric calculations
- height_feet (INTEGER)
- height_inches (INTEGER)
- date_of_birth (DATE)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

## Migration Strategy

### ✅ SAFE Approach (What We're Doing):

1. **Check if column exists** before adding:
```sql
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'trips' AND column_name = 'weight') THEN
        ALTER TABLE trips ADD COLUMN weight NUMERIC(5,1);
    END IF;
END $$;
```

2. **Use existing facility_app columns** instead of creating new ones:
   - `pickup_details` (NOT pickup_building_info)
   - `destination_details` (NOT destination_building_info)
   - `additional_passengers` (already exists)

### ❌ DANGEROUS Approach (What We Avoided):

```sql
-- This would fail if column already exists!
ALTER TABLE trips ADD COLUMN additional_passengers INTEGER;
```

## Column Mapping for booking_app

When saving to database, use these mappings:

| booking_app field          | Database column name    | Notes                    |
|---------------------------|-------------------------|--------------------------|
| pickupBuildingInfo        | pickup_details          | facility_app column      |
| destinationBuildingInfo   | destination_details     | facility_app column      |
| tripNotes                 | special_requirements    | Original schema column   |
| additionalPassengers      | additional_passengers   | facility_app column      |
| weight                    | weight                  | NEW - add via migration  |
| heightFeet                | height_feet             | NEW - add via migration  |
| heightInches              | height_inches           | NEW - add via migration  |
| dateOfBirth               | date_of_birth           | NEW - add via migration  |

## How to Verify Current Schema

Run this SQL in Supabase SQL Editor:

```sql
-- Check trips table columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'trips'
ORDER BY ordinal_position;

-- Check profiles table columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- List all tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

## Migration Order

1. ✅ Run profiles migration (adds weight column)
2. ✅ Run trips migration (adds weight, height_feet, height_inches, date_of_birth)
3. ✅ Verify no duplicate columns were created
4. ✅ Test booking from each app

## Key Takeaways

1. 🔴 **ONE database for ALL apps** - changes affect everyone
2. 🟢 **Always check IF NOT EXISTS** before adding columns
3. 🟡 **Reuse existing columns** from facility_app when possible
4. 🔵 **Document all migrations** to avoid conflicts
