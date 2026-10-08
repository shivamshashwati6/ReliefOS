import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  MapPin, 
  Boxes, 
  ClipboardList, 
  Sliders, 
  AlertOctagon, 
  Activity, 
  Settings, 
  LifeBuoy,
  Bell,
  Building,
  Shield,
  HeartPulse,
  Package,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useDisaster } from '../../context/DisasterContext';
import { useReports } from '../../context/ReportContext';
import { ROLES, DEPARTMENTS, DEPARTMENT_LABELS } from '../../config/roles';
import { cn } from '../../lib/utils';

export function Sidebar({ isOpen = true, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, role, logout } = useAuth();
  const { currentDisaster } = useDisaster();
  const { getReportsByDisaster } = useReports();

  const disasterReports = getReportsByDisaster(currentDisaster?.id);

  // Role display label
  const getRoleLabel = () => {
    if (role === ROLES.CITIZEN) return 'Citizen';
    if (role === ROLES.COMMAND_CENTER) return 'Command Center';
    if (role === ROLES.DEPARTMENT) {
      return currentUser?.department
        ? DEPARTMENT_LABELS[currentUser.department] || 'Department'
        : 'Department';
    }
    return 'User';
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  // 1. Role-Specific Primary Navigation items (Section 7)
  const getNavLinks = () => {
    if (role === ROLES.CITIZEN) {
      return [
        { id: 'citizen-dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/citizen/dashboard' },
        { id: 'citizen-emergency', label: 'Report Emergency', icon: AlertOctagon, path: '/report-emergency', highlight: true },
        { id: 'citizen-my-reports', label: 'My Reports', icon: FileText, path: '/reports/my' },
        { id: 'citizen-help', label: 'Nearby Help', icon: LifeBuoy, path: '/citizen/help' },
        { id: 'citizen-notifications', label: 'Notifications', icon: Bell, path: '/citizen/notifications' },
      ];
    }

    if (role === ROLES.DEPARTMENT) {
      let deptIcon = Building;
      if (currentUser?.department === DEPARTMENTS.HEALTH) deptIcon = HeartPulse;
      if (currentUser?.department === DEPARTMENTS.FOOD_SUPPLY) deptIcon = Package;
      if (currentUser?.department === DEPARTMENTS.RESCUE) deptIcon = Shield;

      return [
        { id: 'department-dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/department/dashboard' },
        { id: 'department-my-dept', label: 'My Department', icon: deptIcon, path: '/department/overview' },
        { id: 'department-reports', label: 'Reports', icon: FileText, path: '/reports', badge: disasterReports.length },
        { id: 'department-resources', label: 'Resources', icon: Boxes, path: '/resources' },
        { id: 'department-zones', label: 'Priority Zones', icon: MapPin, path: '/zones' },
      ];
    }

    // Default: COMMAND_CENTER
    return [
      { id: 'command-dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/command/dashboard' },
      { id: 'command-reports', label: 'Reports', icon: FileText, path: '/reports', badge: disasterReports.length },
      { id: 'command-zones', label: 'Zones', icon: MapPin, path: '/zones' },
      { id: 'command-allocation', label: 'Resource Allocation', icon: Boxes, path: '/allocation' },
      { id: 'command-resources', label: 'Resources', icon: Boxes, path: '/resources' },
      { id: 'command-plans', label: 'Response Plans', icon: ClipboardList, path: '/response-plans' },
      { id: 'command-monitoring', label: 'Response Monitoring', icon: Activity, path: '/response-monitoring' },
    ];
  };

  const navLinks = getNavLinks();

  const handleNavClick = (path) => {
    navigate(path);
    if (onClose) onClose();
  };

  const isCurrentActive = (path) => {
    if (path === '/command/dashboard') {
      return location.pathname === '/command/dashboard' || location.pathname === '/';
    }
    if (path === '/citizen/dashboard') {
      return location.pathname === '/citizen/dashboard';
    }
    if (path === '/department/dashboard') {
      return location.pathname === '/department/dashboard';
    }
    if (path === '/department/overview') {
      return location.pathname.startsWith('/department') && location.pathname !== '/department/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:z-auto",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo & Brand Header */}
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs shrink-0">
              <LifeBuoy className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-base text-slate-900 tracking-tight leading-tight">
                RELIEF-OS
              </div>
              <div className="text-xs text-slate-500 font-normal leading-tight">
                Disaster Response Platform
              </div>
            </div>
          </div>
        </div>

        {/* Clean Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 flex flex-col justify-between">
          <nav className="space-y-1">
            {navLinks.map((item) => {
              const IconComponent = item.icon;
              const isActive = isCurrentActive(item.path);

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.path)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left",
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : item.highlight
                      ? "text-red-700 bg-red-50/70 hover:bg-red-50 hover:text-red-800"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <IconComponent
                      className={cn(
                        "w-4 h-4 shrink-0",
                        isActive 
                          ? "text-blue-600" 
                          : item.highlight 
                          ? "text-red-600" 
                          : "text-slate-400"
                      )}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Settings at the bottom of navigation */}
          {role !== ROLES.CITIZEN && (
            <div className="pt-3 border-t border-slate-100 mt-4">
              <button
                onClick={() => handleNavClick('/settings')}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left",
                  isCurrentActive('/settings')
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                )}
              >
                <Settings className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="truncate">Settings</span>
              </button>
            </div>
          )}
        </div>

        {/* Small User Section at the bottom (Section 7) */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/70">
          <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white border border-slate-200">
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-900 truncate">
                {currentUser?.name || 'User'}
              </div>
              <div className="text-[11px] text-slate-500 truncate">
                {getRoleLabel()}
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0"
              title="Logout"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
