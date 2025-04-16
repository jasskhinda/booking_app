'use client';

import { useState, useEffect, useRef, useCallback, Fragment } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
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
  
  // Convert hours from 24-hour format to 12-hour format
  hours = hours % 12;
  hours = hours ? hours : 12; // "0" should be displayed as "12"
  
  // Format minutes to always have two digits
  const minutesStr = minutes.toString().padStart(2, '0');
  
  return `${hours}:${minutesStr} ${ampm}`;
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

export default function BookingForm({ user }) {
  const [formData, setFormData] = useState({
    pickupAddress: '',
    destinationAddress: '',
    pickupTime: '',
    wheelchairType: 'no_wheelchair',
    isRoundTrip: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [bookingStatus, setBookingStatus] = useState('idle'); // idle, loading, submitting, success, error
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  
  // Date/time picker state
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [currentView, setCurrentView] = useState('date'); // 'date' or 'time'
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableTimeSlots, setAvailableTimeSlots] = useState(generateTimeSlots());
  const datePickerRef = useRef(null);

  const router = useRouter();
  const supabase = createClientComponentClient();

  // Format datetime default value
  useEffect(() => {
    // Set default pickup time to 1 hour from now, rounded to nearest 15 minutes
    const now = new Date();
    now.setHours(now.getHours() + 1);
    now.setMinutes(Math.ceil(now.getMinutes() / 15) * 15);
    now.setSeconds(0);
    now.setMilliseconds(0);
    
    const formattedDate = now.toISOString().slice(0, 16); // Format: YYYY-MM-DDThh:mm
    setFormData(prev => ({ ...prev, pickupTime: formattedDate }));
    setSelectedDate(now);
  }, []);
  
  // Handle click outside date picker to close it
  useEffect(() => {
    function handleClickOutside(event) {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
        setIsDatePickerOpen(false);
      }
    }
    
    // Add event listener
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      // Remove event listener on cleanup
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [datePickerRef]);

  const mapRef = useRef(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [directionsRenderer, setDirectionsRenderer] = useState(null);
  const [pickupLocation, setPickupLocation] = useState(null);
  const [destinationLocation, setDestinationLocation] = useState(null);
  const [estimatedFare, setEstimatedFare] = useState(null);
  const [estimatedDuration, setEstimatedDuration] = useState(null);
  const [distanceMiles, setDistanceMiles] = useState(0);
  const [distanceMeters, setDistanceMeters] = useState(0);
  
  // Function to calculate route between two points and update the map
  const calculateRoute = useCallback((origin, destination) => {
    if (!origin || !destination || !mapInstance || !directionsRenderer) return;
    
    const directionsService = new window.google.maps.DirectionsService();
    
    directionsService.route({
      origin,
      destination,
      travelMode: window.google.maps.TravelMode.DRIVING,
    }, (result, status) => {
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
          
          // Calculate price using base price logic
          let basePrice = 50; // Base price

          // Round trip adjustment
          if (formData.isRoundTrip) {
            basePrice = 100;
          }
          
          // Mileage calculation ($3 per mile)
          basePrice += miles * 3;
          
          // Weekend adjustment
          const pickupDate = new Date(formData.pickupTime);
          const day = pickupDate.getDay();
          if (day === 0 || day === 6) { // Weekend (0 = Sunday, 6 = Saturday)
            basePrice += 40;
          }
          
          // Extra hour adjustment (before 8am or after 8pm)
          const hour = pickupDate.getHours();
          if (hour <= 8 || hour >= 20) {
            basePrice += 40;
          }
          
          // Set the price as an integer without the $ prefix
          const finalPrice = Math.round(basePrice);
          setEstimatedFare(finalPrice);
          setEstimatedDuration(duration);
        }
      } else {
        console.error('Error calculating route:', status);
      }
    });
  }, [mapInstance, directionsRenderer, formData.isRoundTrip, formData.pickupTime]);

  // References to PlaceAutocompleteElement containers
  const pickupAutocompleteContainerRef = useRef(null);
  const destinationAutocompleteContainerRef = useRef(null);
  
  // Initialize Google Maps
  useEffect(() => {
    if (!isGoogleLoaded || !mapRef.current) return;

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
    } catch (error) {
      console.error('Error initializing Google Maps:', error);
    }
  }, [isGoogleLoaded]);
  
  // References for autocomplete instances
  const pickupAutocompleteRef = useRef(null);
  const destinationAutocompleteRef = useRef(null);
  
  // Initialize traditional Places Autocomplete for input fields
  useEffect(() => {
    if (!isGoogleLoaded || 
        !window.google?.maps?.places?.Autocomplete ||
        !pickupAutocompleteContainerRef.current || 
        !destinationAutocompleteContainerRef.current) return;

    try {
      // Only initialize once to avoid losing focus
      if (!pickupAutocompleteContainerRef.current.firstChild && !destinationAutocompleteContainerRef.current.firstChild) {
        // Create traditional input fields for autocomplete
        const pickupInput = document.createElement('input');
        pickupInput.className = 'w-full px-3 py-2 border border-[#DDE5E7] dark:border-[#3F5E63] rounded-md shadow-sm focus:outline-none focus:ring-[#7CCFD0] focus:border-[#7CCFD0] dark:bg-[#1C2C2F]';
        pickupInput.placeholder = 'Enter your pickup location';
        pickupInput.value = formData.pickupAddress || '';
        pickupInput.id = 'pickup-autocomplete-input';
        
        const destinationInput = document.createElement('input');
        destinationInput.className = 'w-full px-3 py-2 border border-[#DDE5E7] dark:border-[#3F5E63] rounded-md shadow-sm focus:outline-none focus:ring-[#7CCFD0] focus:border-[#7CCFD0] dark:bg-[#1C2C2F]';
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
        
        // Add event listeners
        pickupAutocomplete.addListener('place_changed', () => {
          const place = pickupAutocomplete.getPlace();
          if (!place.geometry) return;
          
          const address = place.formatted_address || place.name || '';
          setFormData(prev => ({ ...prev, pickupAddress: address }));
          
          const location = {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng()
          };
          
          setPickupLocation(location);
          
          if (mapInstance) {
            mapInstance.setCenter(location);
            mapInstance.setZoom(15);
          }
        });
        
        destinationAutocomplete.addListener('place_changed', () => {
          const place = destinationAutocomplete.getPlace();
          if (!place.geometry) return;
          
          const address = place.formatted_address || place.name || '';
          setFormData(prev => ({ ...prev, destinationAddress: address }));
          
          const location = {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng()
          };
          
          setDestinationLocation(location);
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
      }
      
      // Update the input values when they change from elsewhere
      if (pickupAutocompleteContainerRef.current.firstChild && 
          pickupAutocompleteContainerRef.current.firstChild.value !== formData.pickupAddress) {
        pickupAutocompleteContainerRef.current.firstChild.value = formData.pickupAddress || '';
      }
      
      if (destinationAutocompleteContainerRef.current.firstChild &&
          destinationAutocompleteContainerRef.current.firstChild.value !== formData.destinationAddress) {
        destinationAutocompleteContainerRef.current.firstChild.value = formData.destinationAddress || '';
      }
      
    } catch (error) {
      console.error('Error initializing Places Autocomplete:', error);
    }
    
    // Cleanup function
    return () => {
      // Clean up autocomplete instances and event listeners on unmount
      if (pickupAutocompleteRef.current) {
        google.maps.event.clearInstanceListeners(pickupAutocompleteRef.current);
      }
      
      if (destinationAutocompleteRef.current) {
        google.maps.event.clearInstanceListeners(destinationAutocompleteRef.current);
      }
    };
  }, [isGoogleLoaded]);
  
  // Effect to calculate route when both locations are available
  useEffect(() => {
    if (pickupLocation && destinationLocation && mapInstance && directionsRenderer) {
      calculateRoute(pickupLocation, destinationLocation);
    }
  }, [pickupLocation, destinationLocation, mapInstance, directionsRenderer, calculateRoute, formData]);

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
  const handleTimeSelect = (timeSlot) => {
    const { hour, minute } = timeSlot.value;
    
    const newDate = new Date(selectedDate);
    newDate.setHours(hour, minute, 0, 0);
    
    const formattedDate = newDate.toISOString().slice(0, 16);
    setFormData(prev => ({
      ...prev,
      pickupTime: formattedDate
    }));
    
    // Close the date picker after selection
    setIsDatePickerOpen(false);
    setCurrentView('date'); // Reset to date view for next time
  };
  
  // Open the date/time picker
  const openDatePicker = () => {
    setIsDatePickerOpen(true);
    setCurrentView('date');
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
          status: 'pending', // Changed from 'upcoming' to 'pending'
          special_requirements: null,
          wheelchair_type: formData.wheelchairType,
          is_round_trip: formData.isRoundTrip,
          price: calculatedPrice, // Save estimated price
          distance: distanceMiles > 0 ? Math.round(distanceMiles * 10) / 10 : null, // Save distance in miles, rounded to 1 decimal
          created_at: new Date().toISOString(),
        }])
        .select();

      if (insertError) {
        throw insertError;
      }

      console.log('Trip booked successfully:', data);
      
      // Trip was created, show success immediately
      setSuccess(true);
      setBookingStatus('success');
      
      // Reset form
      setFormData({
        pickupAddress: '',
        destinationAddress: '',
        pickupTime: formData.pickupTime, // Keep the time
        wheelchairType: 'no_wheelchair',
        isRoundTrip: false,
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
    try {
      const notifyResponse = await fetch('/api/trips/notify-dispatchers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tripId }),
      });
      
      const notifyResult = await notifyResponse.json();
      
      if (!notifyResponse.ok) {
        console.error('Error notifying dispatchers:', notifyResult.error);
        // We don't block the user experience if notification fails
      } else {
        console.log('Dispatchers notified successfully');
      }
    } catch (notifyError) {
      console.error('Error in dispatcher notification:', notifyError);
      // Again, we don't block the user experience on notification errors
    }
  };

  return (
    <>
      {/* Load Google Maps JavaScript API with Places and Directions libraries */}
      <Script
        id="google-maps-script"
        strategy="lazyOnload"
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&callback=Function.prototype`}
        onLoad={() => {
          console.log('Google Maps script loaded');
          setIsGoogleLoaded(true);
        }}
      />

      <DashboardLayout user={user} activeTab="book">
        <div className="bg-[#F8F9FA] dark:bg-[#24393C] rounded-lg shadow-md border border-[#DDE5E7] dark:border-[#3F5E63] p-6 mb-6">
          <h2 className="text-xl font-semibold text-[#2E4F54] dark:text-[#E0F4F5] mb-4">Book a Ride</h2>
          
          {success ? (
            <div className="bg-[#7CCFD0]/20 dark:bg-[#7CCFD0]/30 text-[#2E4F54] dark:text-[#E0F4F5] p-4 rounded mb-6">
              <div className="flex items-center">
                <svg className="w-6 h-6 text-[#3B5B63] dark:text-[#7CCFD0] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span>Your trip request has been submitted successfully! It is pending dispatcher approval. Redirecting to your trips...</span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-100 dark:bg-red-900/30 text-[#FF4A4A] dark:text-[#FF7A7A] p-4 rounded">
                  {error}
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Pickup Address */}
                <div className="col-span-1 md:col-span-2">
                  <label htmlFor="pickupAddress" className="block text-sm font-medium text-[#2E4F54] dark:text-[#E0F4F5] mb-1">
                    Pickup Address
                  </label>
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
                
                {/* Destination Address */}
                <div className="col-span-1 md:col-span-2">
                  <label htmlFor="destinationAddress" className="block text-sm font-medium text-[#2E4F54] dark:text-[#E0F4F5] mb-1">
                    Destination Address
                  </label>
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
                
                {/* Pickup Date and Time - Popup Picker */}
                <div className="space-y-4">
                  <div>
                    <label htmlFor="pickupDateTime" className="block text-sm font-medium text-[#2E4F54] dark:text-[#E0F4F5] mb-1">
                      Pickup Date & Time
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        id="pickupDateTime"
                        onClick={openDatePicker}
                        className="w-full px-3 py-2 border border-[#DDE5E7] dark:border-[#3F5E63] rounded-md shadow-sm focus:outline-none focus:ring-[#7CCFD0] focus:border-[#7CCFD0] dark:bg-[#1C2C2F] text-left flex justify-between items-center"
                      >
                        <span className={formData.pickupTime ? "text-[#2E4F54] dark:text-[#E0F4F5]" : "text-[#2E4F54]/50 dark:text-[#E0F4F5]/50"}>
                          {formData.pickupTime 
                            ? `${formatMonthDay(formData.pickupTime)}, ${getDayName(formData.pickupTime)} - ${formatTimeAmPm(formData.pickupTime)}`
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
                          className="absolute z-50 mt-2 w-full bg-white dark:bg-[#1C2C2F] border border-[#DDE5E7] dark:border-[#3F5E63] rounded-md shadow-lg p-4"
                        >
                          {/* Header with back button for time view */}
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="text-[#2E4F54] dark:text-[#E0F4F5] font-medium">
                              {currentView === 'date' ? 'Select Date' : 'Select Time'}
                            </h4>
                            {currentView === 'time' && (
                              <button 
                                type="button"
                                onClick={() => setCurrentView('date')}
                                className="text-[#3B5B63] dark:text-[#84CED3] hover:text-[#7CCFD0] flex items-center text-sm"
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
                                        ? 'bg-[#7CCFD0]/20 border-[#7CCFD0] text-[#3B5B63] dark:text-[#E0F4F5]' 
                                        : 'border-[#DDE5E7] dark:border-[#3F5E63] hover:bg-[#F8F9FA] dark:hover:bg-[#24393C]'}
                                    `}
                                  >
                                    <span className="text-xs font-medium">{getDayName(date)}</span>
                                    <span className={`text-sm ${isToday ? 'font-bold' : ''}`}>{formatMonthDay(date)}</span>
                                    {isToday && <span className="text-xs text-[#7CCFD0] mt-1">Today</span>}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                          
                          {/* Time selection view */}
                          {currentView === 'time' && selectedDate && (
                            <div>
                              <div className="text-sm text-[#2E4F54]/70 dark:text-[#E0F4F5]/70 mb-2">
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
                                      className="p-2 rounded-md border border-[#DDE5E7] dark:border-[#3F5E63] hover:bg-[#7CCFD0]/10 text-center"
                                    >
                                      {slot.label}
                                    </button>
                                  );
                                })}
                              </div>
                              
                              <div className="text-xs text-[#2E4F54]/60 dark:text-[#E0F4F5]/60 mt-2 italic">
                                All times shown are in your local timezone
                              </div>
                            </div>
                          )}
                          
                          {/* Optional hint for future availability feature */}
                          <div className="mt-4 pt-2 border-t border-[#DDE5E7] dark:border-[#3F5E63] text-xs text-[#3B5B63] dark:text-[#84CED3]">
                            <p>Select a date and then choose an available time slot</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Wheelchair Type */}
                <div>
                  <label htmlFor="wheelchairType" className="block text-sm font-medium text-[#2E4F54] dark:text-[#E0F4F5] mb-1">
                    Wheelchair Requirements
                  </label>
                  <div className="relative">
                    <select
                      id="wheelchairType"
                      name="wheelchairType"
                      value={formData.wheelchairType}
                      onChange={handleChange}
                      className="w-full appearance-none px-3 py-2 border border-[#DDE5E7] dark:border-[#3F5E63] rounded-md shadow-sm focus:outline-none focus:ring-[#7CCFD0] focus:border-[#7CCFD0] dark:bg-[#1C2C2F] text-[#2E4F54] dark:text-[#E0F4F5] pr-10"
                    >
                      <option value="no_wheelchair">No Wheelchair</option>
                      <option value="wheelchair">Wheelchair</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#2E4F54] dark:text-[#E0F4F5]">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                      </svg>
                    </div>
                  </div>
                </div>
                
              </div>
              
              {/* Map display */}
              <div className="col-span-1 md:col-span-2 mt-4">
                <div 
                  ref={mapRef} 
                  className="w-full h-[300px] rounded-md border border-[#DDE5E7] dark:border-[#3F5E63]"
                ></div>
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
                    className="absolute block w-6 h-6 rounded-full bg-white border-4 border-[#DDE5E7] appearance-none cursor-pointer checked:right-0 checked:border-[#7CCFD0] transition-all duration-200 focus:outline-none"
                  />
                  <label 
                    htmlFor="isRoundTrip"
                    className={`block overflow-hidden h-6 rounded-full bg-[#DDE5E7] cursor-pointer ${formData.isRoundTrip ? 'bg-[#7CCFD0]' : ''}`}
                  ></label>
                </div>
                <label htmlFor="isRoundTrip" className="text-sm font-medium cursor-pointer">
                  Round Trip
                </label>
                {formData.isRoundTrip && (
                  <span className="ml-2 text-xs text-[#2E4F54] dark:text-[#7CCFD0]">
                    The vehicle will wait for you and take you back to your pickup location.
                  </span>
                )}
              </div>

              <div className="col-span-1 md:col-span-2 border-t border-[#DDE5E7] dark:border-[#3F5E63] pt-4">
                <h3 className="text-md font-medium text-[#2E4F54] dark:text-[#E0F4F5] mb-2">Ride Details</h3>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-[#2E4F54]/70 dark:text-[#E0F4F5]/70">Pickup Time</p>
                    {formData.pickupTime ? (
                      <p className="font-medium text-[#2E4F54] dark:text-[#E0F4F5]">
                        {new Date(formData.pickupTime).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric'
                        })}, {formatTimeAmPm(formData.pickupTime)}
                      </p>
                    ) : (
                      <p className="font-medium text-[#2E4F54]/50 dark:text-[#E0F4F5]/50">Select a time</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-[#2E4F54]/70 dark:text-[#E0F4F5]/70">Estimated Fare</p>
                    {pickupLocation && destinationLocation ? (
                      <p className="font-medium text-[#2E4F54] dark:text-[#E0F4F5]">
                        {estimatedFare ? `$${estimatedFare}`.replace('$$', '$') : 'Calculating...'}
                      </p>
                    ) : (
                      <p className="font-medium text-[#2E4F54]/50 dark:text-[#E0F4F5]/50">Enter addresses</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-[#2E4F54]/70 dark:text-[#E0F4F5]/70">Estimated Duration</p>
                    {pickupLocation && destinationLocation ? (
                      <p className="font-medium text-[#2E4F54] dark:text-[#E0F4F5]">{formData.isRoundTrip ? `${estimatedDuration} × 2` : estimatedDuration}</p>
                    ) : (
                      <p className="font-medium text-[#2E4F54]/50 dark:text-[#E0F4F5]/50">Enter addresses</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-[#2E4F54]/70 dark:text-[#E0F4F5]/70">Distance</p>
                    {pickupLocation && destinationLocation ? (
                      <p className="font-medium text-[#2E4F54] dark:text-[#E0F4F5]">{distanceMiles > 0 ? `${distanceMiles.toFixed(1)} miles` : 'Calculating...'}</p>
                    ) : (
                      <p className="font-medium text-[#2E4F54]/50 dark:text-[#E0F4F5]/50">Enter addresses</p>
                    )}
                  </div>
                </div>
                
                <div className="bg-[#7CCFD0]/10 dark:bg-[#7CCFD0]/20 p-3 rounded-md text-sm mb-4">
                  <p className="text-[#2E4F54] dark:text-[#E0F4F5]">
                    <strong>Note:</strong> Your ride request will be reviewed and approved by a dispatcher. Once approved, it will be assigned to a compassionate driver who specializes in supportive transportation.
                  </p>
                </div>
              </div>
              
              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-[#7CCFD0] hover:bg-[#60BFC0] text-white dark:text-[#1C2C2F] font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7CCFD0] disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
                >
                  {bookingStatus === 'loading' && (
                    <span className="absolute inset-0 flex items-center justify-center bg-[#7CCFD0]">
                      <svg className="animate-spin h-5 w-5 text-white dark:text-[#1C2C2F]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </span>
                  )}
                  {bookingStatus === 'submitting' && (
                    <span className="absolute inset-0 flex items-center justify-center bg-[#7CCFD0]">
                      <div className="flex items-center space-x-2">
                        <svg className="animate-spin h-5 w-5 text-white dark:text-[#1C2C2F]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="text-white dark:text-[#1C2C2F]">Booking your trip...</span>
                      </div>
                    </span>
                  )}
                  
                  <span className={bookingStatus === 'loading' || bookingStatus === 'submitting' ? 'invisible' : ''}>
                    {isLoading ? 'Submitting...' : 'Request Ride'}
                  </span>
                </button>
              </div>
            </form>
          )}
        </div>
      </DashboardLayout>
    </>
  );
}