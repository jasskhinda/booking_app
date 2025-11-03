# CCT APPS - Database Architecture Explained

## 🏗️ Two Types of Users, Same Database

### facility_app (Healthcare Facilities)
**Who**: Healthcare facilities booking trips for their residents/patients
**Client Storage**: `facility_managed_clients` table
```
┌─────────────────────────────┐
│  facility_managed_clients   │
├─────────────────────────────┤
│ id                          │
│ facility_id                 │
│ full_name                   │
│ phone                       │
│ weight          ✅          │
│ height_feet     ✅          │
│ height_inches   ✅          │
│ date_of_birth   ✅          │
│ medical_notes               │
│ accessibility_needs         │
└─────────────────────────────┘
```

### booking_app (Individual Clients)
**Who**: Regular people booking trips for themselves
**Client Storage**: `profiles` table (auth users)
```
┌─────────────────────────────┐
│         profiles            │
├─────────────────────────────┤
│ id (auth.users)             │
│ first_name                  │
│ last_name                   │
│ phone_number                │
│ weight          ✅ exists   │
│ height_feet     🆕 need     │
│ height_inches   🆕 need     │
│ date_of_birth   🆕 need     │
│ medical_requirements        │
│ accessibility_needs         │
└─────────────────────────────┘
```

## 🚗 Both Create Trips in Same Table

```
┌─────────────────────────────┐
│           trips             │
├─────────────────────────────┤
│ id                          │
│ user_id (auth.users)        │
│ facility_id (nullable)      │
│ managed_client_id           │
│ pickup_address              │
│ destination_address         │
│ pickup_details   ✅ exists  │
│ destination_details ✅      │
│ weight           🆕 need    │
│ height_feet      🆕 need    │
│ height_inches    🆕 need    │
│ date_of_birth    🆕 need    │
│ additional_passengers ✅    │
│ special_requirements ✅     │
│ price                       │
│ status                      │
└─────────────────────────────┘
```

## 📊 Data Flow

### facility_app Booking Flow:
```
1. Facility admin logs in (profiles table, role='facility')
2. Selects a managed client (facility_managed_clients table)
3. Creates trip with client's weight/height/DOB from facility_managed_clients
4. Saves to trips table with managed_client_id
```

### booking_app Booking Flow:
```
1. Individual client logs in (profiles table, role='client')
2. System loads weight/height/DOB from their profiles record
3. Creates trip with client's weight/height/DOB from profiles
4. Saves to trips table with user_id
```

## 🎯 Why We Need These Columns in Both Places

### In `profiles` table:
- Stores individual client's personal information
- booking_app reads from here to pre-fill booking form
- One profile per authenticated user

### In `facility_managed_clients` table:
- Stores facility's managed client information
- facility_app reads from here to pre-fill booking form
- Multiple clients per facility

### In `trips` table:
- Stores the demographics at the time of booking
- Used for pricing calculations (bariatric rates)
- Used for driver/vehicle assignment
- Historical record (even if profile changes later)
- Both apps write to here when creating trips

## 🔧 What We Need to Add

### Step 1: Add to `profiles` table (for booking_app users)
```sql
-- Already exists: weight
-- Need to add:
- height_feet (INTEGER)
- height_inches (INTEGER)
- date_of_birth (DATE)
```

### Step 2: Add to `trips` table (for both apps)
```sql
-- Need to add:
- weight (NUMERIC)
- height_feet (INTEGER)
- height_inches (INTEGER)
- date_of_birth (DATE)
```

## ✅ Columns That Already Exist

### In `trips` table (from facility_app):
- `pickup_details` - use this instead of pickup_building_info
- `destination_details` - use this instead of destination_building_info
- `additional_passengers` - already exists
- `special_requirements` - use for trip notes

## 🚫 Common Mistakes to Avoid

1. ❌ Don't add `weight` to `profiles` - it already exists
2. ❌ Don't create new columns when facility_app columns exist
3. ❌ Don't assume facility_managed_clients and profiles are the same
4. ✅ Always use `IF NOT EXISTS` checks
5. ✅ Test with both facility_app and booking_app after migrations

## 📋 Migration Checklist

- [ ] Run: add-client-demographics-to-profiles.sql (adds to profiles)
- [ ] Run: add-booking-fields-to-trips.sql (adds to trips)
- [ ] Verify: Both facility_app and booking_app can still create trips
- [ ] Verify: No duplicate columns were created
- [ ] Test: Create booking from booking_app
- [ ] Test: Create booking from facility_app

## 🔍 How to Verify After Migration

```sql
-- Check profiles has the new columns
SELECT column_name FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name IN ('weight', 'height_feet', 'height_inches', 'date_of_birth');

-- Check trips has the new columns
SELECT column_name FROM information_schema.columns
WHERE table_name = 'trips'
  AND column_name IN ('weight', 'height_feet', 'height_inches', 'date_of_birth');

-- Check facility_managed_clients still has its columns
SELECT column_name FROM information_schema.columns
WHERE table_name = 'facility_managed_clients'
  AND column_name IN ('weight', 'height_feet', 'height_inches', 'date_of_birth');
```

All three queries should return 4 rows each!
