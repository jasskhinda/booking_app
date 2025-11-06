# Web App - Pricing Display Detailed Breakdown Update

**Date:** November 6, 2025  
**Status:** ✅ Complete

## Overview

Updated the web app's pricing display to show detailed, itemized pricing information with full calculation details in each line item label, matching the mobile app implementation.

## Files Modified

### 1. `/lib/pricing.js`
**Function Updated:** `createPricingBreakdown()`

#### Changes:
- Updated function signature to accept additional parameters:
  ```javascript
  createPricingBreakdown(pricing, countyInfo = null, distanceInfo = null, deadMileageDistance = 0)
  ```

- **Base Fare:** Shows leg count, rate per leg, and wheelchair type
  - Example: `Base fare (1 leg @ $150/leg (Bariatric rate))`
  - Example: `Base fare (2 legs @ $50/leg)`

- **Distance Charge:** Shows rate per mile and county information
  - Example: `Distance charge ($3/mile (Franklin County))`
  - Example: `Distance charge ($4/mile (Outside Franklin County))`

- **Dead Mileage:** Shows miles and rate
  - Example: `Dead mileage (63.2 mi @ $4/mile)`

- **County Surcharge:** Shows number of counties and rate
  - Example: `County surcharge (2 counties @ $50/county)`

- **Combined Weekend/After-hours:** Merges both surcharges if applicable
  - Example: `Weekend/After-hours surcharge` ($80.00 total)

### 2. `/app/components/PricingDisplay.js`
**Component Updated:** `PricingDisplay`

#### Changes:
- Added `pricingResult` state to store complete pricing result:
  ```javascript
  const [pricingResult, setPricingResult] = useState(null);
  ```

- Updated `calculatePricing()` to store full result:
  ```javascript
  if (result.success) {
    setPricing(result);
    setPricingResult(result); // Store complete result
    // ...
  }
  ```

- Updated `createPricingBreakdown()` call to pass additional data:
  ```javascript
  createPricingBreakdown(
    pricing.pricing,
    pricingResult?.countyInfo,
    pricingResult?.distanceInfo,
    pricingResult?.deadMileageDistance
  )
  ```

## Detailed Label Examples

### Standard Trip (Inside Franklin County)
```
Base fare (1 leg @ $50/leg)                            $50.00
Distance charge ($3/mile (Franklin County))            $182.72
Dead mileage (63.2 mi @ $4/mile)                       $252.96
                                                     ─────────
Total                                                  $485.68
```

### Bariatric Trip with Surcharges
```
Base fare (1 leg @ $150/leg (Bariatric rate))          $150.00
Distance charge ($3/mile (Franklin County))            $182.72
County surcharge (2 counties @ $50/county)             $100.00
Dead mileage (63.2 mi @ $4/mile)                       $252.96
Weekend/After-hours surcharge                          $80.00
                                                     ─────────
Total                                                  $765.68
```

### Round Trip
```
Base fare (2 legs @ $50/leg)                           $100.00
Distance charge ($3/mile (Franklin County))            $182.72
Dead mileage (63.2 mi @ $4/mile)                       $252.96
                                                     ─────────
Total                                                  $535.68
```

## Technical Details

### Data Flow

1. **Pricing Calculation:**
   ```javascript
   const result = await getPricingEstimate({ ... });
   // Returns:
   // {
   //   pricing: { ... },
   //   countyInfo: { isInFranklinCounty, countiesOut, ... },
   //   distanceInfo: { miles, duration, ... },
   //   deadMileageDistance: 63.2
   // }
   ```

2. **State Management:**
   ```javascript
   setPricingResult(result); // Complete result
   setPricing(result);       // For backward compatibility
   ```

3. **Breakdown Generation:**
   ```javascript
   createPricingBreakdown(
     pricing.pricing,          // Base pricing breakdown
     pricingResult?.countyInfo, // County details
     pricingResult?.distanceInfo, // Distance/duration
     pricingResult?.deadMileageDistance // Dead mileage miles
   )
   ```

### Smart Calculations

#### Distance Charge
```javascript
const isInFranklinCounty = countyInfo?.isInFranklinCounty !== false;
const pricePerMile = isInFranklinCounty ? 3 : 4;
const countyText = isInFranklinCounty ? 'Franklin County' : 'Outside Franklin County';
const distanceLabel = `Distance charge ($${pricePerMile}/mile (${countyText}))`;
```

#### Dead Mileage
```javascript
const deadMileageMiles = deadMileageDistance > 0 ? deadMileageDistance.toFixed(1) : '0.0';
const deadMileageLabel = deadMileageDistance > 0
  ? `Dead mileage (${deadMileageMiles} mi @ $4/mile)`
  : 'Dead mileage (office travel)';
```

#### County Surcharge
```javascript
const countiesOut = countyInfo?.countiesOut || 0;
const countyLabel = countiesOut > 0 
  ? `County surcharge (${countiesOut} ${countiesOut === 1 ? 'county' : 'counties'} @ $50/county)`
  : 'County surcharge (2+ counties)';
```

#### Combined Surcharges
```javascript
const combinedWeekendAfterHours = pricing.weekendSurcharge > 0 && pricing.afterHoursSurcharge > 0;

if (combinedWeekendAfterHours) {
  const combinedAmount = pricing.weekendSurcharge + pricing.afterHoursSurcharge;
  items.push({
    label: 'Weekend/After-hours surcharge',
    amount: combinedAmount,
    type: 'surcharge'
  });
}
```

## Pricing Rates

- **Base Fare (Regular):** $50/leg
- **Base Fare (Bariatric):** $150/leg (300+ lbs)
- **Distance (Franklin County):** $3/mile
- **Distance (Outside Franklin):** $4/mile
- **Dead Mileage:** $4/mile
- **County Surcharge:** $50/county (2+ counties)
- **Weekend Surcharge:** $40
- **After-hours Surcharge:** $40
- **Emergency Surcharge:** $40
- **Holiday Surcharge:** $100
- **Veteran Discount:** 20%

## Display Features

1. **Collapsible Breakdown:** Details hidden behind "View price breakdown"
2. **Summary Card:** Shows trip type, distance, duration, and total
3. **Color Coding:**
   - Base/Distance: Default gray
   - Surcharges: Orange
   - Discounts: Green
   - Total: Bold black
4. **Estimated Distance Warning:** Shows when distance is estimated
5. **Pricing Notes:** Contextual information about premiums and discounts

## Testing Checklist

- [ ] Standard trip inside Franklin County
- [ ] Trip outside Franklin County (higher rate)
- [ ] Bariatric trip (higher base fare)
- [ ] Round trip (2 legs)
- [ ] Trip with county surcharge (2+ counties)
- [ ] Weekend trip
- [ ] After-hours trip
- [ ] Weekend + After-hours (combined label)
- [ ] Emergency trip
- [ ] Veteran discount applied

## Next Steps

1. Test on booking page with various scenarios
2. Verify all calculations match expected values
3. Check responsive display on different screen sizes
4. Validate with real addresses and pricing data

## Consistency with Mobile App

This implementation matches the mobile app's detailed breakdown format:
- Same label formats
- Same calculation logic
- Same smart features (combined surcharges, county detection, etc.)
- Same rate displays ($X/mile, $X/leg, etc.)

## Files Changed

```
booking_app/
├── lib/
│   └── pricing.js (updated createPricingBreakdown function)
└── app/
    └── components/
        └── PricingDisplay.js (updated state and props)
```

---

**Implementation Status:** ✅ Complete  
**Tested:** Pending user verification  
**Documentation:** Complete
