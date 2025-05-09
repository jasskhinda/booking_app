// @ts-check
/**
 * This file contains setup code that runs before tests.
 * It can be used to create test users, seed test data, etc.
 */
const { test, expect } = require('@playwright/test');
const dotenv = require('dotenv');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load test environment variables
dotenv.config({ path: path.join(__dirname, '.env.test') });

/**
 * Helper function to create a test user if it doesn't exist
 */
async function setupTestUser() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase credentials in environment variables');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  const testEmail = process.env.TEST_USER_EMAIL;
  const testPassword = process.env.TEST_USER_PASSWORD;
  
  if (!testEmail || !testPassword) {
    console.error('Missing test user credentials in environment variables');
    return;
  }
  
  try {
    // Check if user already exists
    const { data: existingUsers, error: lookupError } = await supabase
      .from('users')
      .select('*')
      .eq('email', testEmail)
      .limit(1);
      
    if (lookupError) {
      throw lookupError;
    }
    
    if (existingUsers && existingUsers.length > 0) {
      console.log('Test user already exists, skipping creation');
      return;
    }
    
    // Create a new user with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          role: 'client',
          full_name: 'Test User',
        }
      }
    });
    
    if (error) {
      throw error;
    }
    
    console.log('Test user created successfully');
    
  } catch (error) {
    console.error('Error setting up test user:', error.message);
  }
}

// Only run setup once before all tests
test.beforeAll(async () => {
  await setupTestUser();
});