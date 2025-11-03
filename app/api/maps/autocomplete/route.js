import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const input = searchParams.get('input');

    if (!input || input.length < 3) {
      return NextResponse.json({
        status: 'INVALID_REQUEST',
        predictions: []
      });
    }

    // Try server-side key first, then fall back to public key
    const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      console.error('Google Maps API key not configured');
      return NextResponse.json({
        status: 'ERROR',
        error_message: 'API key not configured',
        predictions: []
      }, { status: 500 });
    }

    // Call Google Places Autocomplete API
    const autocompleteUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${apiKey}&components=country:us`;

    const response = await fetch(autocompleteUrl);
    const data = await response.json();

    // Log if Google API returns an error
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Google API error:', data.status, data.error_message);
    }

    // Return the Google API response as-is
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error in autocomplete API:', error);
    return NextResponse.json({
      status: 'ERROR',
      error_message: error.message,
      predictions: []
    }, { status: 500 });
  }
}
