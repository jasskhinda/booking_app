# Compassionate Rides - Application Specifications

## Overview
Compassionate Rides is a specialized transportation booking platform designed to provide accessible transportation services, with particular attention to clients with mobility needs or special requirements.

## User Roles

### 1. Client
- Regular users who book transportation services
- Can create and manage trip bookings
- View personal trip history
- Rate completed trips
- Track drivers in real-time
- Save favorite addresses
- Manage payment methods

### 2. Driver
- Transportation service providers
- Assigned to trips by dispatchers
- Location tracking enabled for clients
- Update trip status (in progress, completed)
- Navigate to pickup and dropoff locations

### 3. Dispatcher
- Administrative users who manage the service
- Review and approve/decline trip requests
- Assign drivers to trips
- View all trips and profiles in the system
- Handle cancellations and refunds
- Monitor service operations

## Trip Pricing Model

The pricing structure is multi-faceted with the following components:

### Base Rates
- **One-way trip**: $50 base fare
- **Round trip**: $100 base fare

### Distance Pricing
- **Per mile charge**: $3.00 per mile
- Calculated using Google Maps API

### Time-based Premiums
- **Off-hours premium**: $40 additional for trips before 8am or after 8pm
- **Weekend premium**: $40 additional for trips on Saturday or Sunday

### Special Requirements
- **Wheelchair accessibility**: $25 additional charge

### Discounts
- **Individual client discount**: 10% automatic discount for individual clients

### Calculation Formula
Total Price = (Base Rate + Distance Charge + Time Premiums + Special Requirements) - Applicable Discounts

## Trip Status Workflow

### 1. Pending
- Initial state when a client books a trip
- Awaiting dispatcher approval
- Client can cancel without penalty
- Dispatchers receive notification

### 2. Upcoming
- Trip approved and driver assigned
- Client can view trip details and driver information
- Cancellation may affect refund eligibility

### 3. In Progress
- Driver has marked trip as started
- Real-time tracking available to client
- Emergency cancellation still possible

### 4. Completed
- Trip finished successfully
- Client can rate service and provide feedback
- Trip added to history
- Rebooking option available

### 5. Cancelled
- Trip terminated before completion
- Cancellation reason recorded
- Refund status tracked (pending, processed, declined)
- Appears in trip history with cancellation status

## Payment System

- **Provider**: Stripe integration
- **Storage**: Payment methods securely stored with Stripe
- **Customer Management**: Stripe Customer IDs linked to user profiles
- **Payment Methods**: Add, view, and delete payment options
- **Refunds**: Processed for eligible cancelled trips

## Booking System Features

### Address Management
- Google Places API for address autocomplete
- Save and select favorite addresses
- Interactive map showing route visualization

### Trip Options
- Date and time selection with custom UI
- Real-time fare estimation
- Special requirements selection (wheelchair accessibility)
- Round trip option with driver wait time

### Trip Management
- Comprehensive trip history
- Trip details view
- Rebooking functionality from past trips
- Cancellation management

### Driver Tracking
- Real-time location updates
- ETA calculations
- Route visualization
- Driver contact options

### Rating System
- Post-trip feedback collection
- Driver performance rating

## Technical Infrastructure

### Database
- Supabase backend
- Key tables:
  - trips: All trip information and lifecycle
  - profiles: User data and role information
  - auth.users: Authentication records

### APIs and Integrations
- **Supabase**: Database and authentication
- **Google Maps API**: Address, routing, and tracking
- **Stripe**: Payment processing
- **Email Service**: Notifications

### Security
- Row-level security for data protection
- Role-based access control
- Stripe tokenization for payment security
- Session-based authentication

### UI Features
- Responsive design for mobile and desktop
- Dark/light mode support
- Accessibility considerations
- Interactive map components

## User Experience Flow

1. User signs up/logs in
2. Books trip with address, time, and special needs
3. Receives price estimate and confirms booking
4. Dispatcher reviews and assigns driver
5. User receives notification of approval
6. User tracks driver on day of trip
7. Trip completed and user can rate service
8. Trip history updated with completed trip