# RELIEF-OS — Disaster Response Platform

RELIEF-OS is an AI-powered disaster response coordination platform designed for crisis situations such as floods and natural emergencies. It unites Citizens, Command Center Operators, and Specialized Response Departments into a unified operational ecosystem.

---

## 🚀 Key Features

### 1. Role-Based Dashboards
- **Citizen Portal (`/citizen/dashboard`)**:
  - Urgent emergency reporting ("Report an Emergency").
  - Community safety notices and flash flood advisories.
  - Personal emergency report intake and status tracking.
  - Directory of nearby relief camps, shelters, and emergency helplines (`112`, `108`, `1070`).
- **Command Center (`/command/dashboard`)**:
  - Real-time tactical operational dashboard.
  - Dynamic Priority Zone scoring and mathematical breakdown.
  - Interactive GIS map visualization of affected sectors, shelters, and blocked transit routes.
  - Gemini AI recommendations and automated response actions.
  - Critical alerts feed and resource status tracking.
- **Department Operations Desk (`/department/dashboard`)**:
  - **Health Response**: Medical emergencies, clinical triage, medicine requisitions, and critical health zones.
  - **Food & Supply Response**: Ration allocation, potable water logistics, supply shortage alerts, and affected zone demands.
  - **Rescue Response**: Search & rescue calls, NDRF motorcraft deployment, flood depth tracking, and priority evacuation zones.

### 2. Multi-Role Authentication & Protected Routes
- Centralized auth service with persistent sessions via `localStorage`.
- Protected route barriers restricting unauthorized roles from internal command centers.
- Quick 1-click Demo Switching for prototype demonstrations and hackathon judging.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite 8, Tailwind CSS, Lucide React, Framer Motion
- **Mapping & Visualization**: Leaflet, React-Leaflet, Recharts
- **Backend**: Node.js, Express, Google Gemini AI SDK (`@google/genai`)

---

## 📦 Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### Installation & Run

1. **Install Frontend Dependencies**:
   ```bash
   npm install
   ```

2. **Start Development Server**:
   ```bash
   npm run dev
   ```

3. **Build for Production**:
   ```bash
   npm run build
   ```

---

## 🔑 Demo Accounts

Use any of the demo accounts or click the corresponding 1-click button on the login screen (`/login`):

| Role | Email | Password | Home Route |
|---|---|---|---|
| **Citizen** | `citizen@relief.local` | `demo` | `/citizen/dashboard` |
| **Command Center** | `command@relief.local` | `demo` | `/command/dashboard` |
| **Health Department** | `health@relief.local` | `demo` | `/department/dashboard` |
| **Food & Supply** | `supply@relief.local` | `demo` | `/department/dashboard` |
| **Rescue Department** | `rescue@relief.local` | `demo` | `/department/dashboard` |
