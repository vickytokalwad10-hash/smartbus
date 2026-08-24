# JD College Bus Pass Management & Live Tracking System

A full-stack, mobile-responsive smart transit application custom-built for **JD College of Engineering & Technology**. The platform seamlessly handles digital bus pass generation, real-time GPS fleet tracking, and comprehensive administrative monitoring for college transport authorities.

---

## 🎯 Project Definition & Scope

This platform is strictly designed to serve as a **College Bus Pass Management and Live Tracking System**. Its primary objectives are:
1. **Digital Pass Lifecycle**: Allow students and faculty to apply, pay for, and download digital QR bus passes without manual paperwork.
2. **Real-time Live Tracking**: Provide commuters and administrators with live GPS telemetry of all active college buses.
3. **Overall Administrative Monitoring**: Give college administrators a bird's-eye view of fleet operations, pass revenues, seat occupancy, and driver activities.

---

## 👥 App Structure & Multi-Role Portals

The application is structured into four distinct, role-based portals:

### 1. Student Portal (`/student`)
- **Digital Pass Management**: View active passes as digital QR codes.
- **Pass Renewal**: Apply for monthly/semester passes with automated student fee concessions.
- **Live Tracking**: Locate assigned buses on the live campus map.
- **Payment History**: View and download transaction receipts.

### 2. Faculty / Teacher Portal (`/teacher`)
- **Dashboard**: View daily college routes and quick actions.
- **Pass Management**: Purchase and manage staff bus passes.
- **Route Search**: Search for specific campus routes and view stopping points.

### 3. Driver / Conductor Portal (`/driver`)
- **Live Trip Execution**: Start shifts, broadcasting live GPS location to the backend via WebSocket (Socket.IO).
- **Seat Occupancy**: Update live seat availability (passengers boarding/alighting).
- **Pass Scanner**: Scan Student/Faculty QR passes using the device camera to validate boarding.

### 4. College Administrative Portal (`/admin`)
- **Overall Fleet Monitoring**: Live map overview of all buses currently in transit.
- **Pass Approvals**: Review and approve/reject pending student pass applications.
- **Route Management**: Define stops, frequencies, and paths for college shuttles.
- **Analytics & AI Predictions**: Analyze daily ridership, revenue, and view AI-predicted peak congestion metrics.

---

## 📱 Mobile App (APK) Architecture

The application is built using a React (Vite) frontend, encapsulated inside a **Capacitor** native wrapper to produce an Android APK (`JD_College_Bus_Pass.apk`). 
- **Responsive Viewport**: All dashboards dynamically adapt to phone screens using bottom-tab navigation and hamburger drawers.
- **Native Navigation**: Integrated Capacitor hardware back-button handling.
- **Network Permissions**: Configured for local network backend communication (`android:usesCleartextTraffic`).

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS, React Router (HashRouter for APK support), Recharts, Leaflet.js
- **Mobile Wrapper**: Capacitor (`@capacitor/core`, `@capacitor/android`, `@capacitor/app`)
- **Backend**: Node.js, Express.js, Socket.IO (Real-time telemetry)
- **Database**: MongoDB (Mongoose ODM)

---

## 🔑 Demo Credentials

| Role | Email | Password | User Name |
|---|---|---|---|
| **Student** | `student@test.com` | `test123` | Aarav Sharma |
| **Faculty** | `teacher@test.com` | `test123` | Prof. Kulkarni |
| **Driver** | `driver@test.com` | `test123` | Sanjay Raut |
| **Admin** | `admin@test.com` | `test123` | JD Transport Admin |

---

## 🚀 Getting Started (Development)

### 1. Start the Backend Server
```bash
cd server
npm run dev
```

### 2. Start the Frontend Web App
```bash
cd client
npm run dev
```

### 3. Build the Android APK
```bash
npm run build:apk
```
*This command bundles the React build, syncs Capacitor, runs Gradle to assemble the Android Debug APK, and copies it to the project root as `JD_College_Bus_Pass.apk`.*
