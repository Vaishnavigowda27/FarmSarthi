# Farm Saarthi

An agricultural equipment rental platform built . Farm Saarthi connects farmers who need machinery with equipment owners who have idle inventory, handling the full rental lifecycle from discovery through payment, dispute resolution, and review.

Undergrad final year project.

---

## The Problem

Small and marginal farmers  often cannot afford to own tractors, harvesters, or sprayers outright. Equipment sits idle with owners for most of the year while farmers pay informal, opaque rates to middlemen. There was no organized platform to search for nearby equipment, book slots, or make verifiable payments.

---

## What It Does

Farmers can search for equipment available near their location, see real-time availability by unit count, pick a time slot, pay a small advance pay by scanning QR or upi id, and track their bookings. Equipment owners list their machinery, set their rates, review incoming booking requests, and receive earnings summaries. Admins verify equipment listings, resolve disputes, and monitor platform health & analytics.

---

## Tech Stack

**Backend**
- Node.js with Express 5
- MongoDB with Mongoose 9, 2dsphere geospatial indexing
- JWT authentication, bcryptjs for password hashing
- Multer for equipment photo uploads
 
**Frontend**
- React 19 with Vite 7
- Tailwind CSS 3
- React Router v7
- Axios for API calls
- React Leaflet with OpenStreetMap for equipment map view
- i18next for English and Kannada language support
- Lucide React icons

---

## Getting Started

### Prerequisites

- Node.js 18 or higher
- A MongoDB Atlas account (free tier works fine) or a local MongoDB instance
  

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/farm-saarthi.git
cd farm-saarthi
```

### 2. Backend setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory:

```env
PORT=5000
NODE_ENV=development

MONGODB_URI=your_mongodb_connection_string

JWT_SECRET=replace_with_a_long_random_string
JWT_EXPIRE=30d

FRONTEND_URL=http://localhost:5173

MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads

SERVICE_CHARGE_PERCENTAGE=2
PROXIMITY_RADIUS_KM=10


```

### 3. Frontend setup

```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend` directory:

```env
VITE_API_URL=http://localhost:5000/api
```

### 4. Seed the database

```bash
cd backend
node seed.js
```

This creates six farmers, five equipment owners, all equipment listings, completed bookings with payments, submitted reviews, and upcoming bookings so every dashboard has realistic data on first login.

### 5. Run the application

Start the backend:

```bash
cd backend
npm run dev
```

Start the frontend (in a separate terminal):

```bash
cd frontend
npm run dev
```

The frontend runs at `http://localhost:5173` and the backend API at `http://localhost:5000`.

---

## Core Features

### Authentication

OTP login. No passwords anywhere. A 6-digit code is generated per request in backend terminal, expires in 10 minutes, and is deleted from the database immediately on successful verification. 

### Equipment Listing
Equipment owners can add agricultural machines to the platform.Owners provide equipment name, description, unitsand pricing.Images can be uploaded and stored on the server.Equipment location is stored for location-based search.Newly added equipment may require admin verification before becoming visible.

### Equipment Discovery

Farmers search by proximity using MongoDB's 2dsphere geospatial index. Each listing shows distance calculated via the Haversine formula, live available unit count (total units minus active bookings for today), pricing per hour and per kilometre, and an interactive map view with OpenStreetMap tiles.

### Booking and Conflict Detection

The system checks for slot overlaps before creating any booking. If a requested time range overlaps with any existing hold, confirmed, or ongoing booking on the same equipment for the same date, the request is rejected. Confirmed slots lock the equipment schedule so two farmers cannot book the same unit at the same time.

### Payments

The system creates a payment order for the booking service charge.The user completes the transaction through scanning QR code or paying through UPI id.
After successful payment, the booking status becomes confirmed.


Total cost formula:
```
totalCost         = (perHour * duration) + (perKm * distance)
serviceCharge     = totalCost * 2%        [paid online, non-refundable]
remainingPayment  = totalCost - serviceCharge  [paid in person]
```

### Booking Lifecycle

```
pending  ->  hold  ->  confirmed  ->  ongoing  ->  completed
                    ->  cancelled
                    ->  disputed  ->  resolved by admin
```

### Support Module

Farmers can raise a dispute on any confirmed or ongoing booking by selecting an issue type (equipment breakdown, unsuitable weather, no-show, quality issue, safety concern) and submitting a description. The booking is paused in disputed status and the admin is notified. Admins write a resolution note and close the dispute by marking it completed or cancelled. The platform targets a 24-hour resolution window.

### Notifications

In-app notifications are delivered to a bell icon in the navigation header. The panel polls every 30 seconds and marks all notifications as read when opened. Notifications are triggered for booking confirmation, cancellation, payment received, proximity alerts when new equipment is listed nearby, and dispute updates.

### Reviews

Reviews are available only on completed bookings that have not been reviewed. Farmers rate out of 5 and leave a comment. Equipment and owner ratings are recalculated as running averages after each submission. Owners can respond to reviews they receive.

### Multi-language Support

The interface supports English and Kannada. Language toggles instantly without a page reload using i18next.

### Administration control

The administrator monitors platform activities and manages system data.Verify equipment listings.View bookings , system activity & Platform analytics.Resolve disputes between users.Maintain platform data integrity

---


