'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import DashboardLayout from './DashboardLayout';

export default function ProfileForm({ user, profile = {} }) {
  const supabase = createClientComponentClient();
  const [formData, setFormData] = useState({
    full_name: '',
    phone_number: '',
    address: '',
    accessibility_needs: '',
    medical_requirements: '',
    emergency_contact: '',
    preferred_payment_method: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Initialize form data with profile data
  useEffect(() => {
    if (profile) {
      setFormData(prevData => ({
        ...prevData,
        full_name: profile.full_name || user?.user_metadata?.full_name || '',
        phone_number: profile.phone_number || '',
        address: profile.address || '',
        accessibility_needs: profile.accessibility_needs || '',
        medical_requirements: profile.medical_requirements || '',
        emergency_contact: profile.emergency_contact || '',
        preferred_payment_method: profile.preferred_payment_method || '',
      }));
    }
  }, [profile, user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ text: '', type: '' });

    try {
      // Update profile in Supabase
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          ...formData,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        throw error;
      }

      // Update user metadata if full_name changed
      if (formData.full_name !== user?.user_metadata?.full_name) {
        const { error: metadataError } = await supabase.auth.updateUser({
          data: { full_name: formData.full_name }
        });

        if (metadataError) {
          console.warn('Failed to update user metadata, but profile was saved:', metadataError);
        }
      }

      setMessage({ 
        text: 'Profile updated successfully!', 
        type: 'success' 
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ 
        text: error.message || 'Failed to update profile. Please try again.', 
        type: 'error' 
      });
    } finally {
      setIsLoading(false);
      
      // Clear success message after 3 seconds
      if (message.type === 'success') {
        setTimeout(() => {
          setMessage({ text: '', type: '' });
        }, 3000);
      }
    }
  };

  return (
    <DashboardLayout user={user} activeTab="settings">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-6">Account Settings</h2>
        
        {message.text && (
          <div className={`p-4 mb-6 rounded-md ${
            message.type === 'success' 
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
          }`}>
            {message.text}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Personal Information Section */}
            <div>
              <h3 className="text-lg font-medium mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Full Name
                  </label>
                  <input
                    id="full_name"
                    name="full_name"
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
                  />
                </div>
                
                <div>
                  <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    id="phone_number"
                    name="phone_number"
                    type="tel"
                    value={formData.phone_number}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Address
                  </label>
                  <input
                    id="address"
                    name="address"
                    type="text"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label htmlFor="emergency_contact" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Emergency Contact (Name & Phone)
                  </label>
                  <input
                    id="emergency_contact"
                    name="emergency_contact"
                    type="text"
                    value={formData.emergency_contact}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
                  />
                </div>
              </div>
            </div>
            
            {/* Special Requirements Section */}
            <div>
              <h3 className="text-lg font-medium mb-4">Special Requirements</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label htmlFor="accessibility_needs" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Accessibility Needs
                  </label>
                  <textarea
                    id="accessibility_needs"
                    name="accessibility_needs"
                    rows={3}
                    value={formData.accessibility_needs}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
                    placeholder="e.g., Wheelchair accessible, Assistance getting in/out of vehicle"
                  ></textarea>
                </div>
                
                <div className="md:col-span-2">
                  <label htmlFor="medical_requirements" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Medical Requirements
                  </label>
                  <textarea
                    id="medical_requirements"
                    name="medical_requirements"
                    rows={3}
                    value={formData.medical_requirements}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
                    placeholder="e.g., Oxygen tank, Medical equipment storage"
                  ></textarea>
                </div>
              </div>
            </div>
            
            {/* Payment Preferences */}
            <div>
              <h3 className="text-lg font-medium mb-4">Payment Preferences</h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="preferred_payment_method" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Preferred Payment Method Type
                  </label>
                  <select
                    id="preferred_payment_method"
                    name="preferred_payment_method"
                    value={formData.preferred_payment_method}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
                  >
                    <option value="">Select a payment method</option>
                    <option value="credit_card">Credit Card</option>
                    <option value="debit_card">Debit Card</option>
                    <option value="paypal">PayPal</option>
                    <option value="apple_pay">Apple Pay</option>
                    <option value="google_pay">Google Pay</option>
                    <option value="insurance">Insurance</option>
                    <option value="medicare">Medicare</option>
                    <option value="medicaid">Medicaid</option>
                  </select>
                </div>
                
                <div className="mt-2">
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                    Manage your payment cards for automatic billing
                  </p>
                  <Link
                    href="/dashboard/payment-methods"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                  >
                    <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    Manage Payment Methods
                  </Link>
                </div>
              </div>
            </div>
            
            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
      
      {/* Account Section */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-medium mb-4">Account Information</h3>
        <div className="mb-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">Email</div>
          <div className="font-medium">{user.email}</div>
        </div>
        
        <div className="border-t pt-4 mt-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Password</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            You can update your password from the change password page.
          </p>
          <a
            href="/update-password"
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            Change Password
          </a>
        </div>
      </div>
    </DashboardLayout>
  );
}