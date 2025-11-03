'use client';

import { useState, useEffect, useRef, useCallback, Fragment } from 'react';
import { getSupabaseClient } from '@/lib/client-supabase';
import { useRouter } from 'next/navigation';
import DashboardLayout from './DashboardLayout';
import Script from 'next/script';

// Helper function to format date in AM/PM format
function formatTimeAmPm(dateStr) {
  if (!dateStr) return '';
  
  const date = new Date(dateStr);
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  
  console.log('formatTimeAmPm input:', dateStr, 'parsed date:', date, 'hours:', hours, 'minutes:', minutes);
  
  // Convert hours from 24-hour format to 12-hour format
  hours = hours % 12;
  hours = hours ? hours : 12; // "0" should be displayed as "12"
  
  // Format minutes to always have two digits
  const minutesStr = minutes.toString().padStart(2, '0');
  
  const result = `${hours}:${minutesStr} ${ampm}`;
  console.log('formatTimeAmPm result:', result);
  return result;
}

// Generate time slots for selection in 15-minute intervals
function generateTimeSlots() {
  const slots = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const h = hour % 12 || 12;
      const ampm = hour < 12 ? 'AM' : 'PM';
      const m = minute.toString().padStart(2, '0');
      slots.push({
        label: `${h}:${m} ${ampm}`,
        value: { hour, minute }
      });
    }
  }
  return slots;
}

// Helper to get the day name
function getDayName(date) {
  return new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
}

// Helper to format date as Month Day
function formatMonthDay(date) {
  return new Date(date).toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  });
}

// Helper to format date as MM/DD/YYYY
function formatDateUS(date) {
  return new Date(date).toLocaleDateString('en-US', { 
    month: '2-digit', 
    day: '2-digit', 
    year: 'numeric' 
  });
}

// Helper function to determine county from address using Google Maps Geocoding API
async function determineCounty(address) {
  if (!address || !window.google) {
    console.log('determineCounty: Missing address or Google API');
    return 'Unknown County';
  }

  try {
    // EMERGENCY FIX: Force Franklin County detection for known problem addresses
    const addressLower = address?.toLowerCase() || '';
    console.log('🚨 BOOKING APP COUNTY DETECTION EMERGENCY CHECK 🚨', { address: addressLower });
    
    // Known Franklin County address patterns (consistent with facility_app emergency fixes)
    const franklinCountyPatterns = [
      'westerville',
      'columbus', 
      'dublin',
      'gahanna',
      'reynoldsburg',
      'grove city',
      'hilliard',
      'upper arlington',
      'bexley',
      'whitehall',
      'worthington',
      'grandview heights',
      'canal winchester',    // Added from facility_app
      'groveport',          // Added from facility_app
      'new albany',         // Added from facility_app
      'powell',             // Added from facility_app
      'sunbury',            // Added from facility_app
      'pickerington',       // Added from facility_app
      'pataskala',          // Added from facility_app
      'blacklick',          // Added from facility_app
      'minerva park',       // Added from facility_app
      '43082',              // Westerville zip
      '43228',              // Columbus zip
      '43017',              // Dublin zip - Added
      '43016',              // Dublin zip - Added
      '43123',              // Grove City zip - Added
      '43026',              // Hilliard zip - Added
      '43081',              // Westerville zip - Added
      'executive campus dr', // FIX: Added missing pattern
      'franshire'           // FIX: Added missing pattern
    ];
    
    // Known Non-Franklin County patterns (for Lancaster, OH and similar exclusions)
    const nonFranklinCountyPatterns = [
      'lancaster, oh',
      'lancaster,oh', 
      'lancaster ohio',
      '43130',              // Lancaster, OH zip code
      'fairfield county',   // Lancaster is in Fairfield County
      'fairfield co'
    ];
    
    // Check for explicit non-Franklin patterns first (these override Franklin patterns)
    const isExplicitlyNonFranklin = nonFranklinCountyPatterns.some(pattern => addressLower.includes(pattern));
    
    if (isExplicitlyNonFranklin) {
      console.log('🚨 NON-FRANKLIN PATTERN DETECTED: Address explicitly detected as outside Franklin County');
      return 'Fairfield County'; // or whatever the actual county is
    }
    
    // Then check for Franklin County patterns
    const isAddressFranklin = franklinCountyPatterns.some(pattern => addressLower.includes(pattern));
    
    if (isAddressFranklin) {
      console.log('🚨 EMERGENCY FIX APPLIED: Address detected as Franklin County via pattern matching');
      return 'Franklin County';
    }

    const geocoder = new window.google.maps.Geocoder();
    
    return new Promise((resolve) => {
      geocoder.geocode({ address: address }, (results, status) => {
        console.log('determineCounty geocoding result:', { address, status, results });
        
        if (status === 'OK' && results[0]) {
          const addressComponents = results[0].address_components;
          console.log('Address components:', addressComponents);
          
          // Check if it's in Ohio first
          const isOhio = addressComponents.some(comp => 
            comp.types.includes('administrative_area_level_1') && 
            comp.short_name === 'OH'
          );
          
          if (isOhio) {
            // Check if it's in Columbus metro area (Franklin County cities)
            const cityComponent = addressComponents.find(comp => 
              comp.types.includes('locality') || comp.types.includes('sublocality')
            );
            
            if (cityComponent) {
              const city = cityComponent.long_name.toLowerCase();
              console.log('City detected:', city);
              
              const franklinCountyCities = [
                'columbus', 'dublin', 'westerville', 'gahanna', 'reynoldsburg',
                'grove city', 'hilliard', 'upper arlington', 'bexley', 'whitehall',
                'worthington', 'grandview heights', 'canal winchester', 'groveport',
                'new albany', 'powell', 'sunbury', 'pickerington', 'pataskala',
                'blacklick', 'minerva park'
              ];
              
              if (franklinCountyCities.some(fcCity => city.includes(fcCity))) {
                console.log('City matched Franklin County list, returning Franklin County');
                return resolve('Franklin County');
              }
            }
            
            // Also check for neighborhood components that might indicate Franklin County
            const neighborhoodComponent = addressComponents.find(comp =>
              comp.types.includes('neighborhood') || comp.types.includes('sublocality_level_1')
            );
            
            if (neighborhoodComponent) {
              const neighborhood = neighborhoodComponent.long_name.toLowerCase();
              console.log('Neighborhood detected:', neighborhood);
              if (neighborhood.includes('columbus') || neighborhood.includes('dublin') || 
                  neighborhood.includes('hilliard')) {
                console.log('Neighborhood matched Franklin County, returning Franklin County');
                return resolve('Franklin County');
              }
            }
          }
          
          // Look for administrative_area_level_2 which is typically the county
          for (let component of addressComponents) {
            if (component.types.includes('administrative_area_level_2')) {
              const countyName = component.long_name;
              console.log('County from geocoding:', countyName);
              return resolve(countyName);
            }
          }
          
          console.log('No county found, returning Unknown County');
          return resolve('Unknown County');
        } else {
          console.warn('Geocoding failed:', status);
          return resolve('Unknown County');
        }
      });
    });
  } catch (error) {
    console.error('Error determining county:', error);
    return 'Unknown County';
  }
}

export default function BookingForm({ user }) {
  const [formData, setFormData] = useState({
    pickupAddress: '',
    destinationAddress: '',
    pickupTime: '',
    returnPickupTime: '',
    wheelchairType: 'none',
    wheelchairRental: false,
    isRoundTrip: false,
    isEmergency: false,
    pickupBuildingInfo: '',
    destinationBuildingInfo: '',
    weight: '',
    heightFeet: '',
    heightInches: '',
    dateOfBirth: '',
    additionalPassengers: 0,
    tripNotes: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [bookingStatus, setBookingStatus] = useState('idle'); // idle, loading, submitting, success, error
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  
  // Date/time picker state
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isReturnDatePickerOpen, setIsReturnDatePickerOpen] = useState(false);
  const [currentView, setCurrentView] = useState('date'); // 'date' or 'time'
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedReturnDate, setSelectedReturnDate] = useState(null);
  const [availableTimeSlots, setAvailableTimeSlots] = useState(generateTimeSlots());
  const datePickerRef = useRef(null);
  const returnDatePickerRef = useRef(null);

  const router = useRouter();
  const supabase = getSupabaseClient();
  const [profileData, setProfileData] = useState(null);

  useEffect(() => {
    async function fetchProfile() {
      if (!user?.id) return;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (!error && data) {
        setProfileData(data);
      } else {
        setProfileData({}); // fallback to empty object to avoid undefined
      }
    }
    fetchProfile();
  }, [user, supabase]);

  // Format datetime default value
  useEffect(() => {
    // Set default pickup time to 1 hour from now, rounded to nearest 15 minutes
    const now = new Date();11
    now.setHours(now.getHours() + 1);
    now.setMinutes(Math.ceil(now.getMinutes() / 15) * 15);
    now.setSeconds(0);
    now.setMilliseconds(0);
    
    // Set default return pickup time to 3 hours from now (2 hours after initial pickup)
    const returnTime = new Date(now);
    returnTime.setHours(returnTime.getHours() + 2);
    
    const formattedDate = now.toISOString().slice(0, 16); // Format: YYYY-MM-DDThh:mm
    const formattedReturnDate = returnTime.toISOString().slice(0, 16); // Format: YYYY-MM-DDThh:mm
    
    setFormData(prev => ({ 
      ...prev, 
      pickupTime: formattedDate,
      returnPickupTime: formattedReturnDate
    }));
    
    setSelectedDate(now);
    setSelectedReturnDate(returnTime);
  }, []);
  
  const mapRef = useRef(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [directionsRenderer, setDirectionsRenderer] = useState(null);
  const [pickupLocation, setPickupLocation] = useState(null);
  const [destinationLocation, setDestinationLocation] = useState(null);
  const [estimatedFare, setEstimatedFare] = useState(null);
  const [estimatedDuration, setEstimatedDuration] = useState(null);
  const [distanceMiles, setDistanceMiles] = useState(0);
  const [distanceMeters, setDistanceMeters] = useState(0);
  const [pricingBreakdown, setPricingBreakdown] = useState(null);
  
  // Add ref to prevent multiple simultaneous route calculations
  const isCalculatingRouteRef = useRef(false);
  
  // Function to calculate route between two points and update the map
  const calculateRoute = useCallback((origin, destination) => {
    if (!origin || !destination || !mapInstance || !directionsRenderer) return;
    
    // Prevent multiple simultaneous calculations
    if (isCalculatingRouteRef.current) {
      console.log('Route calculation already in progress, skipping...');
      return;
    }
    
    isCalculatingRouteRef.current = true;
    setIsCalculatingRoute(true); // Set loading state
    console.log('Starting route calculation...');
    
    const directionsService = new window.google.maps.DirectionsService();
    
    directionsService.route({
      origin,
      destination,
      travelMode: window.google.maps.TravelMode.DRIVING,
    }, async (result, status) => {
      try {
        if (status === window.google.maps.DirectionsStatus.OK) {
          directionsRenderer.setDirections(result);
          
          // Calculate estimated values based on route data
          const route = result.routes[0];
          if (route && route.legs && route.legs[0]) {
          const duration = route.legs[0].duration.text;
          
          // Get distance values
          const distanceValue = route.legs[0].distance.value; // in meters
          const durationValue = route.legs[0].duration.value; // in seconds
          
          // Convert meters to miles (1 meter = 0.000621371 miles)
          const miles = distanceValue * 0.000621371;
          const formattedMiles = miles.toFixed(1);
          
          // Store both distance values for future use
          setDistanceMiles(miles);
          setDistanceMeters(distanceValue);
          
          console.log('Debug: Distance calculation', {
            distanceValue,
            miles,
            formattedMiles,
            isRoundTrip: formData.isRoundTrip
          });
          
          // Calculate price using new pricing structure
          let basePrice = 50; // $50 per leg

          // Round trip adjustment (double the base price)
          if (formData.isRoundTrip) {
            basePrice = 100; // $50 per leg x 2 legs
          }
          
          // County determination logic
          console.log('Form data for county detection:', { 
            pickupAddress: formData.pickupAddress,
            destinationAddress: formData.destinationAddress 
          });
          const pickupCounty = await determineCounty(formData.pickupAddress);
          const destinationCounty = await determineCounty(formData.destinationAddress);
          
          // Determine if trip is within Franklin County or crosses county lines
          const isInFranklinCounty = pickupCounty === 'Franklin County' && destinationCounty === 'Franklin County';
          const isOneCountyOut = !isInFranklinCounty && (pickupCounty === 'Franklin County' || destinationCounty === 'Franklin County');
          const isTwoCountiesOut = !isInFranklinCounty && pickupCounty !== 'Franklin County' && destinationCounty !== 'Franklin County';
          
          // County-based charges
          if (isTwoCountiesOut) {
            // $50 per county outside of 1 county (2 counties out)
            basePrice += 50;
          }
          
          // Mileage charges based on location
          const totalMiles = formData.isRoundTrip ? miles * 2 : miles;
          let mileageRate;
          
          if (isInFranklinCounty) {
            mileageRate = 3; // $3 per mile inside Franklin County
          } else {
            mileageRate = 4; // $4 per mile outside Franklin County
          }
          
          basePrice += totalMiles * mileageRate;
          
          console.log('Debug: Price calculation', {
            basePrice: basePrice,
            totalMiles,
            mileageRate,
            mileageCharge: totalMiles * mileageRate,
            pickupCounty,
            destinationCounty,
            isInFranklinCounty,
            isOneCountyOut,
            isTwoCountiesOut
          });
          
          // Weekend and hour adjustments
          const pickupDate = new Date(formData.pickupTime);
          const day = pickupDate.getDay();
          const hour = pickupDate.getHours();
          
          // Weekend adjustment ($40 for Saturday or Sunday)
          if (day === 0 || day === 6) { // Weekend (0 = Sunday, 6 = Saturday)
            basePrice += 40;
          }
          
          // Off-hours adjustment ($40 for before 8am or after 8pm)
          if (hour < 8 || hour >= 20) {
            basePrice += 40;
          }
          
          // Emergency fee (if marked as emergency)
          if (formData.isEmergency) {
            basePrice += 40;
          }
          
          // Wheelchair rental fee (if wheelchair rental is requested)
          if (formData.wheelchairType === 'none' && formData.wheelchairRental) {
            basePrice += 25;
          }
          
          // Check if user is a veteran for higher discount
          const { data: profileData } = await supabase
            .from('profiles')
            .select('is_veteran')
            .eq('id', user.id)
            .single();
            
          // Apply 20% discount for veterans, 10% for regular individual clients
          const priceBeforeDiscount = basePrice;
          let discountPercentage = 0;
          let discountAmount = 0;
          
          if (profileData?.is_veteran) {
            discountPercentage = 20;
            discountAmount = basePrice * 0.2;
            basePrice = basePrice * 0.8; // 20% discount for veterans
          } else {
            discountPercentage = 10;
            discountAmount = basePrice * 0.1;
            basePrice = basePrice * 0.9; // 10% discount for non-veterans
          }
          
          // Set the price rounded to the nearest cent
          const finalPrice = Math.round(basePrice * 100) / 100;
          
          // Create pricing breakdown
          const breakdown = {
            baseRate: formData.isRoundTrip ? 100 : 50,
            mileageRate: mileageRate,
            totalMiles: totalMiles,
            mileageCharge: totalMiles * mileageRate,
            countyCharge: isTwoCountiesOut ? 50 : 0,
            weekendAdjustment: (day === 0 || day === 6) ? 40 : 0,
            offHoursAdjustment: (hour < 8 || hour >= 20) ? 40 : 0,
            emergencyFee: formData.isEmergency ? 40 : 0,
            wheelchairRentalFee: (formData.wheelchairType === 'none' && formData.wheelchairRental) ? 25 : 0,
            subtotal: priceBeforeDiscount,
            discountPercentage: discountPercentage,
            discountAmount: discountAmount,
            finalPrice: finalPrice,
            isVeteran: profileData?.is_veteran || false,
            pickupCounty: pickupCounty,
            destinationCounty: destinationCounty,
            isInFranklinCounty: isInFranklinCounty,
            isTwoCountiesOut: isTwoCountiesOut
          };
          
          console.log('Debug: Final price calculation', {
            priceBeforeDiscount,
            isVeteran: profileData?.is_veteran,
            discountPercentage: `${discountPercentage}%`,
            discountAmount: `$${discountAmount.toFixed(2)}`,
            discountedPrice: basePrice,
            finalPrice,
            weekendAdj: (day === 0 || day === 6) ? 40 : 0,
            offHoursAdj: (hour < 8 || hour >= 20) ? 40 : 0,
            wheelchairAdj: formData.wheelchairType === 'wheelchair' ? 25 : 0
          });
          
          setPricingBreakdown(breakdown);
          setEstimatedFare(finalPrice);
          setEstimatedDuration(duration);
        }
      } else {
        console.error('Error calculating route:', status);
      }
      } finally {
        // Reset the calculation flag regardless of success or error
        isCalculatingRouteRef.current = false;
        setIsCalculatingRoute(false); // Clear loading state
        console.log('Route calculation completed');
      }
    });
  }, [mapInstance, directionsRenderer, formData.isRoundTrip, formData.pickupTime, formData.wheelchairType, formData.wheelchairRental, formData.pickup, formData.destination, formData.isEmergency, supabase, user.id]);

  // References to PlaceAutocompleteElement containers
  const pickupAutocompleteContainerRef = useRef(null);
  const destinationAutocompleteContainerRef = useRef(null);
  
  // Add ref to track map initialization status
  const isMapInitialized = useRef(false);
  
  // Initialize Google Maps
  useEffect(() => {
    if (!isGoogleLoaded || !mapRef.current || isMapInitialized.current) return;
    
    // Add a small delay to ensure DOM is fully stable after parallax background setup
    const initializeMap = () => {
      try {
        // Initialize Map
        const map = new window.google.maps.Map(mapRef.current, {
          center: { lat: 40.4173, lng: -82.9071 }, // Default to Columbus, Ohio
          zoom: 7, // Wider view for Ohio state
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false
        });
        
        setMapInstance(map);
        
        // Initialize Directions Renderer
        const renderer = new window.google.maps.DirectionsRenderer({
          map,
          suppressMarkers: false,
          polylineOptions: {
            strokeColor: '#4285F4',
            strokeWeight: 5
          }
        });
        
        setDirectionsRenderer(renderer);
        isMapInitialized.current = true;
        
        console.log('Google Maps initialized successfully');
      } catch (error) {
        console.error('Error initializing Google Maps:', error);
      }
    };

    // Add delay to ensure DOM stability with parallax background
    const timer = setTimeout(initializeMap, 300);
    
    // Clean up function
    return () => {
      clearTimeout(timer);
    };
  }, [isGoogleLoaded]); // Removed problematic dependencies
  
  // References for autocomplete instances
  const pickupAutocompleteRef = useRef(null);
  const destinationAutocompleteRef = useRef(null);
  
  // Initialize traditional Places Autocomplete for input fields
  useEffect(() => {
    if (!isGoogleLoaded || 
        !window.google?.maps?.places?.Autocomplete ||
        !pickupAutocompleteContainerRef.current || 
        !destinationAutocompleteContainerRef.current) return;

    // Add delay to ensure DOM stability after parallax background and map initialization
    const initializeAutocomplete = () => {
      try {
        // Perform cleanup first to ensure we start fresh
        const cleanupAutocomplete = () => {
          // Clean up existing autocomplete instances
          if (pickupAutocompleteRef.current) {
            window.google.maps.event.clearInstanceListeners(pickupAutocompleteRef.current);
            pickupAutocompleteRef.current = null;
          }
          
          if (destinationAutocompleteRef.current) {
            window.google.maps.event.clearInstanceListeners(destinationAutocompleteRef.current);
            destinationAutocompleteRef.current = null;
          }
          
          // Remove existing input elements to create fresh ones
          if (pickupAutocompleteContainerRef.current) {
            while (pickupAutocompleteContainerRef.current.firstChild) {
              pickupAutocompleteContainerRef.current.removeChild(
                pickupAutocompleteContainerRef.current.firstChild
              );
            }
          }
          
          if (destinationAutocompleteContainerRef.current) {
            while (destinationAutocompleteContainerRef.current.firstChild) {
              destinationAutocompleteContainerRef.current.removeChild(
                destinationAutocompleteContainerRef.current.firstChild
              );
            }
          }
        };
        
        // Clean up existing elements first
        cleanupAutocomplete();

        // Create traditional input fields for autocomplete
        const pickupInput = document.createElement('input');
        pickupInput.className = 'w-full px-3 py-2 border border-[#DDE5E7] dark:border-[#333333] rounded-md shadow-sm focus:outline-none focus:ring-[#5fbfc0] focus:border-[#5fbfc0] bg-white dark:bg-[#1A1A1A] text-black dark:text-white';
        pickupInput.placeholder = 'Enter your pickup location';
        pickupInput.value = formData.pickupAddress || '';
        pickupInput.id = 'pickup-autocomplete-input';
        
        const destinationInput = document.createElement('input');
        destinationInput.className = 'w-full px-3 py-2 border border-[#DDE5E7] dark:border-[#333333] rounded-md shadow-sm focus:outline-none focus:ring-[#5fbfc0] focus:border-[#5fbfc0] bg-white dark:bg-[#1A1A1A] text-black dark:text-white';
        destinationInput.placeholder = 'Enter your destination';
        destinationInput.value = formData.destinationAddress || '';
        destinationInput.id = 'destination-autocomplete-input';
        
        // Append inputs to container
        pickupAutocompleteContainerRef.current.appendChild(pickupInput);
        destinationAutocompleteContainerRef.current.appendChild(destinationInput);
        
        // Initialize traditional Google Places Autocomplete
        const pickupAutocomplete = new window.google.maps.places.Autocomplete(pickupInput, {
          fields: ['formatted_address', 'geometry', 'name', 'place_id', 'address_components'],
          componentRestrictions: { country: 'us' }
        });
        
        // Set bias to Ohio region for better results
        const ohioBounds = new window.google.maps.LatLngBounds(
          new window.google.maps.LatLng(38.4031, -84.8204), // SW corner of Ohio
          new window.google.maps.LatLng(42.3270, -80.5183)  // NE corner of Ohio
        );
        pickupAutocomplete.setBounds(ohioBounds);
        
        const destinationAutocomplete = new window.google.maps.places.Autocomplete(destinationInput, {
          fields: ['formatted_address', 'geometry', 'name', 'place_id', 'address_components'],
          componentRestrictions: { country: 'us' }
        });
        
        // Also set bias for destination
        destinationAutocomplete.setBounds(ohioBounds);
        
        // Store references to autocomplete instances
        pickupAutocompleteRef.current = pickupAutocomplete;
        destinationAutocompleteRef.current = destinationAutocomplete;
        
        // Add event listeners with place validation
        pickupAutocomplete.addListener('place_changed', () => {
          const place = pickupAutocomplete.getPlace();
          if (!place.geometry || !place.geometry.location) return;
          
          const address = place.formatted_address || place.name || '';
          setFormData(prev => ({ ...prev, pickupAddress: address }));
          
          const location = {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng()
          };
          
          // Only update if location actually changed
          setPickupLocation(prevLocation => {
            if (prevLocation && prevLocation.lat === location.lat && prevLocation.lng === location.lng) {
              return prevLocation; // No change, prevent re-render
            }
            return location;
          });
          
          if (mapInstance) {
            mapInstance.setCenter(location);
            mapInstance.setZoom(15);
          }
        });
        
        destinationAutocomplete.addListener('place_changed', () => {
          const place = destinationAutocomplete.getPlace();
          if (!place.geometry || !place.geometry.location) return;
          
          const address = place.formatted_address || place.name || '';
          setFormData(prev => ({ ...prev, destinationAddress: address }));
          
          const location = {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng()
          };
          
          // Only update if location actually changed
          setDestinationLocation(prevLocation => {
            if (prevLocation && prevLocation.lat === location.lat && prevLocation.lng === location.lng) {
              return prevLocation; // No change, prevent re-render
            }
            return location;
          });
        });
        
        // Manual input change handlers (two-way binding without re-rendering)
        pickupInput.addEventListener('input', (e) => {
          // Update the form state without causing a re-render
          formData.pickupAddress = e.target.value;
        });
        
        destinationInput.addEventListener('input', (e) => {
          // Update the form state without causing a re-render
          formData.destinationAddress = e.target.value;
        });
      } catch (error) {
        console.error('Error initializing Places Autocomplete:', error);
      }
    };

    // Add delay to ensure DOM stability after parallax background setup
    const timer = setTimeout(initializeAutocomplete, 500);
    
    // Cleanup function
    return () => {
      clearTimeout(timer);
      // Clean up autocomplete instances and event listeners on unmount
      if (pickupAutocompleteRef.current) {
        window.google?.maps?.event?.clearInstanceListeners(pickupAutocompleteRef.current);
        pickupAutocompleteRef.current = null;
      }
      
      if (destinationAutocompleteRef.current) {
        window?.google?.maps?.event?.clearInstanceListeners(destinationAutocompleteRef.current);
        destinationAutocompleteRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGoogleLoaded, formData.pickupAddress, formData.destinationAddress]);
  
  // Effect to calculate route when both locations are available
  useEffect(() => {
    if (pickupLocation && destinationLocation && mapInstance && directionsRenderer) {
      // Add debouncing to prevent excessive route calculations
      const timer = setTimeout(() => {
        calculateRoute(pickupLocation, destinationLocation);
      }, 500); // Increased delay to reduce flashing
      
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickupLocation, destinationLocation, calculateRoute]); // Intentionally excluding mapInstance and directionsRenderer to prevent unnecessary re-renders

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Generate an array of dates for the next 30 days
  const getDateOptions = () => {
    const dates = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    return dates;
  };
  
  // Handle date selection
  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setCurrentView('time'); // Switch to time selection after date is selected
    
    // In the future, we would fetch available time slots for the selected date
    // For now, we just use the generated slots
  };
  
  // Handle time selection and update the form
  const handleTimeSelect = (timeSlot, isReturn = false) => {
    const { hour, minute } = timeSlot.value;
    console.log('Time selected:', { timeSlot, hour, minute, isReturn });
    
    if (isReturn) {
      const newDate = new Date(selectedReturnDate);
      newDate.setHours(hour, minute, 0, 0);
      
      console.log('Return date with time:', newDate);
      // Format as local datetime string to avoid timezone issues
      // Use the selected date and manually set time to avoid any Date() timezone issues
      const year = selectedReturnDate.getFullYear();
      const month = String(selectedReturnDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedReturnDate.getDate()).padStart(2, '0');
      const hours = String(hour).padStart(2, '0');
      const minutes = String(minute).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}T${hours}:${minutes}`;
      console.log('Formatted return date:', formattedDate);
      
      setFormData(prev => ({
        ...prev,
        returnPickupTime: formattedDate
      }));
      
      // Close the date picker after selection
      setIsReturnDatePickerOpen(false);
    } else {
      const newDate = new Date(selectedDate);
      newDate.setHours(hour, minute, 0, 0);
      
      console.log('Pickup date with time:', newDate);
      // Format as local datetime string to avoid timezone issues
      // Use the selected date and manually set time to avoid any Date() timezone issues
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const hours = String(hour).padStart(2, '0');
      const minutes = String(minute).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}T${hours}:${minutes}`;
      console.log('Formatted pickup date:', formattedDate);
      
      setFormData(prev => ({
        ...prev,
        pickupTime: formattedDate
      }));
      
      // Close the date picker after selection
      setIsDatePickerOpen(false);
    }
    
    setCurrentView('date'); // Reset to date view for next time
  };
  
  // Open the date/time picker
  const openDatePicker = () => {
    setIsDatePickerOpen(true);
    setCurrentView('date');
  };
  
  // Open the return date/time picker
  const openReturnDatePicker = () => {
    setIsReturnDatePickerOpen(true);
    setCurrentView('date');
  };
  
  // Handle return date selection
  const handleReturnDateSelect = (date) => {
    setSelectedReturnDate(date);
    setCurrentView('time'); // Switch to time selection after date is selected
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setBookingStatus('loading');
    setError('');
    setSuccess(false);

    // Get values directly from the input fields for the most up-to-date data
    let pickupAddressValue = formData.pickupAddress;
    let destinationAddressValue = formData.destinationAddress;
    
    // Get values from DOM if available (more reliable when using autocomplete)
    if (pickupAutocompleteContainerRef.current?.firstChild) {
      pickupAddressValue = pickupAutocompleteContainerRef.current.firstChild.value;
      // Update form state with the current input value
      setFormData(prev => ({ ...prev, pickupAddress: pickupAddressValue }));
    }
    
    if (destinationAutocompleteContainerRef.current?.firstChild) {
      destinationAddressValue = destinationAutocompleteContainerRef.current.firstChild.value;
      // Update form state with the current input value  
      setFormData(prev => ({ ...prev, destinationAddress: destinationAddressValue }));
    }

    // Validate form
    if (!pickupAddressValue) {
      setError('Please enter a pickup address');
      setIsLoading(false);
      setBookingStatus('error');
      return;
    }

    if (!destinationAddressValue) {
      setError('Please enter a destination address');
      setIsLoading(false);
      setBookingStatus('error');
      return;
    }

    const pickupTime = new Date(formData.pickupTime);
    const now = new Date();
    
    if (pickupTime <= now) {
      setError('Pickup time must be in the future');
      setIsLoading(false);
      setBookingStatus('error');
      return;
    }
    
    // Validate return pickup time for round trips
    if (formData.isRoundTrip) {
      if (!formData.returnPickupTime) {
        setError('Please select a return pickup time for your round trip');
        setIsLoading(false);
        setBookingStatus('error');
        return;
      }
      
      const returnPickupTime = new Date(formData.returnPickupTime);
      
      if (returnPickupTime <= pickupTime) {
        setError('Return pickup time must be after initial pickup time');
        setIsLoading(false);
        setBookingStatus('error');
        return;
      }
    }

    // Validate payment method selection
    if (!selectedPaymentMethodId) {
      setError('Please add a payment method before booking. Visit your Payment Methods page to add a card.');
      setIsLoading(false);
      setBookingStatus('error');
      return;
    }

    try {
      // Calculate final price (in case route hasn't been calculated yet)
      let calculatedPrice = estimatedFare;
      if (!calculatedPrice && formData.isRoundTrip) {
        calculatedPrice = 100; // Base rate for round trip without route
      } else if (!calculatedPrice) {
        calculatedPrice = 50;  // Base rate without route
      }
      
      setBookingStatus('submitting');
      
      // Insert the trip into the database
      const { data, error: insertError } = await supabase
        .from('trips')
        .insert([{
          user_id: user.id,
          pickup_address: pickupAddressValue,
          destination_address: destinationAddressValue,
          pickup_time: formData.pickupTime,
          return_pickup_time: formData.isRoundTrip ? formData.returnPickupTime : null, // Save return pickup time only for round trips
          status: 'pending', // Changed from 'upcoming' to 'pending'
          special_requirements: formData.tripNotes || null, // Save trip notes as special requirements
          wheelchair_type: formData.wheelchairType,
          wheelchair_rental: formData.wheelchairRental,
          is_round_trip: formData.isRoundTrip,
          is_emergency: formData.isEmergency,
          price: calculatedPrice, // Save estimated price
          payment_method_id: selectedPaymentMethodId, // Include the selected payment method
          distance: distanceMiles > 0
            ? Math.round((formData.isRoundTrip ? distanceMiles * 2 : distanceMiles) * 10) / 10
            : null, // Save distance in miles, doubled for round trips, rounded to 1 decimal
          pickup_building_info: formData.pickupBuildingInfo || null,
          destination_building_info: formData.destinationBuildingInfo || null,
          weight: formData.weight ? parseInt(formData.weight) : null,
          height_feet: formData.heightFeet ? parseInt(formData.heightFeet) : null,
          height_inches: formData.heightInches ? parseInt(formData.heightInches) : null,
          date_of_birth: formData.dateOfBirth || null,
          additional_passengers: formData.additionalPassengers ? parseInt(formData.additionalPassengers) : 0,
          created_at: new Date().toISOString(),
        }])
        .select();

      if (insertError) {
        throw insertError;
      }

      console.log('Trip booked successfully:', data);

      // 🎉 DEPLOYMENT CHECK: If you see this, new code is deployed! 🎉
      console.log('🎉🎉🎉 DEPLOYMENT VERIFIED - NEW CODE ACTIVE 🎉🎉🎉');
      console.log('📧 Calling notification API for trip:', data[0].id);

      // Notify dispatchers in the background
      notifyDispatchersInBackground(data[0].id);

      // Trip was created, show success immediately
      setSuccess(true);
      setBookingStatus('success');
      
      // Reset form
      setFormData({
        pickupAddress: '',
        destinationAddress: '',
        pickupTime: formData.pickupTime, // Keep the time
        returnPickupTime: formData.returnPickupTime, // Keep the return time
        wheelchairType: 'none',
        wheelchairRental: false,
        isRoundTrip: false,
        isEmergency: false,
        pickupBuildingInfo: '',
        destinationBuildingInfo: '',
        weight: '',
        heightFeet: '',
        heightInches: '',
        dateOfBirth: '',
        additionalPassengers: 0,
        tripNotes: '',
      });

      // Start the redirect process
      setTimeout(() => {
        router.push('/dashboard/trips');
      }, 2000);
      
      // In the background, notify dispatchers without blocking the user flow
      const createdTrip = data[0]; // Get the first trip from the returned data
      
      // Use non-blocking notification in the background
      notifyDispatchersInBackground(createdTrip.id);
      
    } catch (error) {
      console.error('Error booking trip:', error);
      setError(error.message || 'Failed to book trip. Please try again.');
      setBookingStatus('error');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to notify dispatchers in the background
  const notifyDispatchersInBackground = async (tripId) => {
    console.log('📧 Inside notifyDispatchersInBackground, trip ID:', tripId);
    try {
      console.log('📧 Sending request to /api/trips/notify-dispatchers...');
      const notifyResponse = await fetch('/api/trips/notify-dispatchers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tripId }),
      });

      console.log('📧 Response status:', notifyResponse.status);
      const notifyResult = await notifyResponse.json();
      console.log('📧 Response data:', notifyResult);

      if (!notifyResponse.ok) {
        console.error('❌ Error notifying dispatchers:', notifyResult.error);
        // We don't block the user experience if notification fails
      } else {
        console.log('✅ Dispatchers notified successfully');
      }
    } catch (notifyError) {
      console.error('Error in dispatcher notification:', notifyError);
      // Again, we don't block the user experience on notification errors
    }
  };

  // State for selected payment method from PaymentMethodsSection
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState(null);
  const [defaultPaymentMethod, setDefaultPaymentMethod] = useState(null);
  const [paymentMethodsLoading, setPaymentMethodsLoading] = useState(true);
  
  // Handle payment method change from PaymentMethodsSection
  const handlePaymentMethodChange = (paymentMethodId) => {
    setSelectedPaymentMethodId(paymentMethodId);
  };

  // Fetch default payment method
  const fetchDefaultPaymentMethod = useCallback(async () => {
    setPaymentMethodsLoading(true);
    try {
      const response = await fetch('/api/stripe/payment-methods');
      const data = await response.json();
      
      if (response.ok && data.paymentMethods && data.paymentMethods.length > 0) {
        // Find the default payment method or use the first one
        const defaultMethod = data.paymentMethods.find(method => 
          method.id === profileData?.default_payment_method_id
        ) || data.paymentMethods[0];
        
        setDefaultPaymentMethod(defaultMethod);
        setSelectedPaymentMethodId(defaultMethod.id);
      } else {
        setDefaultPaymentMethod(null);
        setSelectedPaymentMethodId(null);
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      setDefaultPaymentMethod(null);
      setSelectedPaymentMethodId(null);
    } finally {
      setPaymentMethodsLoading(false);
    }
  }, [profileData?.default_payment_method_id]);

  // Fetch payment methods when component mounts or profile data changes
  useEffect(() => {
    if (profileData) {
      fetchDefaultPaymentMethod();
    }
  }, [profileData, fetchDefaultPaymentMethod]);

  // Helper functions for payment method display
  const formatCardNumber = (last4) => {
    return `•••• •••• •••• ${last4}`;
  };

  const getCardBrandDisplay = (brand) => {
    switch (brand.toLowerCase()) {
      case 'visa':
        return 'Visa';
      case 'mastercard':
        return 'Mastercard';
      case 'amex':
        return 'American Express';
      case 'discover':
        return 'Discover';
      default:
        return brand.charAt(0).toUpperCase() + brand.slice(1);
    }
  };

  return (
    <>
      {/* Load Google Maps JavaScript API with Places and Directions libraries */}
      <Script
        id="google-maps-script"
        strategy="afterInteractive"
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&callback=Function.prototype`}
        onLoad={() => {
          console.log('Google Maps script loaded');
          setIsGoogleLoaded(true);
        }}
        onReady={() => {
          console.log('Google Maps script ready');
          setIsGoogleLoaded(true);
        }}
      />

      <DashboardLayout user={user} activeTab="book" isBookingForm={true}>
        <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-md border border-white/20 p-8 mb-8 mt-8">
          <h2 className="text-3xl font-semibold text-black mb-6">Book a Ride</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-100 dark:bg-red-900/30 text-[#FF4A4A] dark:text-[#FF7A7A] p-4 rounded">
                {error}
              </div>
            )}

            {/* Enhanced Client Information Section - Profile Display */}
            {profileData && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-bold text-black flex items-center">
                    <span className="mr-2">👤</span>
                    Client Information
                  </h3>
                  <a
                    href="/dashboard/profile"
                    className="text-sm text-[#5fbfc0] hover:text-[#4aa5a6] font-medium inline-flex items-center"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Client Info
                  </a>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-black/70 font-medium">Name</p>
                    <p className="text-black font-bold">{profileData.full_name || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-black/70 font-medium">Phone</p>
                    <p className="text-black font-bold">{profileData.phone || 'Not provided'}</p>
                  </div>
                  {profileData.medical_notes && (
                    <div className="md:col-span-2">
                      <p className="text-black/70 font-medium">Medical Notes</p>
                      <p className="text-black font-bold">{profileData.medical_notes}</p>
                    </div>
                  )}
                  {profileData.accessibility_needs && (
                    <div className="md:col-span-2">
                      <p className="text-black/70 font-medium">Accessibility Needs</p>
                      <p className="text-black font-bold">{profileData.accessibility_needs}</p>
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
                  <p className="text-xs text-black/60 flex items-start">
                    <svg className="w-4 h-4 mr-1 mt-0.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Client information loaded from profile. To make changes, please use the 'Edit Client Info' link above.
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Pickup Address */}
              <div className="col-span-1 md:col-span-2">
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor="pickupAddress" className="block text-base font-bold text-black">
                    Pickup Address
                  </label>
                </div>

                <div className="relative">
                  <div
                    ref={pickupAutocompleteContainerRef}
                    className="w-full"
                    aria-label="Pickup location input"
                  >
                    {/* Autocomplete input will be inserted here */}
                  </div>
                  <input
                    type="hidden"
                    name="pickupAddress"
                    value={formData.pickupAddress}
                    required
                  />
                </div>

                {/* Pickup Building Info */}
                <div className="mt-2">
                  <input
                    type="text"
                    name="pickupBuildingInfo"
                    id="pickupBuildingInfo"
                    value={formData.pickupBuildingInfo}
                    onChange={handleChange}
                    placeholder="Apartment, suite, building entrance, etc. (optional)"
                    className="w-full px-3 py-2 border border-[#DDE5E7] dark:border-[#333333] rounded-md shadow-sm focus:outline-none focus:ring-[#5fbfc0] focus:border-[#5fbfc0] bg-white dark:bg-[#1A1A1A] text-black dark:text-white"
                  />
                </div>
              </div>

              {/* Destination Address */}
              <div className="col-span-1 md:col-span-2">
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor="destinationAddress" className="block text-base font-bold text-black">
                    Destination Address
                  </label>
                </div>

                <div className="relative">
                  <div
                    ref={destinationAutocompleteContainerRef}
                    className="w-full"
                    aria-label="Destination location input"
                  >
                    {/* Autocomplete input will be inserted here */}
                  </div>
                  <input
                    type="hidden"
                    name="destinationAddress"
                    value={formData.destinationAddress}
                    required
                  />
                </div>

                {/* Destination Building Info */}
                <div className="mt-2">
                  <input
                    type="text"
                    name="destinationBuildingInfo"
                    id="destinationBuildingInfo"
                    value={formData.destinationBuildingInfo}
                    onChange={handleChange}
                    placeholder="Building, entrance, room number, etc. (optional)"
                    className="w-full px-3 py-2 border border-[#DDE5E7] dark:border-[#333333] rounded-md shadow-sm focus:outline-none focus:ring-[#5fbfc0] focus:border-[#5fbfc0] bg-white dark:bg-[#1A1A1A] text-black dark:text-white"
                  />
                </div>
              </div>
              
              {/* Pickup Date and Time - Popup Picker */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="pickupDateTime" className="block text-base font-bold text-black mb-1">
                    Pickup Date & Time
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      id="pickupDateTime"
                      onClick={openDatePicker}
                      className="w-full px-3 py-2 border border-[#DDE5E7] dark:border-[#333333] rounded-md shadow-sm focus:outline-none focus:ring-[#5fbfc0] focus:border-[#5fbfc0] bg-white dark:bg-[#1A1A1A] text-black dark:text-white text-left flex justify-between items-center"
                    >
                      <span className={formData.pickupTime ? "text-black dark:text-white" : "text-black/50 dark:text-white/50"}>
                        {formData.pickupTime 
                          ? `${formatDateUS(formData.pickupTime)}, ${getDayName(formData.pickupTime)} - ${formatTimeAmPm(formData.pickupTime)}`
                          : "Select pickup date and time"}
                      </span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#3B5B63] dark:text-[#84CED3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </button>
                    
                    {/* Date and Time Picker Popup */}
                    {isDatePickerOpen && (
                      <div 
                        ref={datePickerRef}
                        className="absolute z-50 mt-2 w-full bg-white dark:bg-[black] border border-[#DDE5E7] dark:border-[#333333] rounded-md shadow-lg p-4"
                      >
                        {/* Header with back button for time view */}                          <div className="flex justify-between items-center mb-2">
                            <h4 className="text-black font-bold">
                              {currentView === 'date' ? 'Select Date' : 'Select Time'}
                            </h4>
                          {currentView === 'time' && (
                            <button 
                              type="button"
                              onClick={() => setCurrentView('date')}
                              className="text-[#3B5B63] dark:text-[#84CED3] hover:text-[#5fbfc0] flex items-center text-sm font-bold"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                              </svg>
                              Back to dates
                            </button>
                          )}
                        </div>
                        
                        {/* Date selection view */}
                        {currentView === 'date' && (
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-60 overflow-y-auto">
                            {getDateOptions().map((date, index) => {
                              const isToday = new Date().toDateString() === date.toDateString();
                              const isSelected = selectedDate && selectedDate.toDateString() === date.toDateString();
                              
                              return (
                                <button
                                  key={index}
                                  type="button"
                                  onClick={() => handleDateSelect(date)}
                                  className={`
                                    p-2 rounded-md border text-center flex flex-col items-center
                                    ${isSelected 
                                      ? 'bg-[#5fbfc0]/20 border-[#5fbfc0] text-[#3B5B63] dark:text-[white]' 
                                      : 'border-[#DDE5E7] dark:border-[#333333] hover:bg-[#F8F9FA] dark:hover:bg-[#1A1A1A]'}
                                  `}
                                >
                                  <span className="text-xs font-medium">{getDayName(date)}</span>
                                  <span className={`text-sm ${isToday ? 'font-bold' : ''}`}>{formatMonthDay(date)}</span>
                                  {isToday && <span className="text-xs text-[#5fbfc0] mt-1">Today</span>}
                                </button>
                              );
                            })}
                          </div>
                        )}
                        
                        {/* Time selection view */}
                        {currentView === 'time' && selectedDate && (
                          <div>                              <div className="text-sm text-black font-bold mb-2">
                                {new Date(selectedDate).toLocaleDateString('en-US', { 
                                  weekday: 'long', 
                                  month: 'long', 
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </div>
                            
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-60 overflow-y-auto">
                              {availableTimeSlots.map((slot, index) => {
                                // In the future, we could mark some slots as unavailable
                                // For now, all slots are available
                                
                                return (
                                  <button
                                    key={index}
                                    type="button"
                                    onClick={() => handleTimeSelect(slot)}
                                    className="p-2 rounded-md border border-[#DDE5E7] dark:border-[#333333] hover:bg-[#5fbfc0]/10 text-center"
                                  >
                                    {slot.label}
                                  </button>
                                );
                              })}
                            </div>                                <div className="text-xs text-black font-bold mt-2 italic">
                                  All times shown are in your local timezone
                                </div>
                          </div>
                        )}
                        
                        {/* Optional hint for future availability feature */}                          <div className="mt-4 pt-2 border-t border-[#DDE5E7] dark:border-[#333333] text-xs text-black font-bold">
                            <p>Select a date and then choose an available time slot</p>
                          </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Wheelchair Transportation */}
              <div className="col-span-1 md:col-span-2">
                <div className="border border-gray-300 rounded-lg p-4">
                  <label className="block text-base font-bold text-black mb-3 flex items-center">
                    <span className="mr-2">♿</span>
                    Wheelchair Transportation
                  </label>
                  <p className="text-sm text-gray-600 mb-4">What type of wheelchair do you have?</p>
                  
                  <div className="space-y-3">
                    {/* None */}
                    <label className="flex items-start cursor-pointer">
                      <input
                        type="radio"
                        name="wheelchairType"
                        value="none"
                        checked={formData.wheelchairType === 'none'}
                        onChange={handleChange}
                        className="mt-1 mr-3 text-[#5fbfc0] focus:ring-[#5fbfc0]"
                      />
                      <div>
                        <div className="font-medium text-black">None</div>
                        <div className="text-sm text-gray-600">No wheelchair needed</div>
                      </div>
                    </label>

                    {/* Manual wheelchair */}
                    <label className="flex items-start cursor-pointer">
                      <input
                        type="radio"
                        name="wheelchairType"
                        value="manual"
                        checked={formData.wheelchairType === 'manual'}
                        onChange={handleChange}
                        className="mt-1 mr-3 text-[#5fbfc0] focus:ring-[#5fbfc0]"
                      />
                      <div>
                        <div className="font-medium text-black">Manual wheelchair (I have my own)</div>
                        <div className="text-sm text-gray-600">Standard manual wheelchair that you bring</div>
                        <div className="text-sm text-green-600 font-medium">No additional fee</div>
                      </div>
                    </label>

                    {/* Power wheelchair */}
                    <label className="flex items-start cursor-pointer">
                      <input
                        type="radio"
                        name="wheelchairType"
                        value="power"
                        checked={formData.wheelchairType === 'power'}
                        onChange={handleChange}
                        className="mt-1 mr-3 text-[#5fbfc0] focus:ring-[#5fbfc0]"
                      />
                      <div>
                        <div className="font-medium text-black">Power wheelchair (I have my own)</div>
                        <div className="text-sm text-gray-600">Electric/motorized wheelchair that you bring</div>
                        <div className="text-sm text-green-600 font-medium">No additional fee</div>
                      </div>
                    </label>

                    {/* Transport wheelchair - Not Available */}
                    <div className="flex items-start opacity-50">
                      <input
                        type="radio"
                        name="wheelchairType"
                        value="transport"
                        disabled
                        className="mt-1 mr-3 text-gray-400"
                      />
                      <div>
                        <div className="font-medium text-gray-500">Transport wheelchair</div>
                        <div className="text-sm text-red-600 font-medium">Not Available</div>
                        <div className="text-sm text-gray-500">Lightweight transport chair - Not permitted for safety reasons</div>
                      </div>
                    </div>
                  </div>

                  {/* Wheelchair Rental Option - Only show if "None" is selected */}
                  {formData.wheelchairType === 'none' && (
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <p className="text-sm font-medium text-black mb-3">Do you want us to provide a wheelchair?</p>
                      
                      <div className="space-y-3">
                        <label className="flex items-start cursor-pointer">
                          <input
                            type="radio"
                            name="wheelchairRental"
                            value="true"
                            checked={formData.wheelchairRental === true}
                            onChange={(e) => setFormData({...formData, wheelchairRental: e.target.value === 'true'})}
                            className="mt-1 mr-3 text-[#5fbfc0] focus:ring-[#5fbfc0]"
                          />
                          <div>
                            <div className="font-medium text-black">Yes, please provide a wheelchair</div>
                            <div className="text-sm text-gray-600">We will provide a suitable wheelchair for your trip</div>
                            <div className="text-sm text-blue-600 font-medium">+$25 wheelchair rental fee</div>
                          </div>
                        </label>

                        <label className="flex items-start cursor-pointer">
                          <input
                            type="radio"
                            name="wheelchairRental"
                            value="false"
                            checked={formData.wheelchairRental === false}
                            onChange={(e) => setFormData({...formData, wheelchairRental: e.target.value === 'true'})}
                            className="mt-1 mr-3 text-[#5fbfc0] focus:ring-[#5fbfc0]"
                          />
                          <div>
                            <div className="font-medium text-black">No, wheelchair not needed</div>
                            <div className="text-sm text-gray-600">Passenger can walk or transfer independently</div>
                          </div>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Information note */}
                  <div className="mt-4 p-3 bg-blue-50 rounded-md">
                    <p className="text-sm text-blue-800">
                      <span className="font-medium">Wheelchair Accessibility Information:</span><br />
                      All our vehicles are equipped with wheelchair accessibility features. The same fee applies to all wheelchair types to ensure fair and transparent pricing.
                    </p>
                  </div>
                </div>
              </div>

              {/* Enhanced Client Demographics Section */}
              <div className="col-span-1 md:col-span-2 border-t border-gray-200 pt-6 mt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-black flex items-center">
                    <span className="mr-2">👤</span>
                    Enhanced Client Information
                  </h3>
                  <a
                    href="/dashboard/profile"
                    className="text-sm text-[#5fbfc0] hover:text-[#4aa5a6] font-medium inline-flex items-center"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Client Info
                  </a>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                  <p className="text-xs text-black/60 flex items-start">
                    <svg className="w-4 h-4 mr-1 mt-0.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Client information loaded from profile. To make changes, please use the 'Edit Client Info' link above.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Weight Field */}
                  <div>
                    <label htmlFor="weight" className="block text-base font-bold text-black mb-1">
                      Weight (lbs)
                    </label>
                    <input
                      type="number"
                      name="weight"
                      id="weight"
                      value={formData.weight}
                      onChange={handleChange}
                      placeholder="Enter weight in pounds"
                      min="0"
                      max="400"
                      className="w-full px-3 py-2 border border-[#DDE5E7] dark:border-[#333333] rounded-md shadow-sm focus:outline-none focus:ring-[#5fbfc0] focus:border-[#5fbfc0] bg-white dark:bg-[#1A1A1A] text-black dark:text-white"
                    />
                    {formData.weight && parseInt(formData.weight) >= 400 && (
                      <div className="mt-2 p-3 bg-red-50 border-2 border-red-500 rounded-md">
                        <p className="text-sm font-bold text-red-800 flex items-start">
                          <span className="mr-1">🚫</span>
                          <span>Cannot accommodate - Over 400 lbs weight limit</span>
                        </p>
                      </div>
                    )}
                    {formData.weight && parseInt(formData.weight) >= 300 && parseInt(formData.weight) < 400 && (
                      <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded-md">
                        <p className="text-sm text-orange-800 flex items-start">
                          <span className="mr-1">⚠️</span>
                          <span>Bariatric transportation required. Additional $150 per leg vs $50 regular rate.</span>
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Height Field - Split into Feet and Inches */}
                  <div>
                    <label className="block text-base font-bold text-black mb-1">
                      Height
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <select
                          name="heightFeet"
                          id="heightFeet"
                          value={formData.heightFeet}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-[#DDE5E7] dark:border-[#333333] rounded-md shadow-sm focus:outline-none focus:ring-[#5fbfc0] focus:border-[#5fbfc0] bg-white dark:bg-[#1A1A1A] text-black dark:text-white"
                        >
                          <option value="">Feet</option>
                          <option value="4">4 ft</option>
                          <option value="5">5 ft</option>
                          <option value="6">6 ft</option>
                          <option value="7">7 ft</option>
                        </select>
                      </div>
                      <div>
                        <select
                          name="heightInches"
                          id="heightInches"
                          value={formData.heightInches}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-[#DDE5E7] dark:border-[#333333] rounded-md shadow-sm focus:outline-none focus:ring-[#5fbfc0] focus:border-[#5fbfc0] bg-white dark:bg-[#1A1A1A] text-black dark:text-white"
                        >
                          <option value="">Inches</option>
                          {[...Array(12)].map((_, i) => (
                            <option key={i} value={i}>{i} in</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Date of Birth Field */}
                  <div>
                    <label htmlFor="dateOfBirth" className="block text-base font-bold text-black mb-1">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      id="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-[#DDE5E7] dark:border-[#333333] rounded-md shadow-sm focus:outline-none focus:ring-[#5fbfc0] focus:border-[#5fbfc0] bg-white dark:bg-[#1A1A1A] text-black dark:text-white"
                    />
                    <p className="mt-1 text-xs text-black/60">Required for hospital record verification when needed</p>
                  </div>

                  {/* Email Address (from profile, display-only) */}
                  <div>
                    <label htmlFor="email" className="block text-base font-bold text-black mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full px-3 py-2 border border-[#DDE5E7] dark:border-[#333333] rounded-md shadow-sm bg-gray-100 dark:bg-[#0A0A0A] text-black/60 dark:text-white/60 cursor-not-allowed"
                    />
                  </div>

                  {/* Additional Passengers Field */}
                  <div>
                    <label htmlFor="additionalPassengers" className="block text-base font-bold text-black mb-1">
                      Additional Passengers
                    </label>
                    <input
                      type="number"
                      name="additionalPassengers"
                      id="additionalPassengers"
                      value={formData.additionalPassengers}
                      onChange={handleChange}
                      min="0"
                      max="4"
                      className="w-full px-3 py-2 border border-[#DDE5E7] dark:border-[#333333] rounded-md shadow-sm focus:outline-none focus:ring-[#5fbfc0] focus:border-[#5fbfc0] bg-white dark:bg-[#1A1A1A] text-black dark:text-white"
                    />
                    <p className="mt-1 text-xs text-black/60">Maximum 4 additional passengers</p>
                  </div>

                  {/* Trip Notes Field */}
                  <div className="md:col-span-2">
                    <label htmlFor="tripNotes" className="block text-base font-bold text-black mb-1">
                      Trip Notes
                    </label>
                    <textarea
                      name="tripNotes"
                      id="tripNotes"
                      value={formData.tripNotes}
                      onChange={handleChange}
                      rows="4"
                      placeholder="Special instructions, medical equipment, etc."
                      className="w-full px-3 py-2 border border-[#DDE5E7] dark:border-[#333333] rounded-md shadow-sm focus:outline-none focus:ring-[#5fbfc0] focus:border-[#5fbfc0] bg-white dark:bg-[#1A1A1A] text-black dark:text-white"
                    ></textarea>
                  </div>
                </div>

                {/* Why This Information Matters */}
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <h4 className="text-sm font-bold text-black mb-2">Why This Information Matters</h4>
                  <ul className="text-xs text-black/70 space-y-1 list-disc list-inside">
                    <li>Weight information helps us assign the appropriate vehicle and equipment</li>
                    <li>Height and mobility details ensure your comfort and safety during transport</li>
                    <li>Date of birth may be required for hospital check-in and insurance verification</li>
                    <li>Trip notes help our drivers provide personalized, compassionate care</li>
                  </ul>
                </div>
              </div>

              {/* Map display */}
              <div className="col-span-1 md:col-span-2 mt-4">
                <div className="relative w-full h-[300px] rounded-md border border-[#DDE5E7] dark:border-[#333333] overflow-hidden">
                  <div 
                    ref={mapRef} 
                    className="w-full h-full"
                  ></div>
                  
                  {/* Loading overlay for route calculation */}
                  {isCalculatingRoute && (
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-10">
                      <div className="bg-white rounded-lg p-4 flex items-center space-x-3 shadow-lg">
                        <svg className="animate-spin h-5 w-5 text-[#5fbfc0]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="text-sm font-medium text-black">Calculating route...</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Map initialization loading */}
                  {!mapInstance && isGoogleLoaded && (
                    <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                      <div className="text-center">
                        <svg className="animate-spin h-8 w-8 text-[#5fbfc0] mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="text-sm text-gray-600">Loading map...</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Round trip toggle */}
              <div className="col-span-1 md:col-span-2 flex items-center">
                <div className="relative inline-block w-10 mr-2 align-middle select-none">
                  <input
                    type="checkbox"
                    name="isRoundTrip"
                    id="isRoundTrip"
                    checked={formData.isRoundTrip}
                    onChange={(e) => setFormData({...formData, isRoundTrip: e.target.checked})}
                    className="absolute block w-6 h-6 rounded-full bg-white border-4 border-black appearance-none cursor-pointer checked:right-0 checked:border-black transition-all duration-200 focus:outline-none"
                  />
                  <label 
                    htmlFor="isRoundTrip"
                    className={`block overflow-hidden h-6 rounded-full cursor-pointer ${formData.isRoundTrip ? 'bg-black' : 'bg-black'}`}
                  ></label>
                </div>
                <label htmlFor="isRoundTrip" className="text-base font-bold text-black cursor-pointer">
                  Round Trip
                </label>
                {formData.isRoundTrip && (
                  <span className="ml-2 text-xs text-black font-bold">
                    The vehicle will wait for you and take you back to your pickup location.
                  </span>
                )}
              </div>

              {/* Emergency Trip Checkbox */}
              <div className="col-span-1 md:col-span-2 flex items-center">
                <div className="relative inline-block w-10 mr-2 align-middle select-none">
                  <input
                    type="checkbox"
                    name="isEmergency"
                    id="isEmergency"
                    checked={formData.isEmergency}
                    onChange={(e) => setFormData({...formData, isEmergency: e.target.checked})}
                    className="absolute block w-6 h-6 rounded-full bg-white border-4 border-red-600 appearance-none cursor-pointer checked:right-0 checked:border-red-600 transition-all duration-200 focus:outline-none"
                  />
                  <label 
                    htmlFor="isEmergency"
                    className={`block overflow-hidden h-6 rounded-full cursor-pointer ${formData.isEmergency ? 'bg-red-600' : 'bg-red-600'}`}
                  ></label>
                </div>
                <label htmlFor="isEmergency" className="text-base font-bold text-red-600 cursor-pointer">
                  Emergency Trip (+$40)
                </label>
                {formData.isEmergency && (
                  <span className="ml-2 text-xs text-red-600 font-bold">
                    Priority booking for urgent medical appointments.
                  </span>
                )}
              </div>
              
              {/* Return Pickup Time - Only visible for round trips */}
              {formData.isRoundTrip && (
                <div className="col-span-1 md:col-span-2 pt-4 border-t border-[#DDE5E7] dark:border-[#333333] mt-4">
                  <div>
                    <label htmlFor="returnPickupTime" className="block text-base font-bold text-black mb-1">
                      Return Pickup Time
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        id="returnPickupTime"
                        onClick={openReturnDatePicker}
                        className="w-full px-3 py-2 border border-[#DDE5E7] dark:border-[#333333] rounded-md shadow-sm focus:outline-none focus:ring-[#5fbfc0] focus:border-[#5fbfc0] bg-white dark:bg-[#1A1A1A] text-black dark:text-white text-left flex justify-between items-center"
                      >
                        <span className={formData.returnPickupTime ? "text-black dark:text-white" : "text-black/50 dark:text-white/50"}>
                          {formData.returnPickupTime 
                            ? `${formatDateUS(formData.returnPickupTime)}, ${getDayName(formData.returnPickupTime)} - ${formatTimeAmPm(formData.returnPickupTime)}`
                            : "Select return pickup time"}
                        </span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#3B5B63] dark:text-[#84CED3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </button>
                      
                      {/* Return Date and Time Picker Popup */}
                      {isReturnDatePickerOpen && (
                        <div 
                          ref={returnDatePickerRef}
                          className="absolute z-50 mt-2 w-full bg-white dark:bg-[black] border border-[#DDE5E7] dark:border-[#333333] rounded-md shadow-lg p-4"
                        >
                          {/* Header with back button for time view */}
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="text-black font-bold">
                              {currentView === 'date' ? 'Select Return Date' : 'Select Return Time'}
                            </h4>
                            {currentView === 'time' && (
                              <button 
                                type="button"
                                onClick={() => setCurrentView('date')}
                                className="text-[#3B5B63] dark:text-[#84CED3] hover:text-[#5fbfc0] flex items-center text-sm font-bold"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                                Back to dates
                              </button>
                            )}
                          </div>
                          
                          {/* Date selection view */}
                          {currentView === 'date' && (
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-60 overflow-y-auto">
                              {getDateOptions().map((date, index) => {
                                const isToday = new Date().toDateString() === date.toDateString();
                                const isSelected = selectedReturnDate && selectedReturnDate.toDateString() === date.toDateString();
                                
                                return (
                                  <button
                                    key={index}
                                    type="button"
                                    onClick={() => handleReturnDateSelect(date)}
                                    className={`
                                      p-2 rounded-md border text-center flex flex-col items-center
                                      ${isSelected 
                                        ? 'bg-[#5fbfc0]/20 border-[#5fbfc0] text-[#3B5B63] dark:text-[white]' 
                                        : 'border-[#DDE5E7] dark:border-[#333333] hover:bg-[#F8F9FA] dark:hover:bg-[#1A1A1A]'}
                                    `}
                                  >
                                    <span className="text-xs font-medium">{getDayName(date)}</span>
                                    <span className={`text-sm ${isToday ? 'font-bold' : ''}`}>{formatMonthDay(date)}</span>
                                    {isToday && <span className="text-xs text-[#5fbfc0] mt-1">Today</span>}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                          
                          {/* Time selection view */}
                          {currentView === 'time' && selectedReturnDate && (
                            <div>                                <div className="text-sm text-black font-bold mb-2">
                                  {new Date(selectedReturnDate).toLocaleDateString('en-US', { 
                                    weekday: 'long', 
                                    month: 'long', 
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </div>
                              
                              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-60 overflow-y-auto">
                                {availableTimeSlots.map((slot, index) => {
                                  return (
                                    <button
                                      key={index}
                                      type="button"
                                      onClick={() => handleTimeSelect(slot, true)}
                                      className="p-2 rounded-md border border-[#DDE5E7] dark:border-[#333333] hover:bg-[#5fbfc0]/10 text-center"
                                    >
                                      {slot.label}
                                    </button>
                                  );
                                })}
                              </div>
                              
                              <div className="text-xs text-black font-bold mt-2 italic">
                                All times shown are in your local timezone
                              </div>
                            </div>
                          )}
                          
                          {/* Optional hint */}                            <div className="mt-4 pt-2 border-t border-[#DDE5E7] dark:border-[#333333] text-xs text-black font-bold">
                              <p>Select a date and then choose an available time slot for your return trip</p>
                            </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="col-span-1 md:col-span-2 border-t border-[#DDE5E7] dark:border-[#333333] pt-4">
                <h3 className="text-md font-bold text-black mb-2">Ride Details</h3>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm font-bold text-black">Pickup Time</p>
                    {formData.pickupTime ? (
                      <p className="font-medium text-black">
                        {formatDateUS(formData.pickupTime)}, {getDayName(formData.pickupTime)} - {formatTimeAmPm(formData.pickupTime)}
                      </p>
                    ) : (
                      <p className="font-bold text-black">Select a time</p>
                    )}
                  </div>
                  
                  {/* Return Pickup Time - Only show in summary if round trip is selected */}
                  {formData.isRoundTrip && (
                    <div>
                      <p className="text-sm font-bold text-black">Return Pickup Time</p>
                      {formData.returnPickupTime ? (
                        <p className="font-medium text-black">
                          {formatDateUS(formData.returnPickupTime)}, {getDayName(formData.returnPickupTime)} - {formatTimeAmPm(formData.returnPickupTime)}
                        </p>
                      ) : (
                        <p className="font-bold text-black">Select a time</p>
                      )}
                    </div>
                  )}
                  
                  <div className="col-span-2">
                    <p className="text-sm font-bold text-black">Estimated Fare</p>
                    {pickupLocation && destinationLocation ? (
                      <div>
                        {isCalculatingRoute ? (
                          <div className="flex items-center space-x-2">
                            <svg className="animate-spin h-4 w-4 text-[#5fbfc0]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <p className="font-bold text-black text-lg">Calculating...</p>
                          </div>
                        ) : (
                          <p className="font-bold text-black text-lg">
                            {estimatedFare ? `$${estimatedFare.toFixed(2)}` : 'Enter addresses to calculate'}
                          </p>
                        )}
                        
                        {/* Pricing Breakdown */}
                        {pricingBreakdown && !isCalculatingRoute && (
                          <div className="mt-3 p-3 bg-white/100 rounded-md border border-[#DDE5E7] dark:border-[#333333]">
                            <p className="text-xs font-bold text-black mb-2">Pricing Breakdown:</p>
                            <div className="space-y-1 text-xs">
                              <div className="flex justify-between">
                                <span className="text-black font-bold">Base fare ({formData.isRoundTrip ? 'round trip' : 'one-way'}):</span>
                                <span className="text-black font-bold">${pricingBreakdown.baseRate.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-black font-bold">Mileage ({pricingBreakdown.totalMiles.toFixed(1)} miles × ${pricingBreakdown.mileageRate}/mi {pricingBreakdown.isInFranklinCounty ? 'Franklin County' : 'Outside Franklin County'}):</span>
                                <span className="text-black font-bold">${pricingBreakdown.mileageCharge.toFixed(2)}</span>
                              </div>
                              {pricingBreakdown.countyCharge > 0 && (
                                <div className="flex justify-between">
                                  <span className="text-black font-bold">County surcharge (2+ counties out):</span>
                                  <span className="text-black font-bold">+${pricingBreakdown.countyCharge.toFixed(2)}</span>
                                </div>
                              )}
                              {pricingBreakdown.weekendAdjustment > 0 && (
                                <div className="flex justify-between">
                                  <span className="text-black font-bold">Weekend premium:</span>
                                  <span className="text-black font-bold">+${pricingBreakdown.weekendAdjustment.toFixed(2)}</span>
                                </div>
                              )}
                              {pricingBreakdown.offHoursAdjustment > 0 && (
                                <div className="flex justify-between">
                                  <span className="text-black font-bold">Off-hours premium:</span>
                                  <span className="text-black font-bold">+${pricingBreakdown.offHoursAdjustment.toFixed(2)}</span>
                                </div>
                              )}
                              {pricingBreakdown.emergencyFee > 0 && (
                                <div className="flex justify-between">
                                  <span className="text-black font-bold">Emergency fee:</span>
                                  <span className="text-black font-bold">+${pricingBreakdown.emergencyFee.toFixed(2)}</span>
                                </div>
                              )}
                              {pricingBreakdown.wheelchairRentalFee > 0 && (
                                <div className="flex justify-between">
                                  <span className="text-black font-bold">Wheelchair rental:</span>
                                  <span className="text-black font-bold">+${pricingBreakdown.wheelchairRentalFee.toFixed(2)}</span>
                                </div>
                              )}
                              <div className="flex justify-between pt-1 mt-1 border-t border-[#DDE5E7] dark:border-[#333333]">
                                <span className="text-black font-bold">Subtotal:</span>
                                <span className="text-black font-bold">${pricingBreakdown.subtotal.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between text-black font-bold text-base">
                                <span>{profileData?.is_veteran ? 'Veteran discount (20%)' : 'Individual discount (10%)'}:</span>
                                <span>- ${pricingBreakdown.discountAmount.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between pt-1 mt-1 border-t border-[#DDE5E7] dark:border-[#333333] font-medium text-sm">
                                <span className="text-black font-bold">Total:</span>
                                <span className="text-black font-bold">${pricingBreakdown.finalPrice.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="font-bold text-black">Enter addresses</p>
                    )}
                  </div>
                  
                  <div>
                    <p className="text-sm font-bold text-black">Estimated Duration</p>
                    {pickupLocation && destinationLocation ? (
                      <p className="font-medium text-black">{formData.isRoundTrip ? `${estimatedDuration} × 2` : estimatedDuration}</p>
                    ) : (
                      <p className="font-bold text-black">Enter addresses</p>
                    )}
                  </div>
                  
                  <div>
                    <p className="text-sm font-bold text-black">Distance</p>
                    {pickupLocation && destinationLocation ? (
                      <p className="font-medium text-black">
                        {distanceMiles > 0 ? (
                          formData.isRoundTrip 
                            ? `${(distanceMiles * 2).toFixed(1)} miles (${distanceMiles.toFixed(1)} each way)`
                            : `${distanceMiles.toFixed(1)} miles`
                        ) : 'Calculating...'}
                      </p>
                    ) : (
                      <p className="font-bold text-black">Enter addresses</p>
                    )}
                  </div>
                  
                  {/* For round trips, show wait time between pickup and return */}
                  {formData.isRoundTrip && formData.pickupTime && formData.returnPickupTime && (
                    <div>
                      <p className="text-sm font-bold text-black">Wait Time</p>
                      <p className="font-medium text-black">
                        {(() => {
                          const pickupTime = new Date(formData.pickupTime);
                          const returnTime = new Date(formData.returnPickupTime);
                          const diffMs = returnTime - pickupTime;
                          const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
                          const diffMins = Math.round((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                          
                          if (diffHrs === 0) {
                            return `${diffMins} minutes`;
                          } else if (diffMins === 0) {
                            return `${diffHrs} ${diffHrs === 1 ? 'hour' : 'hours'}`;
                          } else {
                            return `${diffHrs} ${diffHrs === 1 ? 'hour' : 'hours'}, ${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'}`;
                          }
                        })()}
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="bg-[#5fbfc0]/10 dark:bg-[#5fbfc0]/20 p-3 rounded-md text-sm mb-4">
                  <p className="text-black font-bold">
                    <strong>Note:</strong> Your ride request will be reviewed and approved by a dispatcher. Once approved, it will be assigned to a compassionate driver who specializes in supportive transportation.
                  </p>
                  <p className="text-black font-bold mt-2">
                    <strong>Discount:</strong> {profileData?.is_veteran
                      ? (
                        <>Thank you for your service! As a veteran, you receive a <span className="text-black font-bold text-lg">20% discount</span> on all rides.</>
                      )
                      : (
                        <>A <span className="text-black font-bold text-lg">10% discount</span> is automatically applied to all individual rides. Veterans receive a <span className="text-black font-bold text-lg">20% discount</span>.</>
                    )}
                  </p>
                  <p className="text-black font-bold mt-2">
                    <strong>Cancellation Policy:</strong> You may cancel without penalty up until the day of the ride. Same-day cancellations will be charged the base fare only.
                  </p>
                  {formData.isRoundTrip && (
                    <p className="text-black font-bold mt-2">
                      <strong>Round Trip:</strong> Your driver will wait at the destination and bring you back to your pickup location.
                    </p>
                  )}
                </div>
              </div>
              
              {/* Payment Method Section - Simplified read-only display */}
              <div className="col-span-1 md:col-span-2 mb-8">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="block text-sm font-bold text-black">
                      Payment Method
                    </label>
                  </div>
                  
                  {paymentMethodsLoading ? (
                    <div className="flex items-center justify-center py-8 border-2 border-dashed border-[#DDE5E7] dark:border-[#333333] rounded-lg">
                      <svg className="animate-spin h-6 w-6 text-[#5fbfc0] mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="text-black font-bold">Loading payment methods...</span>
                    </div>
                  ) : defaultPaymentMethod ? (
                    <div className="bg-[#F8F9FA] dark:bg-[#1A1A1A] border border-[#DDE5E7] dark:border-[#333333] rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="text-xl">💳</div>
                          <div>
                            <p className="font-medium text-black dark:text-white text-sm">
                              Default Payment Method
                            </p>
                            <p className="text-sm text-black/70 dark:text-white/70">
                              {getCardBrandDisplay(defaultPaymentMethod.card.brand)} {formatCardNumber(defaultPaymentMethod.card.last4)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[#5fbfc0]/10 text-black dark:text-white">
                            ✓ Default
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t border-[#DDE5E7] dark:border-[#333333]">
                        <div className="bg-[#5fbfc0]/10 dark:bg-[#5fbfc0]/20 p-3 rounded-md">
                            <p className="text-sm text-black dark:text-white">
                              <strong>Payment Notice:</strong> Your card ending in {defaultPaymentMethod.card.last4} will be charged after your booking is approved by our dispatchers. You will not be charged immediately upon booking submission.
                            </p>
                        </div>
                        
                        <div className="mt-3 text-center">
                          <a 
                            href="/dashboard/payment-methods"
                            className="text-sm text-[#5fbfc0] hover:text-[#4aa5a6] font-medium inline-flex items-center"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.349 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.349a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.349 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.349a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Manage Payment Methods
                          </a>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 border-2 border-dashed border-[#DDE5E7] dark:border-[#333333] rounded-lg">
                      <svg className="mx-auto h-12 w-12 text-black mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                      <h4 className="text-lg font-bold text-black mb-2">Payment Method Required</h4>
                      <p className="text-sm text-black font-bold mb-4 max-w-md mx-auto">
                        Please add a payment method to your account before booking a ride. You will not be charged immediately and will only be charged once your booking is approved by our dispatchers.
                      </p>
                      <a 
                        href="/dashboard/payment-methods"
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#5fbfc0] hover:bg-[#4aa5a6] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5fbfc0]"
                      >
                        <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Add Payment Method
                      </a>
                    </div>
                  )}
                </div>
              </div>
              {/* Move the Request Ride button here, full width */}
              {formData.weight && parseInt(formData.weight) >= 400 ? (
                <a
                  href="mailto:support@cct.com?subject=Transportation Request - Over 400 lbs"
                  className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 text-center block mt-4"
                >
                  Cannot Book - Contact Us
                </a>
              ) : (
                <button
                  type="submit"
                  disabled={isLoading || !defaultPaymentMethod || paymentMethodsLoading}
                  className="w-full py-3 px-4 bg-[#5fbfc0] hover:bg-[#4aa5a6] text-white dark:text-[black] font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5fbfc0] disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden mt-4"
                >
                  {bookingStatus === 'loading' && (
                    <span className="absolute inset-0 flex items-center justify-center bg-[#5fbfc0]">
                      <svg className="animate-spin h-5 w-5 text-white dark:text-[black]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </span>
                  )}
                  {bookingStatus === 'submitting' && (
                    <span className="absolute inset-0 flex items-center justify-center bg-[#5fbfc0]">
                      <div className="flex items-center space-x-2">
                        <svg className="animate-spin h-5 w-5 text-white dark:text-[black]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="text-white dark:text-[black]">Booking your trip...</span>
                      </div>
                    </span>
                  )}
                  <span className={bookingStatus === 'loading' || bookingStatus === 'submitting' ? 'invisible' : ''}>
                    {isLoading ? 'Submitting...' : 'Request Ride'}
                  </span>
                </button>
              )}
            </div> {/* <-- Close the grid container here */}
          </form>

          {success && (
            <div className="bg-[#5fbfc0]/20 dark:bg-[#5fbfc0]/30 text-[black] dark:text-[white] p-4 rounded mb-6">
              <div className="flex items-center">
                <svg className="w-6 h-6 text-[#3B5B63] dark:text-[#5fbfc0] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span>Your trip request has been submitted successfully! It is pending dispatcher approval. Redirecting to your trips...</span>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </>
  );
}

// NOTE: Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in .env.local for LIVE deployments. Never hardcode keys here.