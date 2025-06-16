'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import DashboardLayout from './DashboardLayout';

export default function ProfileForm({ user, profile = {} }) {
  const supabase = createClientComponentClient();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
    address: '',
    accessibility_needs: '',
    medical_requirements: '',
    emergency_contact: '',
    preferred_payment_method: '',
    is_veteran: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [defaultPaymentMethod, setDefaultPaymentMethod] = useState(null);
  const [loadingPaymentMethod, setLoadingPaymentMethod] = useState(true);

  // Initialize form data with profile data
  useEffect(() => {
    if (profile) {
      // Splitting full name into first and last name if we have it but not individual fields
      let firstName = profile.first_name;
      let lastName = profile.last_name;
      
      if ((!firstName || !lastName) && profile.full_name) {
        const nameParts = profile.full_name.split(' ');
        firstName = nameParts[0] || '';
        lastName = nameParts.slice(1).join(' ') || '';
      }
      
      setFormData(prevData => ({
        ...prevData,
        first_name: firstName || '',
        last_name: lastName || '',
        phone_number: profile.phone_number || '',
        address: profile.address || '',
        accessibility_needs: profile.accessibility_needs || '',
        medical_requirements: profile.medical_requirements || '',
        emergency_contact: profile.emergency_contact || '',
        preferred_payment_method: profile.preferred_payment_method || '',
        is_veteran: profile.is_veteran || false,
      }));
    }
    
    // Fetch default payment method
    fetchDefaultPaymentMethod();
  }, [profile, user]);

  // Function to fetch the default payment method
  const fetchDefaultPaymentMethod = async () => {
    setLoadingPaymentMethod(true);
    try {
      const response = await fetch('/api/stripe/payment-methods');
      const data = await response.json();
      
      if (response.ok && data.paymentMethods && data.paymentMethods.length > 0) {
        // Find the default payment method or use the first one
        const defaultMethod = data.paymentMethods.find(method => 
          method.id === profile?.default_payment_method_id
        ) || data.paymentMethods[0];
        
        setDefaultPaymentMethod(defaultMethod);
      } else {
        setDefaultPaymentMethod(null);
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      setDefaultPaymentMethod(null);
    } finally {
      setLoadingPaymentMethod(false);
    }
  };

  // Helper functions for payment method display
  const formatCardNumber = (last4) => {
    return `•••• •••• •••• ${last4}`;
  };

  const formatExpiry = (month, year) => {
    return `${month.toString().padStart(2, '0')}/${year.toString().slice(-2)}`;
  };

  const getCardBrandLogo = (brand) => {
    switch (brand.toLowerCase()) {
      case 'visa':
        return '💳';
      case 'mastercard':
        return '💳';
      case 'amex':
        return '💳';
      case 'discover':
        return '💳';
      default:
        return '💳';
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prevData => ({ 
      ...prevData, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ text: '', type: '' });

    try {
      // Debug log to see what data we're sending
      console.log('Updating profile with data:', {
        id: user.id,
        ...formData,
        updated_at: new Date().toISOString()
      });
      
      // Update profile in Supabase - only include fields that exist in the profiles table
      const profileData = {
        id: user.id,
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone_number: formData.phone_number,
        address: formData.address,
        accessibility_needs: formData.accessibility_needs,
        medical_requirements: formData.medical_requirements,
        emergency_contact: formData.emergency_contact,
        preferred_payment_method: formData.preferred_payment_method,
        is_veteran: formData.is_veteran,
        updated_at: new Date().toISOString()
      };
      
      console.log('Current user ID:', user.id);
      
      // Try getting the profile first to see if we're updating or inserting
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();
      
      let error;
      
      if (existingProfile) {
        console.log('Updating existing profile');
        const result = await supabase
          .from('profiles')
          .update(profileData)
          .eq('id', user.id);
        
        error = result.error;
      } else {
        console.log('Inserting new profile');
        const result = await supabase
          .from('profiles')
          .insert(profileData);
        
        error = result.error;
      }

      if (error) {
        console.error('Supabase error details:', error);
        throw error;
      }

      // Update user metadata with first name and last name
      const fullName = `${formData.first_name} ${formData.last_name}`.trim();
      if (fullName !== `${user?.user_metadata?.first_name || ''} ${user?.user_metadata?.last_name || ''}`.trim()) {
        const { error: metadataError } = await supabase.auth.updateUser({
          data: { 
            first_name: formData.first_name,
            last_name: formData.last_name
          }
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
      <div className="bg-[#F8F9FA] dark:bg-[#1A1A1A] rounded-lg shadow-md border border-[#DDE5E7] dark:border-[#333333] p-6 mb-6">
        <h2 className="text-xl font-semibold text-[black] dark:text-[white] mb-6">Account Settings</h2>
        
        {message.text && (
          <div className={`p-4 mb-6 rounded-md ${
            message.type === 'success' 
              ? 'bg-[#5fbfc0]/20 text-[black] dark:bg-[#5fbfc0]/30 dark:text-[white]' 
              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
          }`}>
            {message.text}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Personal Information Section */}
            <div>
              <h3 className="text-lg font-medium text-[black] dark:text-[white] mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="first_name" className="block text-sm font-medium text-[black] dark:text-[white] mb-1">
                    First Name
                  </label>
                  <input
                    id="first_name"
                    name="first_name"
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={handleChange}
                    className="w-full p-2 border border-[#DDE5E7] dark:border-[#333333] rounded-md dark:bg-[black] text-[black] dark:text-[white]"
                  />
                </div>
                
                <div>
                  <label htmlFor="last_name" className="block text-sm font-medium text-[black] dark:text-[white] mb-1">
                    Last Name
                  </label>
                  <input
                    id="last_name"
                    name="last_name"
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={handleChange}
                    className="w-full p-2 border border-[#DDE5E7] dark:border-[#333333] rounded-md dark:bg-[black] text-[black] dark:text-[white]"
                  />
                </div>
                
                <div>
                  <label htmlFor="phone_number" className="block text-sm font-medium text-[black] dark:text-[white] mb-1">
                    Phone Number
                  </label>
                  <input
                    id="phone_number"
                    name="phone_number"
                    type="tel"
                    value={formData.phone_number}
                    onChange={handleChange}
                    className="w-full p-2 border border-[#DDE5E7] dark:border-[#333333] rounded-md dark:bg-[black] text-[black] dark:text-[white]"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label htmlFor="address" className="block text-sm font-medium text-[black] dark:text-[white] mb-1">
                    Address
                  </label>
                  <input
                    id="address"
                    name="address"
                    type="text"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full p-2 border border-[#DDE5E7] dark:border-[#333333] rounded-md dark:bg-[black] text-[black] dark:text-[white]"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label htmlFor="emergency_contact" className="block text-sm font-medium text-[black] dark:text-[white] mb-1">
                    Emergency Contact (Name & Phone)
                  </label>
                  <input
                    id="emergency_contact"
                    name="emergency_contact"
                    type="text"
                    value={formData.emergency_contact}
                    onChange={handleChange}
                    className="w-full p-2 border border-[#DDE5E7] dark:border-[#333333] rounded-md dark:bg-[black] text-[black] dark:text-[white]"
                  />
                </div>
                
                <div className="md:col-span-2 flex items-center pt-2">
                  <input
                    id="is_veteran"
                    name="is_veteran"
                    type="checkbox"
                    checked={formData.is_veteran}
                    onChange={handleChange}
                    className="h-4 w-4 text-[#5fbfc0] focus:ring-[#5fbfc0] border-[#DDE5E7] dark:border-[#333333] rounded dark:bg-[black] dark:checked:bg-[#5fbfc0]"
                  />
                  <label htmlFor="is_veteran" className="ml-2 block text-sm font-medium text-[black] dark:text-[white]">
                    I am a veteran
                  </label>
                </div>
              </div>
            </div>
            
            {/* Special Requirements Section */}
            <div>
              <h3 className="text-lg font-medium text-[black] dark:text-[white] mb-4">Special Requirements</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label htmlFor="accessibility_needs" className="block text-sm font-medium text-[black] dark:text-[white] mb-1">
                    Accessibility Needs
                  </label>
                  <textarea
                    id="accessibility_needs"
                    name="accessibility_needs"
                    rows={3}
                    value={formData.accessibility_needs}
                    onChange={handleChange}
                    className="w-full p-2 border border-[#DDE5E7] dark:border-[#333333] rounded-md dark:bg-[black] text-[black] dark:text-[white]"
                    placeholder="e.g., Wheelchair accessible, Assistance getting in/out of vehicle"
                  ></textarea>
                </div>
                
                <div className="md:col-span-2">
                  <label htmlFor="medical_requirements" className="block text-sm font-medium text-[black] dark:text-[white] mb-1">
                    Medical Requirements
                  </label>
                  <textarea
                    id="medical_requirements"
                    name="medical_requirements"
                    rows={3}
                    value={formData.medical_requirements}
                    onChange={handleChange}
                    className="w-full p-2 border border-[#DDE5E7] dark:border-[#333333] rounded-md dark:bg-[black] text-[black] dark:text-[white]"
                    placeholder="e.g., Oxygen tank, Medical equipment storage"
                  ></textarea>
                </div>
              </div>
            </div>
            
            {/* Payment Preferences */}
            <div>
              <h3 className="text-lg font-medium text-[black] dark:text-[white] mb-4">Payment Preferences</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[black] dark:text-[white] mb-2">
                    Default Payment Method
                  </label>
                  
                  {loadingPaymentMethod ? (
                    <div className="flex items-center p-3 border border-[#DDE5E7] dark:border-[#333333] rounded-md bg-[#F8F9FA] dark:bg-[#1A1A1A]">
                      <svg className="animate-spin h-4 w-4 text-[#5fbfc0] mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="text-sm text-[black]/70 dark:text-[white]/70">Loading payment method...</span>
                    </div>
                  ) : defaultPaymentMethod ? (
                    <div className="flex items-center justify-between p-3 border border-[#DDE5E7] dark:border-[#333333] rounded-md bg-[#F8F9FA] dark:bg-[#1A1A1A]">
                      <div className="flex items-center space-x-3">
                        <div className="text-xl">{getCardBrandLogo(defaultPaymentMethod.card.brand)}</div>
                        <div>
                          <p className="font-medium text-[black] dark:text-[white] text-sm">
                            {formatCardNumber(defaultPaymentMethod.card.last4)}
                          </p>
                          <p className="text-xs text-[black]/70 dark:text-[white]/70">
                            {defaultPaymentMethod.card.brand.charAt(0).toUpperCase() + defaultPaymentMethod.card.brand.slice(1)} • Expires {formatExpiry(defaultPaymentMethod.card.exp_month, defaultPaymentMethod.card.exp_year)}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs bg-[#5fbfc0]/20 text-[black] dark:text-[white] px-2 py-1 rounded-full">
                        Default
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center p-3 border-2 border-dashed border-[#DDE5E7] dark:border-[#333333] rounded-md">
                      <svg className="h-5 w-5 text-[#5fbfc0]/50 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                      <span className="text-sm text-[black]/70 dark:text-[white]/70">No payment method set up</span>
                    </div>
                  )}
                </div>
                
                <div className="bg-[#5fbfc0]/10 dark:bg-[#5fbfc0]/20 p-4 rounded-md">
                  <h4 className="text-sm font-medium text-[black] dark:text-[white] mb-2">
                    Managing Your Payment Methods
                  </h4>
                  <p className="text-sm text-[black]/70 dark:text-[white]/70 mb-3">
                    To add, remove, or change your default payment method, please use the dedicated payment management page. This ensures secure handling of your payment information.
                  </p>
                  <Link
                    href="/dashboard/payment-methods"
                    className="inline-flex items-center px-4 py-2 border border-[#5fbfc0] shadow-sm text-sm font-medium rounded-md text-[black] bg-white hover:bg-[#5fbfc0]/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5fbfc0] dark:bg-[black] dark:text-[white] dark:border-[#5fbfc0] dark:hover:bg-[#5fbfc0]/20 transition-colors"
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
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#5fbfc0] hover:bg-[#4aa5a6] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5fbfc0] disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
      
      {/* Account Section */}
      <div className="bg-[#F8F9FA] dark:bg-[#1A1A1A] rounded-lg shadow-md border border-[#DDE5E7] dark:border-[#333333] p-6">
        <h3 className="text-lg font-medium text-[black] dark:text-[white] mb-4">Account Information</h3>
        <div className="mb-4">
          <div className="text-sm text-[black]/70 dark:text-[white]/70">Email</div>
          <div className="font-medium text-[black] dark:text-[white]">{user.email}</div>
        </div>
        
        <div className="border-t border-[#DDE5E7] dark:border-[#333333] pt-4 mt-4">
          <h4 className="text-sm font-medium text-[black] dark:text-[white] mb-2">Password</h4>
          <p className="text-sm text-[black]/70 dark:text-[white]/70 mb-4">
            You can update your password from the change password page.
          </p>
          <a
            href="/update-password"
            className="inline-flex items-center px-4 py-2 border border-[#DDE5E7] shadow-sm text-sm font-medium rounded-md text-[black] bg-white hover:bg-[#F8F9FA] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5fbfc0] dark:bg-[black] dark:text-[white] dark:border-[#333333] dark:hover:bg-[#1A1A1A]"
          >
            Change Password
          </a>
        </div>
      </div>
    </DashboardLayout>
  );
}