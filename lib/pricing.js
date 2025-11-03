/**
 * Compassionate Rides Pricing Calculator
 * Implements the full pricing model with distance calculation, premiums, and discounts
 */

/**
 * Professional Pricing Constants - Updated to match Dispatcher App
 */
export const PRICING_CONFIG = {
  BASE_RATES: {
    STANDARD: 50,     // $50 per leg (under 300 lbs)
    BARIATRIC: 150,   // $150 per leg (300+ lbs)
  },
  WEIGHT: {
    BARIATRIC_THRESHOLD: 300, // 300+ lbs = bariatric
  },
  DISTANCE: {
    FRANKLIN_COUNTY: 3.00,    // $3 per mile inside Franklin County
    OUTSIDE_FRANKLIN: 4.00,   // $4 per mile outside Franklin County
  },
  OFFICE_LOCATION: '597 Executive Campus Dr, Westerville, OH 43082, USA',
  PREMIUMS: {
    WEEKEND_AFTER_HOURS: 40,  // Before 8am or after 6pm, weekends
    EMERGENCY: 40,            // Emergency trip fee
    WHEELCHAIR_RENTAL: 25,    // Wheelchair rental fee (only if we provide)
    MULTI_COUNTY: 50,         // $50 if trip crosses 2+ counties
    HOLIDAY: 100,             // $100 for holidays
  },
  DISCOUNTS: {
    VETERAN: 0.20  // 20% veteran discount
  },
  HOURS: {
    AFTER_HOURS_START: 18,  // 6pm (18:00)
    AFTER_HOURS_END: 8      // 8am (08:00)
  },
  HOLIDAYS: [
    '01-01', // New Year's Day
    '07-04', // Independence Day
    '12-25', // Christmas
    '11-28', // Thanksgiving (approximate - 4th Thursday of November)
  ],
};

/**
 * Calculate distance between two addresses using Google Maps Distance Matrix API
 * Falls back to estimated distance if Google Maps is not available
 */
export async function calculateDistance(pickup, destination) {
  try {
    if (!window.google || !window.google.maps) {
      // Fallback: estimate distance based on address strings
      console.warn('Google Maps API not available, using estimated distance');
      return estimateDistanceFallback(pickup, destination);
    }

    return new Promise((resolve, reject) => {
      const service = new window.google.maps.DistanceMatrixService();
      
      service.getDistanceMatrix({
        origins: [pickup],
        destinations: [destination],
        travelMode: window.google.maps.TravelMode.DRIVING,
        unitSystem: window.google.maps.UnitSystem.IMPERIAL,
        avoidHighways: false,
        avoidTolls: false
      }, (response, status) => {
        if (status === 'OK' && response.rows[0].elements[0].status === 'OK') {
          const element = response.rows[0].elements[0];
          const distanceInMiles = element.distance.value * 0.000621371; // Convert meters to miles
          const duration = element.duration.text;
          
          resolve({
            distance: Math.round(distanceInMiles * 100) / 100, // Round to 2 decimal places
            duration,
            distanceText: element.distance.text,
            isEstimated: false
          });
        } else {
          // Fall back to estimation
          resolve(estimateDistanceFallback(pickup, destination));
        }
      });
    });
  } catch (error) {
    console.error('Distance calculation error:', error);
    // Fall back to estimation
    return estimateDistanceFallback(pickup, destination);
  }
}

/**
 * Fallback distance estimation when Google Maps API is not available
 */
function estimateDistanceFallback(pickup, destination) {
  // Simple estimation based on address complexity and typical local distances
  const estimatedDistance = Math.max(5, Math.min(25, Math.random() * 15 + 5));
  
  return {
    distance: Math.round(estimatedDistance * 100) / 100,
    duration: `${Math.round(estimatedDistance * 2.5)} mins`, // Rough estimate
    distanceText: `~${estimatedDistance.toFixed(1)} mi`,
    isEstimated: true
  };
}

/**
 * Check if given time is during after-hours (before 8am or after 6pm)
 */
export function isAfterHours(dateTime) {
  const hour = new Date(dateTime).getHours();
  return hour < PRICING_CONFIG.HOURS.AFTER_HOURS_END || hour >= PRICING_CONFIG.HOURS.AFTER_HOURS_START;
}

/**
 * Determine if addresses are in Franklin County using Google Geocoding API
 */
export async function checkFranklinCountyStatus(pickupAddress, destinationAddress) {
  try {
    if (!window.google || !window.google.maps) {
      // Default to Franklin County if Google Maps not available
      console.warn('Google Maps API not available, defaulting to Franklin County rates');
      return {
        isInFranklinCounty: true,
        countiesOut: 0,
        pickup: 'Franklin',
        destination: 'Franklin'
      };
    }

    const geocoder = new window.google.maps.Geocoder();
    
    const [pickupResult, destinationResult] = await Promise.all([
      new Promise((resolve) => {
        geocoder.geocode({ address: pickupAddress }, (results, status) => {
          if (status === 'OK' && results[0]) {
            resolve(results[0]);
          } else {
            resolve(null);
          }
        });
      }),
      new Promise((resolve) => {
        geocoder.geocode({ address: destinationAddress }, (results, status) => {
          if (status === 'OK' && results[0]) {
            resolve(results[0]);
          } else {
            resolve(null);
          }
        });
      })
    ]);
    
    // Extract county from geocoding results
    const getCountyFromComponents = (addressComponents) => {
      // Look for administrative_area_level_2 which is typically the county
      for (let component of addressComponents) {
        if (component.types.includes('administrative_area_level_2')) {
          return component.long_name;
        }
      }
      
      // Fallback: check if it's in Ohio and assume Franklin County for Columbus area
      const isOhio = addressComponents.some(comp => 
        comp.types.includes('administrative_area_level_1') && 
        comp.short_name === 'OH'
      );
      
      if (isOhio) {
        // Check if it's in Columbus metro area
        const cityComponent = addressComponents.find(comp => 
          comp.types.includes('locality')
        );
        
        if (cityComponent) {
          const city = cityComponent.long_name.toLowerCase();
          const franklinCountyCities = [
            'columbus', 'dublin', 'westerville', 'gahanna', 'reynoldsburg',
            'grove city', 'hilliard', 'upper arlington', 'bexley', 'whitehall',
            'worthington', 'grandview heights', 'canal winchester', 'groveport',
            'new albany', 'powell', 'sunbury', 'pickerington', 'pataskala',
            'blacklick', 'minerva park'
          ];
          
          if (franklinCountyCities.some(fcCity => city.includes(fcCity))) {
            return 'Franklin County';
          }
        }
      }
      
      return null;
    };
    
    const pickupCounty = pickupResult ? getCountyFromComponents(pickupResult.address_components) : null;
    const destinationCounty = destinationResult ? getCountyFromComponents(destinationResult.address_components) : null;
    
    console.log('County detection:', { pickupCounty, destinationCounty });
    
    const franklinCountyNames = ['Franklin', 'Franklin County'];
    const isPickupInFranklin = pickupCounty && franklinCountyNames.includes(pickupCounty);
    const isDestinationInFranklin = destinationCounty && franklinCountyNames.includes(destinationCounty);
    
    // Trip is "in Franklin County" if both pickup and destination are in Franklin County
    const isInFranklinCounty = isPickupInFranklin && isDestinationInFranklin;
    
    // Count unique counties (excluding Franklin if both ends are in Franklin)
    const uniqueCounties = new Set();
    if (pickupCounty && pickupCounty !== 'Franklin') uniqueCounties.add(pickupCounty);
    if (destinationCounty && destinationCounty !== 'Franklin') uniqueCounties.add(destinationCounty);
    
    return {
      isInFranklinCounty,
      countiesOut: uniqueCounties.size,
      pickup: pickupCounty || 'Unknown',
      destination: destinationCounty || 'Unknown'
    };
  } catch (error) {
    console.error('County detection error:', error);
    // Conservative: assume outside Franklin County when detection fails
    return {
      isInFranklinCounty: false,
      countiesOut: 1,
      pickup: 'Unknown',
      destination: 'Unknown'
    };
  }
}

/**
 * Check if given date is a weekend (Saturday or Sunday)
 */
export function isWeekend(dateTime) {
  const day = new Date(dateTime).getDay();
  return day === 0 || day === 6; // Sunday = 0, Saturday = 6
}

/**
 * Check if date is a holiday
 */
export function isHoliday(dateTime) {
  const date = new Date(dateTime);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateString = `${month}-${day}`;

  return PRICING_CONFIG.HOLIDAYS.includes(dateString);
}

/**
 * Calculate total trip price based on professional rate structure
 */
export function calculateTripPrice({
  isRoundTrip = false,
  tripDistance = 0,          // Actual trip distance (pickup to destination)
  deadMileageDistance = 0,    // Dead mileage (office to/from pickup/destination)
  pickupDateTime,
  wheelchairType = 'no_wheelchair',
  clientWeight = 250,         // Client weight for bariatric pricing
  isEmergency = false,
  isVeteran = false,          // Veteran discount flag
  countyInfo = null // { isInFranklinCounty: true, countiesOut: 0 }
}) {
  let breakdown = {
    basePrice: 0,
    baseRatePerLeg: 0,
    isBariatric: false,
    tripDistancePrice: 0,
    deadMileagePrice: 0,
    distancePrice: 0,
    multiCountyFee: 0,
    holidaySurcharge: 0,
    weekendAfterHoursSurcharge: 0,
    emergencyFee: 0,
    wheelchairPrice: 0,
    veteranDiscount: 0,
    total: 0,
    legs: isRoundTrip ? 2 : 1
  };

  // Determine if bariatric (300+ lbs)
  breakdown.isBariatric = clientWeight >= PRICING_CONFIG.WEIGHT.BARIATRIC_THRESHOLD;
  breakdown.baseRatePerLeg = breakdown.isBariatric
    ? PRICING_CONFIG.BASE_RATES.BARIATRIC
    : PRICING_CONFIG.BASE_RATES.STANDARD;
  breakdown.basePrice = breakdown.baseRatePerLeg * breakdown.legs;

  // Determine price per mile
  const isInFranklinCounty = countyInfo?.isInFranklinCounty === true;
  const pricePerMile = isInFranklinCounty
    ? PRICING_CONFIG.DISTANCE.FRANKLIN_COUNTY
    : PRICING_CONFIG.DISTANCE.OUTSIDE_FRANKLIN;

  // Calculate trip distance price
  if (tripDistance > 0) {
    breakdown.tripDistancePrice = tripDistance * pricePerMile * breakdown.legs;
  }

  // Calculate dead mileage price
  if (deadMileageDistance > 0) {
    breakdown.deadMileagePrice = deadMileageDistance * pricePerMile;
  }

  // Total distance price
  breakdown.distancePrice = breakdown.tripDistancePrice + breakdown.deadMileagePrice;

  // Multi-county surcharge
  const countyCount = countyInfo?.countiesOut || 0;
  if (countyCount >= 2 || (countyInfo && !countyInfo.isInFranklinCounty)) {
    breakdown.multiCountyFee = PRICING_CONFIG.PREMIUMS.MULTI_COUNTY;
  }

  // Holiday surcharge
  if (pickupDateTime && isHoliday(pickupDateTime)) {
    breakdown.holidaySurcharge = PRICING_CONFIG.PREMIUMS.HOLIDAY;
  }

  // Weekend/After-hours premium
  if (pickupDateTime) {
    const isAfterHoursTime = isAfterHours(pickupDateTime);
    const isWeekendTime = isWeekend(pickupDateTime);

    if (isAfterHoursTime || isWeekendTime) {
      breakdown.weekendAfterHoursSurcharge = PRICING_CONFIG.PREMIUMS.WEEKEND_AFTER_HOURS;
    }
  }

  // Emergency fee
  if (isEmergency) {
    breakdown.emergencyFee = PRICING_CONFIG.PREMIUMS.EMERGENCY;
  }

  // Wheelchair rental fee (only when CCT provides wheelchair)
  if (wheelchairType === 'provided') {
    breakdown.wheelchairPrice = PRICING_CONFIG.PREMIUMS.WHEELCHAIR_RENTAL;
  }

  // Calculate subtotal before veteran discount
  const subtotal = breakdown.basePrice +
                   breakdown.distancePrice +
                   breakdown.multiCountyFee +
                   breakdown.holidaySurcharge +
                   breakdown.weekendAfterHoursSurcharge +
                   breakdown.emergencyFee +
                   breakdown.wheelchairPrice;

  // Apply veteran discount (20%)
  if (isVeteran) {
    breakdown.veteranDiscount = subtotal * PRICING_CONFIG.DISCOUNTS.VETERAN;
  }

  // Final total
  breakdown.total = subtotal - breakdown.veteranDiscount;

  // Round all monetary values to 2 decimal places
  Object.keys(breakdown).forEach(key => {
    if (typeof breakdown[key] === 'number') {
      breakdown[key] = Math.round(breakdown[key] * 100) / 100;
    }
  });

  return breakdown;
}

/**
 * Format currency for display
 */
export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

/**
 * Calculate dead mileage (office to/from locations)
 */
export async function calculateDeadMileage(pickupAddress, destinationAddress, isRoundTrip) {
  try {
    if (isRoundTrip) {
      // Round trip: Only office→pickup and back
      const officeToPickup = await calculateDistance(PRICING_CONFIG.OFFICE_LOCATION, pickupAddress);
      return officeToPickup.distance * 2; // Office→Pickup + Pickup→Office
    } else {
      // One-way: Office→Pickup + Destination→Office
      const [officeToPickup, destinationToOffice] = await Promise.all([
        calculateDistance(PRICING_CONFIG.OFFICE_LOCATION, pickupAddress),
        calculateDistance(destinationAddress, PRICING_CONFIG.OFFICE_LOCATION)
      ]);
      return officeToPickup.distance + destinationToOffice.distance;
    }
  } catch (error) {
    console.error('Error calculating dead mileage:', error);
    return 0;
  }
}

/**
 * Get pricing estimate with full breakdown using professional rates
 */
export async function getPricingEstimate({
  pickupAddress,
  destinationAddress,
  isRoundTrip = false,
  pickupDateTime,
  wheelchairType = 'no_wheelchair',
  clientWeight = 250,
  isEmergency = false,
  isVeteran = false,
  preCalculatedDistance = null
}) {
  try {
    console.log('getPricingEstimate called with preCalculatedDistance:', preCalculatedDistance);

    // Use pre-calculated distance if provided, otherwise calculate it
    let tripDistance = 0;
    let distanceInfo = null;

    if (preCalculatedDistance) {
      // Handle different possible formats of the preCalculatedDistance object
      if (typeof preCalculatedDistance === 'number') {
        tripDistance = preCalculatedDistance;
      } else if (preCalculatedDistance.miles !== undefined) {
        tripDistance = preCalculatedDistance.miles;
      } else if (preCalculatedDistance.distance !== undefined) {
        tripDistance = typeof preCalculatedDistance.distance === 'number'
          ? preCalculatedDistance.distance
          : 0;
      }

      distanceInfo = {
        distance: tripDistance,
        duration: preCalculatedDistance.duration?.text || preCalculatedDistance.duration || 'Unknown',
        distanceText: preCalculatedDistance.text || preCalculatedDistance.distance?.text || `${tripDistance} mi`,
        isEstimated: false
      };
    } else if (pickupAddress && destinationAddress) {
      distanceInfo = await calculateDistance(pickupAddress, destinationAddress);
      tripDistance = distanceInfo.distance;
    }

    // Calculate dead mileage
    let deadMileageDistance = 0;
    if (pickupAddress && destinationAddress) {
      deadMileageDistance = await calculateDeadMileage(pickupAddress, destinationAddress, isRoundTrip);
    }

    // Get county information for pricing
    let countyInfo = null;
    if (pickupAddress && destinationAddress) {
      countyInfo = await checkFranklinCountyStatus(pickupAddress, destinationAddress);
    }

    // Calculate pricing with professional rate structure
    const pricing = calculateTripPrice({
      isRoundTrip,
      tripDistance,
      deadMileageDistance,
      pickupDateTime,
      wheelchairType,
      clientWeight,
      isEmergency,
      isVeteran,
      countyInfo
    });

    return {
      success: true,
      pricing,
      distance: distanceInfo,
      deadMileageDistance,
      countyInfo,
      summary: {
        tripType: isRoundTrip ? 'Round Trip' : 'One Way',
        distance: tripDistance > 0 ? `${tripDistance} miles` : 'Distance not calculated',
        deadMileage: `${deadMileageDistance.toFixed(1)} miles`,
        estimatedTotal: formatCurrency(pricing.total),
        hasDiscounts: pricing.veteranDiscount > 0,
        hasPremiums: (pricing.weekendAfterHoursSurcharge + pricing.emergencyFee + pricing.wheelchairPrice + pricing.multiCountyFee + pricing.holidaySurcharge) > 0,
        countyLocation: countyInfo ?
          `${countyInfo.isInFranklinCounty ? 'Franklin County' : 'Outside Franklin County'}` :
          'Location unknown'
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      pricing: null,
      distance: null
    };
  }
}

/**
 * Create a detailed pricing breakdown for display with professional rates
 */
export function createPricingBreakdown(pricing) {
  const items = [];

  // Base fare (legs)
  const baseLabel = pricing.isBariatric
    ? `Base fare (${pricing.legs} leg${pricing.legs > 1 ? 's' : ''} @ $${pricing.baseRatePerLeg}/leg - Bariatric)`
    : `Base fare (${pricing.legs} leg${pricing.legs > 1 ? 's' : ''} @ $${pricing.baseRatePerLeg}/leg)`;

  items.push({
    label: baseLabel,
    amount: pricing.basePrice,
    type: 'base'
  });

  // Trip distance charge
  if (pricing.tripDistancePrice > 0) {
    items.push({
      label: 'Trip distance charge',
      amount: pricing.tripDistancePrice,
      type: 'charge'
    });
  }

  // Dead mileage charge
  if (pricing.deadMileagePrice > 0) {
    items.push({
      label: 'Dead mileage (office to/from locations)',
      amount: pricing.deadMileagePrice,
      type: 'charge'
    });
  }

  // Multi-county surcharge
  if (pricing.multiCountyFee > 0) {
    items.push({
      label: 'Multi-county surcharge',
      amount: pricing.multiCountyFee,
      type: 'premium'
    });
  }

  // Holiday surcharge
  if (pricing.holidaySurcharge > 0) {
    items.push({
      label: 'Holiday surcharge',
      amount: pricing.holidaySurcharge,
      type: 'premium'
    });
  }

  // Weekend/After-hours premium
  if (pricing.weekendAfterHoursSurcharge > 0) {
    items.push({
      label: 'Weekend/After-hours surcharge',
      amount: pricing.weekendAfterHoursSurcharge,
      type: 'premium'
    });
  }

  // Emergency fee
  if (pricing.emergencyFee > 0) {
    items.push({
      label: 'Emergency fee',
      amount: pricing.emergencyFee,
      type: 'premium'
    });
  }

  // Wheelchair rental
  if (pricing.wheelchairPrice > 0) {
    items.push({
      label: 'Wheelchair rental fee',
      amount: pricing.wheelchairPrice,
      type: 'premium'
    });
  }

  // Veteran discount
  if (pricing.veteranDiscount > 0) {
    items.push({
      label: 'Veteran discount (20%)',
      amount: -pricing.veteranDiscount,
      type: 'discount'
    });
  }

  // Total
  items.push({
    label: 'Total',
    amount: pricing.total,
    type: 'total'
  });

  return items;
}
