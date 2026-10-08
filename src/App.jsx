import React, { useState } from 'react';
import { Routes, Route, Navigate, Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import TopHeader from './components/layout/TopHeader';
import AlertsModal from './components/layout/AlertsModal';
import ModulePlaceholder from './components/layout/ModulePlaceholder';
import ProtectedRoute from './components/auth/ProtectedRoute';

import LoginPage from './pages/LoginPage';
import CommandCenterPage from './pages/CommandCenterPage';
import CitizenDashboardPage from './pages/CitizenDashboardPage';
import CitizenMyReportsPage from './pages/CitizenMyReportsPage';
import CitizenHelpPage from './pages/CitizenHelpPage';
import CitizenNotificationsPage from './pages/CitizenNotificationsPage';
import DepartmentDashboardPage from './pages/DepartmentDashboardPage';
import CreateDisasterPage from './pages/CreateDisasterPage';
import ReportEmergencyPage from './pages/ReportEmergencyPage';
import ReportsPage from './pages/ReportsPage';
import ZonesPage from './pages/ZonesPage';
import ZoneDetailPage from './pages/ZoneDetailPage';

import { useAuth } from './context/AuthContext';
import { ROLES, ROLE_DEFAULT_ROUTES } from './config/roles';

/**
 * RootRedirect: Intelligent redirect based on auth status and role
 */
function RootRedirect() {
  const { isAuthenticated, currentUser } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const destination = ROLE_DEFAULT_ROUTES[currentUser?.role] || '/login';
  return <Navigate to={destination} replace />;
}

/**
 * AppLayout: Main operational workspace wrapper for authenticated sessions
 */
function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [alertsModalOpen, setAlertsModalOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
      {/* 1. Left Sidebar Navigation */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* 2. Main Operational Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header */}
        <TopHeader
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          onOpenAlerts={() => setAlertsModalOpen(true)}
        />

        {/* Scrollable Viewport with Client-Side Routing */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 bg-slate-50">
          <div className="max-w-7xl mx-auto">
            <Outlet context={{ onOpenAlerts: () => setAlertsModalOpen(true) }} />
          </div>
        </main>
      </div>

      {/* 3. Tactical Critical Alerts Feed Dialog */}
      <AlertsModal
        isOpen={alertsModalOpen}
        onClose={() => setAlertsModalOpen(false)}
      />
    </div>
  );
}

/**
 * Generic Placeholder Wrapper component that returns to the active role's dashboard
 */
function PlaceholderWrapper({ moduleId }) {
  const navigate = useNavigate();
  const { role } = useAuth();
  const returnPath = ROLE_DEFAULT_ROUTES[role] || '/';

  return (
    <ModulePlaceholder
      moduleId={moduleId}
      onReturnHome={() => navigate(returnPath)}
    />
  );
}

export function App() {
  return (
    <Routes>
      {/* Public Route: Login */}
      <Route path="/login" element={<LoginPage />} />

      {/* Root redirect */}
      <Route path="/" element={<RootRedirect />} />

      {/* Protected Routes wrapped in AppLayout */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        {/* ============================================================ */}
        {/* CITIZEN ROUTES */}
        {/* ============================================================ */}
        <Route
          path="/citizen/dashboard"
          element={
            <ProtectedRoute allowedRoles={[ROLES.CITIZEN]}>
              <CitizenDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/citizen"
          element={<Navigate to="/citizen/dashboard" replace />}
        />
        <Route
          path="/reports/my"
          element={
            <ProtectedRoute allowedRoles={[ROLES.CITIZEN]}>
              <CitizenMyReportsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/citizen/reports"
          element={<Navigate to="/reports/my" replace />}
        />
        <Route
          path="/citizen/help"
          element={
            <ProtectedRoute allowedRoles={[ROLES.CITIZEN]}>
              <CitizenHelpPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/citizen/notifications"
          element={
            <ProtectedRoute allowedRoles={[ROLES.CITIZEN]}>
              <CitizenNotificationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/report-emergency"
          element={
            <ProtectedRoute allowedRoles={[ROLES.CITIZEN, ROLES.COMMAND_CENTER]}>
              <ReportEmergencyPage />
            </ProtectedRoute>
          }
        />

        {/* ============================================================ */}
        {/* COMMAND CENTER ROUTES */}
        {/* ============================================================ */}
        <Route
          path="/command/dashboard"
          element={
            <ProtectedRoute allowedRoles={[ROLES.COMMAND_CENTER]}>
              <CommandCenterPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/command"
          element={<Navigate to="/command/dashboard" replace />}
        />
        <Route
          path="/command/*"
          element={<Navigate to="/command/dashboard" replace />}
        />
        <Route
          path="/create-disaster"
          element={
            <ProtectedRoute allowedRoles={[ROLES.COMMAND_CENTER]}>
              <CreateDisasterPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/plans"
          element={
            <ProtectedRoute allowedRoles={[ROLES.COMMAND_CENTER]}>
              <PlaceholderWrapper moduleId="response-plans" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/simulation"
          element={
            <ProtectedRoute allowedRoles={[ROLES.COMMAND_CENTER]}>
              <PlaceholderWrapper moduleId="simulation-lab" />
            </ProtectedRoute>
          }
        />

        {/* ============================================================ */}
        {/* DEPARTMENT ROUTES */}
        {/* ============================================================ */}
        <Route
          path="/department/dashboard"
          element={
            <ProtectedRoute allowedRoles={[ROLES.DEPARTMENT]}>
              <DepartmentDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/department"
          element={<Navigate to="/department/dashboard" replace />}
        />
        <Route
          path="/department/health"
          element={
            <ProtectedRoute allowedRoles={[ROLES.DEPARTMENT]}>
              <DepartmentDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/department/supply"
          element={
            <ProtectedRoute allowedRoles={[ROLES.DEPARTMENT]}>
              <DepartmentDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/department/rescue"
          element={
            <ProtectedRoute allowedRoles={[ROLES.DEPARTMENT]}>
              <DepartmentDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/department/overview"
          element={
            <ProtectedRoute allowedRoles={[ROLES.DEPARTMENT]}>
              <DepartmentDashboardPage />
            </ProtectedRoute>
          }
        />

        {/* ============================================================ */}
        {/* SHARED OPERATIONAL ROUTES (COMMAND CENTER & DEPARTMENT) */}
        {/* ============================================================ */}
        <Route
          path="/reports"
          element={
            <ProtectedRoute allowedRoles={[ROLES.COMMAND_CENTER, ROLES.DEPARTMENT]}>
              <ReportsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/zones"
          element={
            <ProtectedRoute allowedRoles={[ROLES.COMMAND_CENTER, ROLES.DEPARTMENT]}>
              <ZonesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/zones/:zoneId"
          element={
            <ProtectedRoute allowedRoles={[ROLES.COMMAND_CENTER, ROLES.DEPARTMENT]}>
              <ZoneDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/resources"
          element={
            <ProtectedRoute allowedRoles={[ROLES.COMMAND_CENTER, ROLES.DEPARTMENT]}>
              <PlaceholderWrapper moduleId="resources" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute allowedRoles={[ROLES.COMMAND_CENTER, ROLES.DEPARTMENT]}>
              <PlaceholderWrapper moduleId="settings" />
            </ProtectedRoute>
          }
        />

        {/* Catch-all inside protected layout */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
