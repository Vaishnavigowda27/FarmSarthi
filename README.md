# Farm Saarthi — Agriculture Equipment Rental Platform

Farm Saarthi is a full-stack web platform that connects **small & marginal farmers** who need agricultural machinery with **equipment owners (renters)** who have idle inventory. It digitizes the rental lifecycle—**discovery → booking → payment → tracking → disputes → reviews**—in a transparent, location-aware system.

This project was developed as a final-year undergraduate project (2025–26).

## Problem
In many rural areas, farmers need machinery (tractor, harvester, sprayer, etc.) only for short seasonal windows. Buying equipment is expensive, and the current rental system often depends on informal middlemen with:
- no clear availability near the farmer
- opaque/unregulated pricing
- no booking confirmation (no-show risk)
- no formal dispute mechanism
- no transaction record / history

## Solution (What Farm Saarthi provides)
A structured rental platform with:
- **Location-based equipment discovery** using MongoDB geospatial indexing and distance calculation (Haversine)
- **Time-slot booking** with **automatic conflict detection** (prevents overlapping reservations)
- **OTP-based passwordless login** and **JWT-based session** authentication
- **Advance payment model**: **2% service charge paid online**, remaining amount settled in person at pickup
- **Interactive map view** using **OpenStreetMap** + **React Leaflet**
- **In-app notifications** for booking updates, cancellations, new nearby equipment, dispute status, etc.
- **Post-rental reviews & ratings** (1–5 stars + comment)
- **Bilingual interface**: English + Kannada (instant toggle)

## User Roles
- **Farmer**
  - search equipment within a configurable radius
  - view results + ratings + distance + pricing
  - book equipment time slots, pay service charge, track booking status
  - raise disputes, submit reviews after completion

- **Renter (Equipment Owner)**
  - create/update/delete equipment listings
  - upload images
  - pause listings during maintenance
  - view/manage booking requests and see reviews/ratings

- **Admin**
  - verify/approve equipment listings (pending → verified)
  - view platform analytics and manage users/bookings
  - resolve disputes with resolution notes

## Core Modules / Features
- **Authentication**
  - OTP (time-limited) login/registration
  - JWT token for API requests

- **Equipment Listing & Verification**
  - category (Tractor / Harvester / Plough / Seeder / Sprayer / Thresher / Other)
  - description, images, pricing (per hour + per km), number of units
  - admin approval required before listing becomes visible

- **Discovery + Map**
  - geospatial proximity search
  - equipment + farmer markers on map (OpenStreetMap)

- **Booking Lifecycle**
  - booking created in *hold* state until service charge payment
  - confirmed after payment
  - renter can mark ongoing/completed
  - cancellation with reason

- **Payments**
  - total cost = (perHour × duration) + (perKm × distance)
  - 2% service fee collected online
  - remaining amount paid offline/in person

- **Disputes**
  - farmer can raise dispute for ongoing bookings (breakdown/weather/no-show, etc.)
  - admin resolves within target window (as per workflow)

- **Reviews**
  - only after completed bookings
  - updates equipment average rating

## Tech Stack
**Frontend (`frontend/`)**
- React + Vite
- Tailwind CSS
- React Router
- Axios
- React Leaflet + OpenStreetMap
- i18next (English/Kannada)
- Lucide React (icons)

**Backend (`backend/`)**
- Node.js + Express
- MongoDB + Mongoose
- JWT authentication
- Multer (image uploads)

## Repo Structure
- `frontend/` — React UI
- `backend/` — REST API server
- `demo/` — demo video (optional)

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

Frontend
cd frontend
npm install
npm run dev

