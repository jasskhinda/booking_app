# Compassionate Rides Booking App

A specialized transportation service for individuals with unique needs and medical requirements.

## Features

- **User Authentication**: Sign up, login, password reset with Supabase Auth
- **Google Maps Integration**: Address autocomplete and route visualization
- **Trip Booking**: Schedule rides with special requirements
- **Trip Management**: View and manage upcoming, completed, and cancelled trips
- **Responsive Design**: Works on mobile and desktop devices

## Tech Stack

- **Frontend**: Next.js 15, React, Tailwind CSS
- **Authentication**: Supabase Auth with email/password and Google OAuth
- **Database**: Supabase PostgreSQL
- **Maps**: Google Maps JavaScript API with Places Autocomplete and Directions Service

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- Google Maps API key with Places and Directions APIs enabled

### Environment Setup

1. Clone the repository
2. Create a `.env.local` file with the following variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   ```

### Database Setup

1. In your Supabase project, run the SQL script in `db/schema.sql` to create the necessary tables and functions
2. Enable email authentication in Supabase Auth settings
3. Set up Google OAuth if you want to enable social login

### Running the App

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Project Structure

- `/app`: Next.js app router components
- `/app/components`: Reusable React components
- `/app/dashboard`: Protected user dashboard pages
- `/lib`: Shared utilities and configuration
- `/db`: Database schema and migrations
- `/public`: Static assets

## Deployment

This app can be deployed on Vercel:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to Vercel
vercel
```

## Learn More

This project is built with [Next.js](https://nextjs.org) and uses:

- [Supabase](https://supabase.com) for authentication and database
- [Google Maps JavaScript API](https://developers.google.com/maps/documentation/javascript) for location services
- [Tailwind CSS](https://tailwindcss.com) for styling

## License

MIT
