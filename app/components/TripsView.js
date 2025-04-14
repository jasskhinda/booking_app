'use client';

import { useState } from 'react';
import Link from 'next/link';
import DashboardLayout from './DashboardLayout';

export default function TripsView({ user, trips = [] }) {
  const [filter, setFilter] = useState('all'); // all, upcoming, completed, cancelled

  // Filter trips based on status
  const filteredTrips = trips.filter(trip => {
    if (filter === 'all') return true;
    return trip.status === filter;
  });

  // Mock data in case no trips exist yet
  const mockTrips = [
    {
      id: 'mock-1',
      pickup_address: '123 Main St, San Francisco, CA',
      destination_address: 'SF General Hospital, San Francisco, CA',
      pickup_time: new Date('2025-04-20T10:00:00').toISOString(),
      status: 'upcoming',
      driver_name: 'Michael Chen',
      vehicle: 'Tesla Model Y (White)',
      price: 28.50
    },
    {
      id: 'mock-2',
      pickup_address: '456 Market St, San Francisco, CA',
      destination_address: 'UCSF Medical Center, San Francisco, CA',
      pickup_time: new Date('2025-04-15T14:30:00').toISOString(),
      status: 'completed',
      driver_name: 'Sarah Johnson',
      vehicle: 'Toyota Prius (Blue)',
      price: 22.75,
      rating: 5
    },
    {
      id: 'mock-3',
      pickup_address: '789 Mission St, San Francisco, CA',
      destination_address: 'Kaiser Permanente, San Francisco, CA',
      pickup_time: new Date('2025-04-10T09:15:00').toISOString(),
      status: 'cancelled',
      cancellation_reason: 'Driver unavailable',
      refund_status: 'Completed'
    }
  ];

  // Use mock data if no real trips exist
  const displayTrips = trips.length > 0 ? filteredTrips : mockTrips;

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

  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  return (
    <DashboardLayout user={user} activeTab="trips">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Your Trips</h2>
          <Link 
            href="/dashboard/book" 
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
          >
            Book New Trip
          </Link>
        </div>

        {/* Filter tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
          <nav className="-mb-px flex space-x-6">
            <button
              onClick={() => setFilter('all')}
              className={`pb-3 px-1 ${filter === 'all' 
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400 font-medium' 
                : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('upcoming')}
              className={`pb-3 px-1 ${filter === 'upcoming' 
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400 font-medium' 
                : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`pb-3 px-1 ${filter === 'completed' 
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400 font-medium' 
                : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
            >
              Completed
            </button>
            <button
              onClick={() => setFilter('cancelled')}
              className={`pb-3 px-1 ${filter === 'cancelled' 
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400 font-medium' 
                : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
            >
              Cancelled
            </button>
          </nav>
        </div>

        {displayTrips.length === 0 ? (
          <div className="text-center py-12">
            <svg 
              className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor" 
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" 
              />
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" 
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium">No trips found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {trips.length === 0 
                ? "You haven't booked any trips yet." 
                : "No trips match the selected filter."}
            </p>
            <div className="mt-6">
              <Link
                href="/dashboard/book"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Book your first trip
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden">
            <div className="space-y-6">
              {displayTrips.map((trip) => (
                <div 
                  key={trip.id} 
                  className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row justify-between">
                    <div className="mb-2 sm:mb-0">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(trip.status)}`}>
                        {trip.status === 'upcoming' ? 'Upcoming' : 
                         trip.status === 'completed' ? 'Completed' : 
                         trip.status === 'in_progress' ? 'In Progress' : 'Cancelled'}
                      </span>
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(trip.pickup_time)}
                      </p>
                    </div>
                    {trip.status === 'completed' && (
                      <div className="flex items-center">
                        <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">Rating:</span>
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <svg 
                              key={i}
                              className={`h-4 w-4 ${i < (trip.rating || 0) ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-3 space-y-2">
                    <div>
                      <p className="text-sm font-medium">From</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{trip.pickup_address}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">To</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{trip.destination_address}</p>
                    </div>
                  </div>
                  
                  {trip.status === 'upcoming' && (
                    <div className="mt-4 flex justify-between">
                      <div>
                        <p className="text-sm font-medium">Driver</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{trip.driver_name || 'Not assigned yet'}</p>
                      </div>
                      <div className="flex space-x-2">
                        <Link
                          href={`/dashboard/trips/${trip.id}`}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
                        >
                          Details
                        </Link>
                        <button
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {trip.status === 'completed' && (
                    <div className="mt-4 flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium">Price</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">${trip.price?.toFixed(2) || 'N/A'}</p>
                      </div>
                      <Link
                        href={`/dashboard/trips/${trip.id}`}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
                      >
                        Details
                      </Link>
                    </div>
                  )}
                  
                  {trip.status === 'cancelled' && (
                    <div className="mt-4">
                      <p className="text-sm font-medium">Cancellation reason</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{trip.cancellation_reason || 'Not specified'}</p>
                      {trip.refund_status && (
                        <div className="mt-2">
                          <p className="text-sm font-medium">Refund status</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">{trip.refund_status}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}