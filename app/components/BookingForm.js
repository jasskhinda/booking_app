'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import DashboardLayout from './DashboardLayout';
import Script from 'next/script';

export default function BookingForm({ user }) {
  const [formData, setFormData] = useState({
    pickupAddress: '',
    destinationAddress: '',
    pickupTime: '',
    specialRequirements: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);

  const router = useRouter();
  const supabase = createClientComponentClient();

  // Format datetime-local default value
  useEffect(() => {
    // Set default pickup time to 1 hour from now, rounded to nearest 15 minutes
    const now = new Date();
    now.setHours(now.getHours() + 1);
    now.setMinutes(Math.ceil(now.getMinutes() / 15) * 15);
    now.setSeconds(0);
    now.setMilliseconds(0);
    
    const formattedDate = now.toISOString().slice(0, 16); // Format: YYYY-MM-DDThh:mm
    setFormData(prev => ({ ...prev, pickupTime: formattedDate }));
  }, []);

  const mapRef = useRef(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [directionsRenderer, setDirectionsRenderer] = useState(null);
  const [pickupLocation, setPickupLocation] = useState(null);
  const [destinationLocation, setDestinationLocation] = useState(null);
  const [estimatedFare, setEstimatedFare] = useState('$25-35');
  const [estimatedDuration, setEstimatedDuration] = useState('25-35 min');
  
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
          const distance = route.legs[0].distance.text;
          const duration = route.legs[0].duration.text;
          
          // Simple fare calculation based on distance and duration
          const distanceValue = route.legs[0].distance.value; // in meters
          const durationValue = route.legs[0].duration.value; // in seconds
          
          const baseFare = 5;
          const distanceFare = (distanceValue / 1000) * 1.5; // $1.50 per km
          const durationFare = (durationValue / 60) * 0.5; // $0.50 per minute
          
          const estimatedTotal = baseFare + distanceFare + durationFare;
          const roundedLower = Math.floor(estimatedTotal);
          const roundedUpper = Math.ceil(estimatedTotal + 5); // Add a small buffer
          
          setEstimatedFare(`$${roundedLower}-${roundedUpper}`);
          setEstimatedDuration(duration);
        }
      } else {
        console.error('Error calculating route:', status);
      }
    });
  }, [mapInstance, directionsRenderer]);

  // References to PlaceAutocompleteElement containers
  const pickupAutocompleteContainerRef = useRef(null);
  const destinationAutocompleteContainerRef = useRef(null);
  
  // Initialize Google Maps
  useEffect(() => {
    if (!isGoogleLoaded || !mapRef.current) return;

    try {
      // Initialize Map
      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: 37.7749, lng: -122.4194 }, // Default to San Francisco
        zoom: 12,
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
        pickupInput.className = 'w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800';
        pickupInput.placeholder = 'Enter your pickup location';
        pickupInput.value = formData.pickupAddress || '';
        pickupInput.id = 'pickup-autocomplete-input';
        
        const destinationInput = document.createElement('input');
        destinationInput.className = 'w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800';
        destinationInput.placeholder = 'Enter your destination';
        destinationInput.value = formData.destinationAddress || '';
        destinationInput.id = 'destination-autocomplete-input';
        
        // Append inputs to container
        pickupAutocompleteContainerRef.current.appendChild(pickupInput);
        destinationAutocompleteContainerRef.current.appendChild(destinationInput);
        
        // Initialize traditional Google Places Autocomplete
        const pickupAutocomplete = new window.google.maps.places.Autocomplete(pickupInput, {
          fields: ['formatted_address', 'geometry', 'name', 'place_id'],
          componentRestrictions: { country: 'us' }
        });
        
        const destinationAutocomplete = new window.google.maps.places.Autocomplete(destinationInput, {
          fields: ['formatted_address', 'geometry', 'name', 'place_id'],
          componentRestrictions: { country: 'us' }
        });
        
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
  }, [pickupLocation, destinationLocation, mapInstance, directionsRenderer, calculateRoute]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
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
      return;
    }

    if (!destinationAddressValue) {
      setError('Please enter a destination address');
      setIsLoading(false);
      return;
    }

    const pickupTime = new Date(formData.pickupTime);
    const now = new Date();
    
    if (pickupTime <= now) {
      setError('Pickup time must be in the future');
      setIsLoading(false);
      return;
    }

    try {
      // Insert the trip into the database
      const { data, error: insertError } = await supabase
        .from('trips')
        .insert([{
          user_id: user.id,
          pickup_address: pickupAddressValue,
          destination_address: destinationAddressValue,
          pickup_time: formData.pickupTime,
          status: 'upcoming',
          special_requirements: formData.specialRequirements,
          created_at: new Date().toISOString(),
        }])
        .select();

      if (insertError) {
        throw insertError;
      }

      console.log('Trip booked successfully:', data);
      setSuccess(true);
      
      // Reset form
      setFormData({
        pickupAddress: '',
        destinationAddress: '',
        pickupTime: formData.pickupTime, // Keep the time
        specialRequirements: '',
      });

      // Redirect to trips page after a short delay
      setTimeout(() => {
        router.push('/dashboard/trips');
      }, 2000);
    } catch (error) {
      console.error('Error booking trip:', error);
      setError(error.message || 'Failed to book trip. Please try again.');
    } finally {
      setIsLoading(false);
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
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Book a Ride</h2>
          
          {success ? (
            <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 p-4 rounded mb-6">
              Your trip has been booked successfully! Redirecting to your trips...
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 p-4 rounded">
                  {error}
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Pickup Address */}
                <div className="col-span-1 md:col-span-2">
                  <label htmlFor="pickupAddress" className="block text-sm font-medium mb-1">
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
                  <label htmlFor="destinationAddress" className="block text-sm font-medium mb-1">
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
                
                {/* Pickup Time */}
                <div>
                  <label htmlFor="pickupTime" className="block text-sm font-medium mb-1">
                    Pickup Time
                  </label>
                  <input
                    id="pickupTime"
                    name="pickupTime"
                    type="datetime-local"
                    required
                    value={formData.pickupTime}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800"
                  />
                </div>
                
                {/* Special Requirements */}
                <div>
                  <label htmlFor="specialRequirements" className="block text-sm font-medium mb-1">
                    Special Requirements <span className="text-xs text-gray-500">(Optional)</span>
                  </label>
                  <select
                    id="specialRequirements"
                    name="specialRequirements"
                    value={formData.specialRequirements}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800"
                  >
                    <option value="">None</option>
                    <option value="wheelchair">Wheelchair Accessible</option>
                    <option value="assistance">Assistance Required</option>
                    <option value="service_animal">Service Animal</option>
                    <option value="child_seat">Child Seat</option>
                    <option value="extra_space">Extra Space</option>
                  </select>
                </div>
              </div>
              
              {/* Map display */}
              <div className="col-span-1 md:col-span-2 mt-4">
                <div 
                  ref={mapRef} 
                  className="w-full h-[300px] rounded-md border border-gray-300 dark:border-gray-700"
                ></div>
              </div>
              
              <div className="col-span-1 md:col-span-2 border-t border-gray-200 dark:border-gray-700 pt-4">
                <h3 className="text-md font-medium mb-2">Ride Details</h3>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Estimated Fare</p>
                    <p className="font-medium">{estimatedFare}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Estimated Duration</p>
                    <p className="font-medium">{estimatedDuration}</p>
                  </div>
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md text-sm mb-4">
                  <p className="text-blue-700 dark:text-blue-300">
                    <strong>Note:</strong> Your ride will be assigned to a compassionate driver who specializes in supportive transportation.
                  </p>
                </div>
              </div>
              
              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Booking...' : 'Book Ride'}
                </button>
              </div>
            </form>
          )}
        </div>
      </DashboardLayout>
    </>
  );
}