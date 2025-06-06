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
    default_payment_method_id: '', // <-- add this field
    is_veteran: false,
    favorite_addresses: [],
  });
  const [newFavoriteAddress, setNewFavoriteAddress] = useState({
    name: '',
    address: '',
    type: 'both', // pickup, destination, or both
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [paymentMethods, setPaymentMethods] = useState([]);

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
        preferred_payment_method: profile.default_payment_method_id || profile.preferred_payment_method || '', // sync with canonical field
        default_payment_method_id: profile.default_payment_method_id || '', // ensure this is set
        is_veteran: profile.is_veteran || false,
        favorite_addresses: profile.favorite_addresses || [],
      }));
    }
  }, [profile, user]);

  useEffect(() => {
    async function fetchPaymentMethods() {
      try {
        const response = await fetch('/api/stripe/payment-methods');
        const data = await response.json();
        if (response.ok) {
          setPaymentMethods(data.paymentMethods || []);
        }
      } catch (err) {
        // Optionally handle error
      }
    }
    fetchPaymentMethods();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prevData => ({ 
      ...prevData, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };
  
  const handleNewAddressChange = (e) => {
    const { name, value } = e.target;
    setNewFavoriteAddress(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleAddFavoriteAddress = () => {
    // Validate fields
    if (!newFavoriteAddress.name || !newFavoriteAddress.address) {
      setMessage({
        text: 'Please provide both name and address for your favorite location',
        type: 'error'
      });
      return;
    }
    
    // Add new address with a generated ID
    const newAddress = {
      ...newFavoriteAddress,
      id: crypto.randomUUID() // Generate unique ID
    };
    
    setFormData(prev => ({
      ...prev,
      favorite_addresses: [...prev.favorite_addresses, newAddress]
    }));
    
    // Reset the form
    setNewFavoriteAddress({
      name: '',
      address: '',
      type: 'both'
    });
  };
  
  const handleRemoveFavoriteAddress = (id) => {
    setFormData(prev => ({
      ...prev,
      favorite_addresses: prev.favorite_addresses.filter(address => address.id !== id)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ text: '', type: '' });

    try {
      // Debug log to see what data we're sending
      console.log('Updating profile with data:', {
        ...formData,
        updated_at: new Date().toISOString(),
        default_payment_method_id: formData.preferred_payment_method || null // Use Stripe payment method id
      });
      // Only send fields that exist in the DB
      const profileData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone_number: formData.phone_number,
        address: formData.address,
        accessibility_needs: formData.accessibility_needs,
        medical_requirements: formData.medical_requirements,
        emergency_contact: formData.emergency_contact,
        is_veteran: formData.is_veteran,
        updated_at: new Date().toISOString(),
        default_payment_method_id: formData.default_payment_method_id === '' ? null : formData.default_payment_method_id
      };
      // Remove deprecated preferred_payment_method field
      delete profileData.preferred_payment_method;
      // Remove favorite_addresses if present
      delete profileData.favorite_addresses;

      // Try getting the profile first to see if we're updating or inserting
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      let error;
      let result;
      if (existingProfile) {
        console.log('Updating existing profile');
        result = await supabase
          .from('profiles')
          .update(profileData)
          .eq('id', user.id);
        error = result.error;
      } else {
        console.log('Inserting new profile');
        result = await supabase
          .from('profiles')
          .insert(profileData);
        error = result.error;
      }

      if (error) {
        // Log full error object for debugging
        console.error('Supabase error details:', error, result);
        throw error;
      }

      // Update user metadata with first name and last name if they differ
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
      <div className="bg-[#F8F9FA] dark:bg-[#24393C] rounded-lg shadow-md border border-[#DDE5E7] dark:border-[#3F5E63] p-6 mb-6">
        <h2 className="text-xl font-semibold text-[#2E4F54] dark:text-[#E0F4F5] mb-6">Account Settings</h2>
        
        {message.text && (
          <div className={`p-4 mb-6 rounded-md ${
            message.type === 'success' 
              ? 'bg-[#7CCFD0]/20 text-[#2E4F54] dark:bg-[#7CCFD0]/30 dark:text-[#E0F4F5]' 
              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
          }`}>
            {message.text}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Personal Information Section */}
            <div>
              <h3 className="text-lg font-medium text-[#2E4F54] dark:text-[#E0F4F5] mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="first_name" className="block text-sm font-medium text-[#2E4F54] dark:text-[#E0F4F5] mb-1">
                    First Name
                  </label>
                  <input
                    id="first_name"
                    name="first_name"
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={handleChange}
                    className="w-full p-2 border border-[#DDE5E7] dark:border-[#3F5E63] rounded-md dark:bg-[#1C2C2F] text-[#2E4F54] dark:text-[#E0F4F5]"
                  />
                </div>
                
                <div>
                  <label htmlFor="last_name" className="block text-sm font-medium text-[#2E4F54] dark:text-[#E0F4F5] mb-1">
                    Last Name
                  </label>
                  <input
                    id="last_name"
                    name="last_name"
                    type="text"
                    required
                    value={formData.last_name}

                    onChange={handleChange}
                    className="w-full p-2 border border-[#DDE5E7] dark:border-[#3F5E63] rounded-md dark:bg-[#1C2C2F] text-[#2E4F54] dark:text-[#E0F4F5]"
                  />
                </div>
                
                <div>
                  <label htmlFor="phone_number" className="block text-sm font-medium text-[#2E4F54] dark:text-[#E0F4F5] mb-1">
                    Phone Number
                  </label>
                  <input
                    id="phone_number"
                    name="phone_number"
                    type="tel"
                    value={formData.phone_number}
                    onChange={handleChange}
                    className="w-full p-2 border border-[#DDE5E7] dark:border-[#3F5E63] rounded-md dark:bg-[#1C2C2F] text-[#2E4F54] dark:text-[#E0F4F5]"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label htmlFor="address" className="block text-sm font-medium text-[#2E4F54] dark:text-[#E0F4F5] mb-1">
                    Address
                  </label>
                  <input
                    id="address"
                    name="address"
                    type="text"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full p-2 border border-[#DDE5E7] dark:border-[#3F5E63] rounded-md dark:bg-[#1C2C2F] text-[#2E4F54] dark:text-[#E0F4F5]"
                  />
                  
                </div>
                
                <div className="md:col-span-2">
                  <label htmlFor="emergency_contact" className="block text-sm font-medium text-[#2E4F54] dark:text-[#E0F4F5] mb-1">
                    Emergency Contact (Name & Phone)
                  </label>
                  <input
                    id="emergency_contact"
                    name="emergency_contact"
                    type="text"
                    value={formData.emergency_contact}
                    onChange={handleChange}
                    className="w-full p-2 border border-[#DDE5E7] dark:border-[#3F5E63] rounded-md dark:bg-[#1C2C2F] text-[#2E4F54] dark:text-[#E0F4F5]"
                  />
                </div>
                
                <div className="md:col-span-2 flex items-center pt-2">
                  <input
                    id="is_veteran"
                    name="is_veteran"
                    type="checkbox"
                    checked={formData.is_veteran}
                    onChange={handleChange}
                    className="h-4 w-4 text-[#7CCFD0] focus:ring-[#7CCFD0] border-[#DDE5E7] dark:border-[#3F5E63] rounded dark:bg-[#1C2C2F] dark:checked:bg-[#7CCFD0]"
                  />
                  <label htmlFor="is_veteran" className="ml-2 block text-sm font-medium text-[#2E4F54] dark:text-[#E0F4F5]">
                    I am a veteran
                  </label>
                </div>
              </div>
            </div>
            
            {/* Special Requirements Section */}
            <div>
              <h3 className="text-lg font-medium text-[#2E4F54] dark:text-[#E0F4F5] mb-4">Special Requirements</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label htmlFor="accessibility_needs" className="block text-sm font-medium text-[#2E4F54] dark:text-[#E0F4F5] mb-1">
                    Accessibility Needs
                  </label>
                  <textarea
                    id="accessibility_needs"
                    name="accessibility_needs"
                    rows={3}
                    value={formData.accessibility_needs}
                    onChange={handleChange}
                    className="w-full p-2 border border-[#DDE5E7] dark:border-[#3F5E63] rounded-md dark:bg-[#1C2C2F] text-[#2E4F54] dark:text-[#E0F4F5]"
                    placeholder="e.g., Wheelchair accessible, Assistance getting in/out of vehicle"
                  ></textarea>
                </div>
                
                <div className="md:col-span-2">
                  <label htmlFor="medical_requirements" className="block text-sm font-medium text-[#2E4F54] dark:text-[#E0F4F5] mb-1">
                    Medical Requirements
                  </label>
                  <textarea
                    id="medical_requirements"
                    name="medical_requirements"
                    rows={3}
                    value={formData.medical_requirements}
                    onChange={handleChange}
                    className="w-full p-2 border border-[#DDE5E7] dark:border-[#3F5E63] rounded-md dark:bg-[#1C2C2F] text-[#2E4F54] dark:text-[#E0F4F5]"
                    placeholder="e.g., Oxygen tank, Medical equipment storage"
                  ></textarea>
                </div>
              </div>
            </div>
            
            {/* Favorite Addresses Section */}
            <div>
              <h3 className="text-lg font-medium text-[#2E4F54] dark:text-[#E0F4F5] mb-4">Favorite Addresses</h3>
              <div className="space-y-6">
                {/* List of existing favorite addresses */}
                {formData.favorite_addresses.length > 0 ? (
                  <div className="space-y-4">
                    <p className="text-sm text-[#2E4F54]/70 dark:text-[#E0F4F5]/70 mb-2">
                      Your saved addresses
                    </p>
                    <div className="grid grid-cols-1 gap-4">
                      {formData.favorite_addresses.map((address) => (
                        <div 
                          key={address.id} 
                          className="flex justify-between items-center p-3 bg-white dark:bg-[#1C2C2F] border border-[#DDE5E7] dark:border-[#3F5E63] rounded-md"
                        >
                          <div>
                            <div className="font-medium text-[#2E4F54] dark:text-[#E0F4F5]">
                              {address.name}
                              <span className="ml-2 text-xs px-2 py-1 rounded-full bg-[#7CCFD0]/20 text-[#2E4F54] dark:bg-[#7CCFD0]/30 dark:text-[#E0F4F5]">
                                {address.type === 'both' ? 'Pickup & Destination' : address.type === 'pickup' ? 'Pickup' : 'Destination'}
                              </span>
                            </div>
                            <div className="text-sm text-[#2E4F54]/70 dark:text-[#E0F4F5]/70">
                              {address.address}
                            </div>
                          </div>
                          <button 
                            type="button"
                            onClick={() => handleRemoveFavoriteAddress(address.id)}
                            className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-[#2E4F54]/70 dark:text-[#E0F4F5]/70 italic">No favorite addresses saved yet.</p>
                )}
                
                {/* Add new address form */}
                <div className="border-t border-[#DDE5E7] dark:border-[#3F5E63] pt-4 mt-2">
                  <p className="text-sm font-medium text-[#2E4F54] dark:text-[#E0F4F5] mb-3">
                    Add a new favorite address
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="favorite_name" className="block text-sm font-medium text-[#2E4F54] dark:text-[#E0F4F5] mb-1">
                        Location Name
                      </label>
                      <input
                        id="favorite_name"
                        name="name"
                        type="text"
                        value={newFavoriteAddress.name}
                        onChange={handleNewAddressChange}
                        placeholder="Home, Work, Doctor, etc."
                        className="w-full p-2 border border-[#DDE5E7] dark:border-[#3F5E63] rounded-md dark:bg-[#1C2C2F] text-[#2E4F54] dark:text-[#E0F4F5]"
                      />
                    </div>
                    <div>
                      <label htmlFor="favorite_address_type" className="block text-sm font-medium text-[#2E4F54] dark:text-[#E0F4F5] mb-1">
                        Address Type
                      </label>
                      <select
                        id="favorite_address_type"
                        name="type"
                        value={newFavoriteAddress.type}
                        onChange={handleNewAddressChange}
                        className="w-full p-2 border border-[#DDE5E7] dark:border-[#3F5E63] rounded-md dark:bg-[#1C2C2F] text-[#2E4F54] dark:text-[#E0F4F5]"
                      >
                        <option value="both">Pickup & Destination</option>
                        <option value="pickup">Pickup Only</option>
                        <option value="destination">Destination Only</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label htmlFor="favorite_address" className="block text-sm font-medium text-[#2E4F54] dark:text-[#E0F4F5] mb-1">
                        Address
                      </label>
                      <input
                        id="favorite_address"
                        name="address"
                        type="text"
                        value={newFavoriteAddress.address}
                        onChange={handleNewAddressChange}
                        placeholder="Full address"
                        className="w-full p-2 border border-[#DDE5E7] dark:border-[#3F5E63] rounded-md dark:bg-[#1C2C2F] text-[#2E4F54] dark:text-[#E0F4F5]"
                      />
                    </div>
                  </div>
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={handleAddFavoriteAddress}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-[#7CCFD0] hover:bg-[#60BFC0] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7CCFD0]"
                    >
                      <svg className="-ml-0.5 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                      </svg>
                      Add Address
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Payment Preferences */}
            <div>
              <h3 className="text-lg font-medium text-[#2E4F54] dark:text-[#E0F4F5] mb-4">Payment Preferences</h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="preferred_payment_method" className="block text-sm font-medium text-[#2E4F54] dark:text-[#E0F4F5] mb-1">
                    Your Preferred Payment Method
                  </label>
                  <select
                    id="preferred_payment_method"
                    name="preferred_payment_method"
                    value={formData.preferred_payment_method}
                    disabled
                    className="w-full p-2 border border-[#DDE5E7] dark:border-[#3F5E63] rounded-md dark:bg-[#1C2C2F] text-[#2E4F54] dark:text-[#E0F4F5] bg-gray-100 dark:bg-[#24393C] cursor-not-allowed"
                  >
                    {/* Only show the default payment method as an option */}
                    {paymentMethods
                      .filter(method => method.id === formData.default_payment_method_id)
                      .map((method) => (
                        <option key={method.id} value={method.id}>
                          {`${method.card.brand.toUpperCase()} •••• ${method.card.last4} (${method.card.funding === 'debit' ? 'Debit' : 'Credit'})`}
                        </option>
                      ))}
                  </select>
                </div>
                
                <div className="mt-2">
                  <p className="text-sm text-[#2E4F54]/70 dark:text-[#E0F4F5]/70 mb-2">
                    Manage your payment cards for automatic billing
                  </p>
                  <Link
                    href="/dashboard/payment-methods"
                    className="inline-flex items-center px-4 py-2 border border-[#DDE5E7] shadow-sm text-sm font-medium rounded-md text-[#2E4F54] bg-white hover:bg-[#F8F9FA] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7CCFD0] dark:bg-[#1C2C2F] dark:text-[#E0F4F5] dark:border-[#3F5E63] dark:hover:bg-[#24393C]"
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
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#7CCFD0] hover:bg-[#60BFC0] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7CCFD0] disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
      
      {/* Account Section */}
      <div className="bg-[#F8F9FA] dark:bg-[#24393C] rounded-lg shadow-md border border-[#DDE5E7] dark:border-[#3F5E63] p-6">
        <h3 className="text-lg font-medium text-[#2E4F54] dark:text-[#E0F4F5] mb-4">Account Information</h3>
        <div className="mb-4"> 
          <div className="text-sm text-[#2E4F54]/70 dark:text-[#E0F4F5]/70">Email</div>
          <div className="font-medium text-[#2E4F54] dark:text-[#E0F4F5]">{user.email}</div>
        </div>
        
        <div className="border-t border-[#DDE5E7] dark:border-[#3F5E63] pt-4 mt-4">
          <h4 className="text-sm font-medium text-[#2E4F54] dark:text-[#E0F4F5] mb-2">Password</h4>
          <p className="text-sm text-[#2E4F54]/70 dark:text-[#E0F4F5]/70 mb-4">
            You can update your password from the change password page.
          </p>
          <a
            href="/update-password"
            className="inline-flex items-center px-4 py-2 border border-[#DDE5E7] shadow-sm text-sm font-medium rounded-md text-[#2E4F54] bg-white hover:bg-[#F8F9FA] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7CCFD0] dark:bg-[#1C2C2F] dark:text-[#E0F4F5] dark:border-[#3F5E63] dark:hover:bg-[#24393C]"
          >
            Change Password
          </a>
        </div>
      </div>
    </DashboardLayout>
  );
}