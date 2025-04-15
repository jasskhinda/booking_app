'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function RatingForm({ trip, onRatingSubmitted }) {
  const [rating, setRating] = useState(trip.rating || 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const supabase = createClientComponentClient();

  const handleSubmitRating = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      setErrorMessage('Please select at least one star to rate this trip');
      return;
    }
    
    setIsSubmitting(true);
    setErrorMessage('');
    
    try {
      // Update the trip with the new rating
      const { data, error } = await supabase
        .from('trips')
        .update({ 
          rating,
          feedback,
          updated_at: new Date().toISOString() 
        })
        .eq('id', trip.id)
        .select();
      
      if (error) {
        throw error;
      }
      
      // Call the callback function with the updated trip
      if (onRatingSubmitted && data) {
        onRatingSubmitted(data[0]);
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      setErrorMessage('Failed to submit rating. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#1C2C2F] rounded-lg p-4 shadow-sm border border-[#DDE5E7] dark:border-[#3F5E63]">
      <h3 className="text-lg font-medium mb-4 text-[#2E4F54] dark:text-[#E0F4F5]">Rate your trip</h3>
      
      {errorMessage && (
        <div className="mb-4 p-3 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 rounded-md">
          {errorMessage}
        </div>
      )}
      
      <form onSubmit={handleSubmitRating}>
        <div className="mb-4">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="focus:outline-none"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                >
                  <svg 
                    className={`h-8 w-8 ${
                      (hoverRating || rating) >= star 
                        ? 'text-yellow-400' 
                        : 'text-[#DDE5E7] dark:text-[#3F5E63]'
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
          <div className="text-center mt-2 text-sm text-[#2E4F54]/70 dark:text-[#E0F4F5]/70">
            {rating === 0 && 'Tap to rate'}
            {rating === 1 && 'Poor'}
            {rating === 2 && 'Fair'}
            {rating === 3 && 'Good'}
            {rating === 4 && 'Very Good'}
            {rating === 5 && 'Excellent'}
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-[#2E4F54] dark:text-[#E0F4F5] mb-1">
            Additional Feedback (Optional)
          </label>
          <textarea
            rows={3}
            className="w-full p-2 border border-[#DDE5E7] dark:border-[#3F5E63] rounded-md dark:bg-[#1C2C2F] text-[#2E4F54] dark:text-[#E0F4F5]"
            placeholder="Tell us about your experience..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          />
        </div>
        
        <button
          type="submit"
          disabled={isSubmitting || rating === 0}
          className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#7CCFD0] hover:bg-[#60BFC0] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7CCFD0] disabled:opacity-50"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Rating'}
        </button>
      </form>
    </div>
  );
}