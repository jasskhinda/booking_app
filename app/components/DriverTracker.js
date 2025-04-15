'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import DashboardLayout from './DashboardLayout';

export default function DriverTracker({ trip, driverLocation, user }) {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [eta, setEta] = useState(null);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    }).format(date);
  };
  
  // Load the Google Maps script
  useEffect(() => {
    // Function to load the Google Maps API
    const loadGoogleMapsScript = () => {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        setMapLoaded(true);
      };
      document.head.appendChild(script);
      return () => {
        document.head.removeChild(script);
      };
    };

    // Check if Google Maps API is already loaded
    if (!window.google) {
      loadGoogleMapsScript();
    } else {
      setMapLoaded(true);
    }
  }, []);
  
  // Initialize the map and markers
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    
    const { latitude, longitude } = driverLocation;
    const pickupLocation = { lat: latitude, lng: longitude };
    
    // Create map
    const mapInstance = new window.google.maps.Map(mapRef.current, {
      center: pickupLocation,
      zoom: 14,
      disableDefaultUI: true,
      zoomControl: true,
      mapTypeControl: false,
      scrollwheel: true,
      streetViewControl: false,
      fullscreenControl: true,
    });
    
    mapInstanceRef.current = mapInstance;
    
    // Create driver marker
    const driverMarker = new window.google.maps.Marker({
      position: pickupLocation,
      map: mapInstance,
      title: trip.driver_name || 'Driver',
      icon: {
        url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png', // Blue marker for driver
        scaledSize: new window.google.maps.Size(40, 40),
      },
      animation: window.google.maps.Animation.DROP,
    });
    
    markerRef.current = driverMarker;
    
    // Create info window
    const infoWindow = new window.google.maps.InfoWindow({
      content: `<div>
        <strong>${trip.driver_name || 'Driver'}</strong><br>
        ${trip.vehicle || 'Vehicle information unavailable'}
      </div>`,
    });
    
    // Open info window when marker is clicked
    driverMarker.addListener('click', () => {
      infoWindow.open(mapInstance, driverMarker);
    });
    
    // Create destination marker
    if (trip.destination_address) {
      // In a real app, we would geocode the address to get coordinates
      // For this demo, we'll place the destination marker a bit away from the driver
      const destinationLocation = {
        lat: pickupLocation.lat + 0.01,
        lng: pickupLocation.lng + 0.01,
      };
      
      const destinationMarker = new window.google.maps.Marker({
        position: destinationLocation,
        map: mapInstance,
        title: 'Destination',
        icon: {
          url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png', // Red marker for destination
          scaledSize: new window.google.maps.Size(40, 40),
        },
      });
      
      // Create route between driver and destination
      const directionsService = new window.google.maps.DirectionsService();
      const directionsRenderer = new window.google.maps.DirectionsRenderer({
        map: mapInstance,
        suppressMarkers: true, // Don't show default markers
        polylineOptions: {
          strokeColor: '#4285F4', // Google blue
          strokeWeight: 5,
          strokeOpacity: 0.8,
        },
      });
      
      directionsService.route(
        {
          origin: pickupLocation,
          destination: destinationLocation,
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === 'OK') {
            directionsRenderer.setDirections(result);
            
            // Set ETA based on route duration
            if (result.routes && result.routes.length > 0 && 
                result.routes[0].legs && result.routes[0].legs.length > 0) {
              const durationText = result.routes[0].legs[0].duration.text;
              setEta(durationText);
            }
          }
        }
      );
      
      // Adjust map bounds to show both markers
      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend(pickupLocation);
      bounds.extend(destinationLocation);
      mapInstance.fitBounds(bounds);
    }
    
    // Simulate driver movement every 10 seconds
    const interval = setInterval(() => {
      if (markerRef.current) {
        const newPosition = {
          lat: markerRef.current.getPosition().lat() + (Math.random() * 0.002 - 0.001),
          lng: markerRef.current.getPosition().lng() + (Math.random() * 0.002 - 0.001),
        };
        
        markerRef.current.setPosition(newPosition);
      }
    }, 10000);
    
    return () => {
      clearInterval(interval);
    };
  }, [mapLoaded, driverLocation, trip]);

  return (
    <DashboardLayout user={user} activeTab="trips">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Track Your Ride</h2>
          <Link 
            href="/dashboard/trips" 
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Back to Trips
          </Link>
        </div>
        
        {/* Trip Details */}
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">From</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">{trip.pickup_address}</p>
            </div>
            <div>
              <p className="text-sm font-medium">To</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">{trip.destination_address}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Driver</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">{trip.driver_name || 'Not assigned yet'}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Vehicle</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">{trip.vehicle || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Pickup Time</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">{formatDate(trip.pickup_time)}</p>
            </div>
            {eta && (
              <div>
                <p className="text-sm font-medium">Estimated Arrival</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">{eta}</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Live Map */}
        <div>
          <h3 className="text-lg font-medium mb-3">Live Location</h3>
          <div 
            ref={mapRef} 
            className="w-full h-96 rounded-lg shadow-inner mb-4"
            style={{ background: '#e5e7eb' }} // Placeholder color until map loads
          >
            {!mapLoaded && (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500 dark:text-gray-400">Loading map...</p>
              </div>
            )}
          </div>
          
          <div className="text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center mb-2">
              <div className="w-4 h-4 rounded-full bg-blue-500 mr-2"></div>
              <span>Driver Location</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-red-500 mr-2"></div>
              <span>Your Destination</span>
            </div>
          </div>
          
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Last updated: {new Date(driverLocation.lastUpdated).toLocaleTimeString()}
          </p>
        </div>
        
        {/* Contact Driver Button */}
        <div className="mt-6">
          <button
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            Contact Driver
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}