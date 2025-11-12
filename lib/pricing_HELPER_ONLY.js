/**
 * Format pricing breakdown for display with detailed calculation information
 * @param {Object} pricing - The pricing breakdown object
 * @param {Object} countyInfo - County information (isInFranklinCounty, countiesOut, etc.)
 * @param {Object} distanceInfo - Distance and duration information from Google Maps
 * @param {Number} deadMileageDistance - Dead mileage distance in miles
 */
export function createPricingBreakdown(pricing, countyInfo = null, distanceInfo = null, deadMileageDistance = 0) {
  const items = [];

  // Determine wheelchair type description for base fare
  const wheelchairDesc = pricing.isBariatric ? 'Bariatric rate' : '';
  
  // Base fare with detailed calculation
  const baseLabel = pricing.isBariatric
    ? `Base fare (${pricing.legs} leg${pricing.legs > 1 ? 's' : ''} @ $${pricing.baseRatePerLeg}/leg (${wheelchairDesc}))`
    : `Base fare (${pricing.legs} leg${pricing.legs > 1 ? 's' : ''} @ $${pricing.baseRatePerLeg}/leg)`;

  items.push({
    label: baseLabel,
    amount: pricing.basePrice,
    type: 'base'
  });

  // Trip distance with rate and county information
  if (pricing.tripDistancePrice > 0) {
    const legs = pricing.legs || 1;
    
    // Determine price per mile and county text
    const isInFranklinCounty = countyInfo?.isInFranklinCounty !== false;
    const pricePerMile = isInFranklinCounty ? 3 : 4;
    const countyText = isInFranklinCounty ? 'Franklin County' : 'Outside Franklin County';
    
    // Calculate miles from the price (reverse calculation)
    const tripDistanceMiles = pricing.tripDistancePrice > 0 && pricePerMile > 0 
      ? (pricing.tripDistancePrice / (pricePerMile * legs)).toFixed(1)
      : '0.0';
    
    const distanceLabel = `Distance charge ($${pricePerMile}/mile (${countyText}))`;
    
    items.push({
      label: distanceLabel,
      amount: pricing.tripDistancePrice,
      type: 'distance'
    });
  }

  // Dead mileage with detailed calculation
  if (pricing.deadMileagePrice > 0) {
    const deadMileageMiles = deadMileageDistance > 0 ? deadMileageDistance.toFixed(1) : '0.0';
    const deadMileageRate = 4; // $4/mile for dead mileage
    
    const deadMileageLabel = deadMileageDistance > 0
      ? `Dead mileage (${deadMileageMiles} mi @ $${deadMileageRate}/mile)`
      : 'Dead mileage (office travel)';
    
    items.push({
      label: deadMileageLabel,
      amount: pricing.deadMileagePrice,
      type: 'distance'
    });
  }

  // County surcharge with county count
  if (pricing.countySurcharge > 0) {
    const countiesOut = countyInfo?.countiesOut || 0;
    const countyRate = 50; // $50 per county
    const countyLabel = countiesOut > 0 
      ? `County surcharge (${countiesOut} ${countiesOut === 1 ? 'county' : 'counties'} @ $${countyRate}/county)`
      : 'County surcharge (2+ counties)';
    
    items.push({
      label: countyLabel,
      amount: pricing.countySurcharge,
      type: 'surcharge'
    });
  }

  // Combined weekend and after-hours surcharge (if both apply)
  const combinedWeekendAfterHours = pricing.weekendSurcharge > 0 && pricing.afterHoursSurcharge > 0;
  
  if (combinedWeekendAfterHours) {
    const combinedAmount = pricing.weekendSurcharge + pricing.afterHoursSurcharge;
    items.push({
      label: 'Weekend/After-hours surcharge',
      amount: combinedAmount,
      type: 'surcharge'
    });
  } else {
    // Individual surcharges
    if (pricing.weekendSurcharge > 0) {
      items.push({
        label: 'Weekend surcharge',
        amount: pricing.weekendSurcharge,
        type: 'surcharge'
      });
    }

    if (pricing.afterHoursSurcharge > 0) {
      items.push({
        label: 'After-hours surcharge',
        amount: pricing.afterHoursSurcharge,
        type: 'surcharge'
      });
    }
  }

  if (pricing.emergencySurcharge > 0) {
    items.push({
      label: 'Emergency surcharge',
      amount: pricing.emergencySurcharge,
      type: 'surcharge'
    });
  }

  if (pricing.holidaySurcharge > 0) {
    items.push({
      label: 'Holiday surcharge',
      amount: pricing.holidaySurcharge,
      type: 'surcharge'
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
