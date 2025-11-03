# CCT APPS - Planning & Architecture

## System Overview

Multi-application transportation management system with 7 apps sharing ONE Supabase database:
- **facility_app** - Healthcare facilities booking for managed clients
- **facility_mobile** - Mobile version of facility_app
- **booking_app** - Individual clients booking for themselves
- **booking_mobile** - Mobile version of booking_app
- **dispatcher_app** - Operations dashboard for trip dispatch and billing
- **admin_app** - Administrative interface
- **driver_app** - Driver interface for trip management

## Critical Architecture Points

### 🚨 ONE SHARED DATABASE
ALL apps connect to the same Supabase database. Changes affect ALL apps.

### Two Client Types, Two Tables

**Facility Clients** (facility_app/facility_mobile):
- Stored in: `facility_managed_clients` table
- Non-authenticated managed clients (residents, patients)
- Booked by facility staff on their behalf
- Has: weight, height_feet, height_inches, date_of_birth

**Individual Clients** (booking_app/booking_mobile):
- Stored in: `profiles` table (auth.users)
- Authenticated users booking for themselves
- Has: weight, height_feet, height_inches, date_of_birth

**Both Create Trips In**:
- `trips` table (shared)
- Also has: weight, height_feet, height_inches, date_of_birth
- Stores demographics at booking time for pricing/assignment

### Column Naming (MUST USE THESE)

**From facility_app** (already exist, DO NOT duplicate):
- `pickup_details` (NOT pickup_building_info)
- `destination_details` (NOT destination_building_info)
- `additional_passengers` (already exists)
- `special_requirements` (use for trip_notes)

**New columns added by booking_app**:
- `weight` (NUMERIC) - in profiles and trips
- `height_feet` (INTEGER) - in profiles and trips
- `height_inches` (INTEGER) - in profiles and trips
- `date_of_birth` (DATE) - in profiles and trips

## Pricing System

### Base Rates
- Standard: $50/leg (< 300 lbs)
- Bariatric: $150/leg (300-399 lbs)
- Cannot accommodate: 400+ lbs

### Distance Rates
- Franklin County: $3/mile
- Outside Franklin: $4/mile

### Dead Mileage Calculation
- Office: 597 Executive Campus Dr, Westerville, OH 43082
- One-way: Office→Pickup + Destination→Office
- Round-trip: Office→Pickup + Pickup→Office (reduced)

### Surcharges
- Multi-county: $50 (2+ counties)
- Weekend/after-hours: $40 (before 8am, after 6pm, weekends)
- Holiday: $100 (New Year, July 4, Christmas, Thanksgiving)
- Emergency: $40
- Wheelchair rental: $25

### Discounts
- Veteran: 20% off
- Regular individual: 10% off

## Weight Restrictions

### 300-399 lbs (Bariatric)
- Show orange warning
- Apply $150/leg rate instead of $50
- Booking allowed

### 400+ lbs (Over Limit)
- Show red error message
- Replace booking button with "Cannot Book - Contact Us"
- booking_app: mailto link
- booking_mobile: Alert with contact info
- Prevent booking

## Database Tables Reference

### `trips` (shared by all apps)
```
user_id, facility_id, managed_client_id
pickup_address, destination_address
pickup_details, destination_details
pickup_time, return_pickup_time
weight, height_feet, height_inches, date_of_birth
wheelchair_type, wheelchair_rental
is_round_trip, is_emergency
additional_passengers, special_requirements
price, distance, status
```

### `profiles` (individual booking_app clients)
```
id (auth.users)
first_name, last_name, full_name
phone_number, email
weight, height_feet, height_inches, date_of_birth
address, accessibility_needs, medical_requirements
emergency_contact, preferred_payment_method
stripe_customer_id, default_payment_method_id
role, facility_id
```

### `facility_managed_clients` (facility_app clients)
```
id, facility_id
full_name, phone, address
weight, height_feet, height_inches, date_of_birth
medical_notes, accessibility_needs
```

## Migration Strategy

### ALWAYS Use IF NOT EXISTS
```sql
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'trips' AND column_name = 'weight') THEN
        ALTER TABLE trips ADD COLUMN weight NUMERIC(5,1);
    END IF;
END $$;
```

### Before Any Migration
1. Check current schema with check-current-schema.sql
2. Verify column doesn't already exist
3. Use DO blocks with IF NOT EXISTS
4. Document what app added what column
5. Verify with verify-migrations.sql after running

## Branch Strategy

- **facility_app**: main branch
- **booking_app**: development branch
- **booking_mobile**: main branch
- **dispatcher_app**: main branch

## Tech Stack

- Next.js 15 (App Router) - Web apps
- React Native with Expo - Mobile apps
- Supabase (auth, database, real-time)
- Stripe (payment processing)
- Google Maps API (distance, autocomplete)
- Tailwind CSS (web styling)
- Playwright (testing)

## Key Files

### booking_app
- `/app/components/BookingForm.js` - Main booking form
- `/app/components/ProfileForm.js` - Profile settings
- `/lib/pricing.js` - Pricing calculation engine
- `/db/*.sql` - Database migrations

### booking_mobile
- `/src/screens/BookingScreen.js` - Booking screen
- `/src/screens/ProfileScreen.js` - Profile settings
- `/src/lib/enhancedPricing.js` - Pricing engine
- `/db/*.sql` - Database migrations

## Future Considerations

- When adding fields, check if facility_app already has them
- Always test both facility_app and booking_app after migrations
- Document all column additions in this file
- Keep column naming consistent across apps
- Consider impact on dispatcher_app and driver_app
