import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Menu, LogOut, User as UserIcon } from 'lucide-react';
import { CRITICAL_ALERTS } from '../../data/demoData';
import { useDisaster } from '../../context/DisasterContext';
import { useAuth } from '../../context/AuthContext';
import { ROLES, ROLE_LABELS, DEPARTMENT_LABELS } from '../../config/roles';

export function TopHeader({ onToggleSidebar, onOpenAlerts }) {
  const navigate = useNavigate();
  const { currentDisaster } = useDisaster();
  const { currentUser, role, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  // Human-friendly role and department label
  const getRoleDisplay = () => {
    if (role === ROLES.CITIZEN) {
      return 'Citizen';
    }
    if (role === ROLES.COMMAND_CENTER) {
      return 'Command Center';
    }
    if (role === ROLES.DEPARTMENT) {
      return currentUser?.department
        ? DEPARTMENT_LABELS[currentUser.department] || 'Department'
        : 'Department';
    }
    return 'Authorized User';
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 sm:px-6 py-2.5">
      <div className="flex items-center justify-between gap-4">
        {/* Left Section: Mobile Menu + Disaster Identity */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 lg:hidden shrink-0 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Toggle navigation drawer"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-semibold text-slate-900 tracking-tight truncate">
                {currentDisaster.name || 'Assam Flood Response'}
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Active
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                Simulation Mode
              </span>
            </div>
            <p className="text-xs text-slate-500 truncate">
              {currentDisaster.region || 'Morigaon, Assam'}
            </p>
          </div>
        </div>

        {/* Right Section: User Profile & Logout (No Clock or Telemetry) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Alerts Button (for Command Center & Department only) */}
          {role !== ROLES.CITIZEN && onOpenAlerts && (
            <button
              onClick={onOpenAlerts}
              className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="View Alerts"
              aria-label="Alerts"
            >
              <Bell className="w-4 h-4 text-slate-500" />
              <span className="hidden md:inline">Alerts</span>
              {CRITICAL_ALERTS.length > 0 && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-semibold text-white">
                  {CRITICAL_ALERTS.length}
                </span>
              )}
            </button>
          )}

          {/* User Profile Info */}
          <div className="flex items-center gap-2.5 pl-2 sm:pl-3 border-l border-slate-200">
            <div className="flex flex-col items-end text-right">
              <span className="text-xs font-bold text-slate-900 leading-tight">
                {currentUser?.name || 'User'}
              </span>
              <span className="text-[11px] text-slate-500 leading-tight">
                {getRoleDisplay()}
              </span>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-red-50 hover:border-red-200 hover:text-red-700 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default TopHeader;
