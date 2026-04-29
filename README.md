# Farm Saarthi — Agriculture Equipment Rental Platform

Farm Saarthi is a full-stack web platform that connects **small & marginal farmers** who need agricultural machinery with **equipment owners (renters)** who have idle inventory. It digitizes the rental lifecycle—**discovery → booking → payment → tracking → disputes → reviews**—in a transparent, location-aware system.

This project was developed as a final-year undergraduate project (2025–26).

## Problem
In many rural areas, farmers need machinery (tractor, harvester, sprayer, etc.) only for short seasonal windows. Buying equipment is expensive, and the current rental system often depends on informal middlemen with:
- No clear visibility of equipment availability near the farmer
- Opaque / unregulated pricing
- No booking confirmation (no-show risk)
- No formal dispute mechanism
- No transaction history / record

## Solution (What Farm Saarthi provides)
- **Location-based equipment discovery** using MongoDB geospatial indexing + distance calculation (Haversine)
- **Time-slot booking** with **automatic conflict detection** (prevents overlapping reservations)
- **OTP-based passwordless authentication** with **JWT** for API access
- **Advance payment model**: **2% service charge online**, remaining amount settled in person at pickup
- **Interactive map view** using **OpenStreetMap + React Leaflet**
- **In-app notifications** for bookings, cancellations, nearby equipment alerts, dispute updates, etc.
- **Post-rental reviews & ratings** (1–5 stars + comment)
- **Bilingual UI**: English + Kannada (instant toggle)

## User Roles
### Farmer
- Search equipment within a configurable radius
- View results with distance, pricing, availability, and ratings
- Book time slots, pay service charge, track booking status
- Raise disputes and submit reviews after completion

### Renter (Equipment Owner)
- Create / update / delete equipment listings
- Upload images and manage availability (pause during maintenance)
- View booking requests and reviews/ratings

### Admin
- Verify/approve equipment listings (pending → verified)
- Monitor users/bookings and platform analytics
- Resolve disputes with resolution notes

## Core Modules / Features
- **Authentication**: OTP-based login/registration + JWT
- **Equipment listing & verification**: category, description, images, pricing (per hour + per km), units; admin approval required
- **Discovery + Map**: geospatial proximity search + map markers
- **Booking lifecycle**: hold → confirmed (after service fee) → ongoing → completed; cancellation with reason
- **Payments**:  
  Total cost = (perHour × duration) + (perKm × distance)  
  Service fee = 2% (paid online)  
  Remaining = 98% (paid offline/in person)
- **Disputes**: farmer raises dispute; admin resolves
- **Reviews**: only after completed bookings; updates average rating

## Tech Stack
### Frontend (`frontend/`)
- React + Vite
- Tailwind CSS
- React Router
- Axios
- React Leaflet + OpenStreetMap
- i18next (English/Kannada)
- Lucide React (icons)

### Backend (`backend/`)
- Node.js + Express
- MongoDB + Mongoose
- JWT authentication
- Multer (image uploads)

## Repo Structure
- `frontend/` — React UI
- `backend/` — REST API server
- `demo/` — demo video (Git LFS)

## Demo Video
- `demo/Screen Recording 2026-04-22 195440.mp4`

## Local Setup

### Prerequisites
- Node.js (LTS recommended)
- MongoDB (local or Atlas)
- Git

### Backend
```bash
cd backend
npm install
npm run dev
