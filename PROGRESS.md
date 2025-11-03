# CCT APPS - Progress Tracker

## Current Session Summary (2025-11-03)

### ✅ Completed Tasks

#### 1. Weight Field & Profile Integration
- **booking_mobile**:
  - ✅ Added weight field to ProfileScreen with bariatric indicator
  - ✅ Weight auto-populates from profile in BookingScreen
  - ✅ Shows tip when weight not set in profile
  - ✅ Committed to main branch

- **booking_app**:
  - ✅ Added weight field to ProfileForm with bariatric indicator
  - ✅ Committed to development branch

#### 2. Complete Pricing System Implementation
- ✅ Implemented all 7 test case requirements:
  - Test 1: Basic Franklin County ($123.98)
  - Test 2: One-Way 2+ Counties with Full Dead Mileage ($535.72)
  - Test 3: Round Trip with Reduced Dead Mileage ($625.36)
  - Test 4: Bariatric Rate ($825.36)
  - Test 5: Weekend Surcharge ($865.36)
  - Test 6: Ultimate Fee Stack ($905.36)
  - Test 7: Holiday Surcharge ($925.36)

- ✅ Features implemented:
  - Bariatric pricing: $150/leg for 300+ lbs (vs $50 standard)
  - Dead mileage calculation (office location: 597 Executive Campus Dr, Westerville, OH 43082)
  - Multi-county fee: $50 for 2+ counties
  - Holiday surcharge: $100
  - Weekend/after-hours: $40
  - Emergency fee: $40
  - Veteran discount: 20%

- ✅ Applied to BOTH booking_app and booking_mobile

#### 3. Comprehensive Booking Form Fields (booking_app)
Added all facility_app fields to booking_app BookingForm:
- ✅ Enhanced Client Information section (name, phone, medical notes, accessibility)
- ✅ Building/apartment fields (pickup_details, destination_details)
- ✅ Weight with bariatric indicator
- ✅ Height (feet + inches dropdowns)
- ✅ Date of Birth
- ✅ Email (from profile)
- ✅ Additional Passengers (0-4)
- ✅ Trip Notes
- ✅ "Why This Information Matters" info box

#### 4. 400 lbs Weight Restriction
- **booking_app**:
  - ✅ Shows red error "Cannot accommodate - Over 400 lbs"
  - ✅ Replaces booking button with "Cannot Book - Contact Us" mailto link
  - ✅ Committed to development branch

- **booking_mobile**:
  - ✅ Shows red error box
  - ✅ Replaces booking button with contact button showing alert
  - ✅ Committed to main branch

#### 5. CRITICAL Database Architecture Fix
- ✅ Discovered all apps share ONE Supabase database
- ✅ Identified facility_app already added columns we were duplicating
- ✅ Updated migrations to use IF NOT EXISTS checks
- ✅ Updated code to use facility_app column names:
  - `pickup_building_info` → `pickup_details`
  - `destination_building_info` → `destination_details`
- ✅ Documented separation of facility vs individual clients

#### 6. Database Migrations (COMPLETED)
- ✅ Added to `profiles` table:
  - weight (already existed)
  - height_feet ✅
  - height_inches ✅
  - date_of_birth ✅

- ✅ Added to `trips` table:
  - weight ✅
  - height_feet ✅
  - height_inches ✅
  - date_of_birth ✅

- ✅ Verified both tables showing 4 columns each

#### 7. Documentation Created
- ✅ PLANNING.md - Architecture and planning reference
- ✅ PROGRESS.md - This file
- ✅ DATABASE_ARCHITECTURE.md - Facility vs individual client separation
- ✅ DATABASE_STRUCTURE.md - Complete schema reference
- ✅ check-current-schema.sql - Schema verification queries
- ✅ verify-migrations.sql - Migration verification queries

### 📦 Git Commits Made

#### booking_app (development branch):
1. Complete pricing system implementation
2. Add comprehensive booking form fields matching facility_app
3. Add 400 lbs weight restriction
4. CRITICAL FIX: Use existing facility_app column names
5. Add database structure documentation
6. CRITICAL: Clarify facility vs individual client data separation

#### booking_mobile (main branch):
1. Fix calendar date selection timezone issue
2. Implement complete pricing system
3. Add weight field to profile with auto-population
4. Add 400 lbs weight restriction
5. Add database structure documentation

### 🎯 Current Status

**booking_app**: ✅ Ready for testing on development branch
**booking_mobile**: ✅ Ready for testing on main branch
**Database**: ✅ All migrations completed successfully

### 🔄 What's Running

Background processes detected (check with BashOutput if needed):
- f2ad27: npm start
- ce83e8: npm start
- f6ab75: npm start
- 705ad2: npm start -- --clear
- e4799b: npm start -- --clear

### 🧪 Testing Checklist

- [ ] booking_app: Add profile info (weight, height, DOB)
- [ ] booking_app: Create booking with weight < 300 lbs (standard rate)
- [ ] booking_app: Create booking with weight 350 lbs (bariatric warning)
- [ ] booking_app: Try weight 400+ lbs (should block and show contact button)
- [ ] booking_mobile: Add weight in profile
- [ ] booking_mobile: Check weight auto-populates in booking
- [ ] booking_mobile: Test same weight scenarios
- [ ] Verify facility_app still works (not broken by migrations)
- [ ] Verify dispatcher_app can see new fields

### 📊 Database Schema Changes

#### Before This Session:
```
profiles: weight (existed)
trips: pickup_details, destination_details, additional_passengers (from facility_app)
```

#### After This Session:
```
profiles: weight, height_feet, height_inches, date_of_birth ✅
trips: weight, height_feet, height_inches, date_of_birth ✅
```

### 🔑 Key Learnings

1. **ALL apps share ONE database** - must always check for existing columns
2. **Two client types, two tables**:
   - facility_managed_clients (facility_app)
   - profiles (booking_app)
   - Both create trips in same trips table
3. **Always use IF NOT EXISTS** when adding columns
4. **Reuse facility_app column names** instead of creating new ones
5. **Test both apps after database changes**

### 🚀 Next Steps (If Needed)

1. Test booking flow end-to-end in both apps
2. Verify pricing calculations match test cases
3. Check 400 lbs restriction works correctly
4. Ensure facility_app wasn't affected
5. Monitor for any errors in production

### 📝 Notes for Future Sessions

- Read PLANNING.md first to understand architecture
- Check DATABASE_ARCHITECTURE.md before any database changes
- Always verify current schema before adding columns
- Use verify-migrations.sql to confirm migrations
- Document all changes in this file

### ⚠️ Important Reminders

- booking_app uses **development** branch
- booking_mobile uses **main** branch
- facility_app columns take precedence (pickup_details, not pickup_building_info)
- Weight in profiles already existed, don't duplicate
- Run migrations in this order:
  1. Check schema first
  2. Add to profiles
  3. Add to trips
  4. Verify both
