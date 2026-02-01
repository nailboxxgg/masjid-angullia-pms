# Masjid Angullia Management Portal - Project Walkthrough

## Overview
This portal manages the core operations for the mosque: Family Registry, Events, Donations, and Requests.

### Tech Stack
- **Frontend**: Next.js 16 (React 19)
- **Styling**: Tailwind CSS v4
- **Backend**: Firebase (Auth + Firestore)
- **Payments**: PayMongo (GCash, Maya, BPI, BDO)

## 🚀 Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup**
   The project requires a `.env.local` file. A mock file has been created for you.
   Update `NEXT_PUBLIC_FIREBASE_API_KEY` etc. with real credentials when ready.

3. **Run Development Server**
   ```bash
   npm run dev
   ```

## 📂 Modules Walkthrough

### 1. Dashboard (`/dashboard`)
Overview of total families, active events, and donation metrics.

### 2. Family Registry (`/families`)
- **Register New Family**: Click "Register Family" to add a head of family and members.
- **Search**: Filter families by name.

### 3. Events Management (`/events`)
- **Create Event**: Add title, date, location, and capacity.
- **View**: List of upcoming events with status indicators.

### 4. Donations (`/donations`)
- **PayMongo Integration**: Supports GCash, Maya, BPI, BDO.
- **Flow**: Select amount -> Select Method -> Redirect to Gateway (Mocked).

### 5. Requests (`/requests`)
- **Submit Request**: Forms for Zakat assistance, facility booking, etc.
- **Track Status**: View pending and completed requests.

## 🔐 Authentication
- **Login**: `/login` (Managed via Firebase Auth)
- **Signup**: `/signup` (Creates Auth user + Firestore Profile)

## 🎨 Design System
- **Colors**: Emerald Green (Primary), Royal Gold (Secondary)
- **Fonts**: Outfit (Headings), Inter (Body), Scheherazade New (Arabic)
