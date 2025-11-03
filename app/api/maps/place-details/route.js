import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const placeId = searchParams.get('place_id');

    if (!placeId) {
      return NextResponse.json({
        status: 'INVALID_REQUEST',
        error_message: 'Missing place_id parameter'
      }, { status: 400 });
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      console.error('Google Maps API key not configured');
      return NextResponse.json({
        status: 'ERROR',
        error_message: 'API key not configured'
      }, { status: 500 });
    }

    // Call Google Places Details API
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=formatted_address,geometry&key=${apiKey}`;

    const response = await fetch(detailsUrl);
    const data = await response.json();

    // Return the Google API response as-is
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error in place-details API:', error);
    return NextResponse.json({
      status: 'ERROR',
      error_message: error.message
    }, { status: 500 });
  }
}
