// seed.js - Script to seed some test trips in the database

const { createClient } = require('@supabase/supabase-js');

// Initialize the Supabase client with credentials from CLAUDE.md
const supabaseUrl = 'https://btzfgasugkycbavcwvnx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0emZnYXN1Z2t5Y2JhdmN3dm54Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2MzcwOTIsImV4cCI6MjA2MDIxMzA5Mn0.FQtQXKvkBLVtmCqShLyg_y9EDPrufyWQnbD8EE25zSU';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function seedTrips() {
  try {
    // You'll need to sign in to create sample trips
    console.log('Please provide your Supabase auth credentials:');
    const email = process.argv[2];
    const password = process.argv[3];
    
    if (!email || !password) {
      console.error('Usage: node seed.js your@email.com yourpassword');
      process.exit(1);
    }

    // Sign in with the provided credentials
    const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (signInError) {
      console.error('Error signing in:', signInError.message);
      process.exit(1);
    }

    console.log('Signed in as:', user.email);
    
    // Sample trip data
    const sampleTrips = [
      {
        user_id: user.id,
        pickup_address: '123 Main St, San Francisco, CA',
        destination_address: 'SF General Hospital, San Francisco, CA',
        pickup_time: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
        status: 'upcoming',
        driver_name: 'Michael Chen',
        vehicle: 'Tesla Model Y (White)',
        price: 28.50,
        special_requirements: 'Wheelchair accessible'
      },
      {
        user_id: user.id,
        pickup_address: '456 Market St, San Francisco, CA',
        destination_address: 'UCSF Medical Center, San Francisco, CA',
        pickup_time: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
        status: 'completed',
        driver_name: 'Sarah Johnson',
        vehicle: 'Toyota Prius (Blue)',
        price: 22.75,
        rating: 5
      },
      {
        user_id: user.id,
        pickup_address: '789 Mission St, San Francisco, CA',
        destination_address: 'Kaiser Permanente, San Francisco, CA',
        pickup_time: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
        status: 'cancelled',
        cancellation_reason: 'Driver unavailable',
        refund_status: 'Completed'
      },
      {
        user_id: user.id,
        pickup_address: '555 Howard St, San Francisco, CA',
        destination_address: 'Sequoia Hospital, Redwood City, CA',
        pickup_time: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // tomorrow
        status: 'upcoming',
        driver_name: 'James Wilson',
        vehicle: 'Honda Accord (Silver)',
        price: 35.00
      },
      {
        user_id: user.id,
        pickup_address: '1 Post St, San Francisco, CA',
        destination_address: 'Stanford Hospital, Palo Alto, CA',
        pickup_time: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour from now
        status: 'in_progress',
        driver_name: 'Lisa Garcia',
        vehicle: 'Ford Escape (Black)',
        price: 42.50
      }
    ];

    // Insert sample trips
    const { data, error } = await supabase
      .from('trips')
      .insert(sampleTrips)
      .select();

    if (error) {
      console.error('Error seeding trips:', error.message);
      process.exit(1);
    }

    console.log('Successfully seeded trips:', data.length);
    console.log('Trip IDs:', data.map(trip => trip.id).join(', '));
    
  } catch (err) {
    console.error('Unexpected error:', err.message);
    process.exit(1);
  }
}

seedTrips();