import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

/**
 * Custom hook for real-time trip status updates
 * Listens for changes to trips table and updates local state
 */
export function useRealtimeTripUpdates(userId, trips, setTrips) {
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const supabase = createClientComponentClient();

  useEffect(() => {
    if (!userId) return;

    console.log('🔄 Setting up real-time trip updates for user:', userId);

    // Subscribe to changes in the trips table for this user
    const channel = supabase
      .channel('trip-updates')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'trips',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('🔔 Real-time trip update received:', payload);
          
          const { eventType, new: newRecord, old: oldRecord } = payload;
          
          if (eventType === 'UPDATE' && newRecord) {
            // Update the specific trip in the trips array
            setTrips(currentTrips => {
              const updatedTrips = currentTrips.map(trip => {
                if (trip.id === newRecord.id) {
                  const updatedTrip = { ...trip, ...newRecord };
                  
                  // Show user notification for important status changes
                  if (trip.status !== newRecord.status) {
                    console.log(`🎉 Trip ${trip.id.substring(0, 8)} status changed: ${trip.status} → ${newRecord.status}`);
                    
                    // You can add toast notifications here
                    if (newRecord.status === 'upcoming') {
                      console.log('✅ Trip approved! Payment will be processed.');
                    } else if (newRecord.status === 'cancelled') {
                      console.log('❌ Trip was cancelled.');
                    } else if (newRecord.status === 'completed') {
                      console.log('🎉 Trip completed successfully!');
                    }
                  }
                  
                  // Show payment status notifications
                  if (trip.payment_status !== newRecord.payment_status) {
                    console.log(`💳 Payment status changed: ${trip.payment_status} → ${newRecord.payment_status}`);
                    
                    if (newRecord.payment_status === 'paid') {
                      console.log('✅ Payment processed successfully!');
                    } else if (newRecord.payment_status === 'failed') {
                      console.log('❌ Payment failed. Please check your payment method.');
                    }
                  }
                  
                  return updatedTrip;
                }
                return trip;
              });
              
              return updatedTrips;
            });
          } else if (eventType === 'INSERT' && newRecord) {
            // Add new trip to the array
            setTrips(currentTrips => [newRecord, ...currentTrips]);
            console.log('➕ New trip added:', newRecord.id);
          } else if (eventType === 'DELETE' && oldRecord) {
            // Remove deleted trip from the array
            setTrips(currentTrips => currentTrips.filter(trip => trip.id !== oldRecord.id));
            console.log('🗑️ Trip deleted:', oldRecord.id);
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Real-time subscription status:', status);
        setConnectionStatus(status);
      });

    // Cleanup subscription on unmount
    return () => {
      console.log('🔌 Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [userId, setTrips, supabase]);

  return { connectionStatus };
}

/**
 * Utility function to poll for trip status updates
 * Useful as a fallback when real-time doesn't work
 */
export function useTripStatusPolling(tripId, onUpdate, intervalMs = 30000) {
  useEffect(() => {
    if (!tripId || !onUpdate) return;

    let intervalId;
    
    const pollTripStatus = async () => {
      try {
        const response = await fetch(`/api/trips/status-update?tripId=${tripId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.trip) {
            onUpdate(data.trip);
          }
        }
      } catch (error) {
        console.error('Error polling trip status:', error);
      }
    };

    // Poll immediately, then at intervals
    pollTripStatus();
    intervalId = setInterval(pollTripStatus, intervalMs);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [tripId, onUpdate, intervalMs]);
}

/**
 * Hook to show user-friendly status messages
 */
export function useStatusMessages() {
  const [messages, setMessages] = useState([]);

  const addMessage = (message, type = 'info') => {
    const id = Date.now();
    const newMessage = { id, message, type, timestamp: new Date() };
    
    setMessages(prev => [...prev, newMessage]);

    // Auto-remove message after 5 seconds
    setTimeout(() => {
      setMessages(prev => prev.filter(msg => msg.id !== id));
    }, 5000);
  };

  const removeMessage = (id) => {
    setMessages(prev => prev.filter(msg => msg.id !== id));
  };

  return {
    messages,
    addMessage,
    removeMessage
  };
}
