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
  Settings, 
  LifeBuoy,
  Bell,
  Building,
  Shield,
  HeartPulse,
  Package
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useDisaster } from '../../context/DisasterContext';
import { useReports } from '../../context/ReportContext';
import { ROLES, DEPARTMENTS, DEPARTMENT_LABELS } from '../../config/roles';
import { cn } from '../../lib/utils';

export function Sidebar({ isOpen = true, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, role } = useAuth();
  const { currentDisaster } = useDisaster();
  const { getReportsByDisaster, reports } = useReports();

  const disasterReports = getReportsByDisaster(currentDisaster?.id);

  // 1. Define Role-Specific Navigation items according to requirements
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
      // Pick icon based on department
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
        { id: 'department-settings', label: 'Settings', icon: Settings, path: '/settings' },
      ];
    }

    // Default: COMMAND_CENTER
    return [
      { id: 'command-dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/command/dashboard' },
      { id: 'command-reports', label: 'Reports', icon: FileText, path: '/reports', badge: disasterReports.length },
      { id: 'command-zones', label: 'Zones', icon: MapPin, path: '/zones' },
      { id: 'command-resources', label: 'Resources', icon: Boxes, path: '/resources' },
      { id: 'command-plans', label: 'Response Plans', icon: ClipboardList, path: '/plans' },
      { id: 'command-simulation', label: 'Simulation', icon: Sliders, path: '/simulation' },
    ];
  };

  const navLinks = getNavLinks();

  const handleNavClick = (item) => {
    navigate(item.path);
    if (onClose) onClose();
  };

  const isCurrentActive = (item) => {
    if (item.path === '/command/dashboard') {
      return location.pathname === '/command/dashboard' || location.pathname === '/';
    }
    if (item.path === '/citizen/dashboard') {
      return location.pathname === '/citizen/dashboard';
    }
    if (item.path === '/department/dashboard') {
      return location.pathname === '/department/dashboard';
    }
    if (item.path === '/department/overview') {
      return location.pathname.startsWith('/department') && location.pathname !== '/department/dashboard';
    }
    return location.pathname.startsWith(item.path);
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
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm shrink-0">
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
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <nav className="space-y-1">
            {navLinks.map((item) => {
              const IconComponent = item.icon;
              const isActive = isCurrentActive(item);

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item)}
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
                          : "text-slate-400 group-hover:text-slate-600"
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
        </div>

        {/* Bottom Current Disaster / Safety Status Card */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70">
          <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-2xs">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              {role === ROLES.CITIZEN ? 'Active Advisory' : 'Current Incident'}
            </div>
            <div className="text-sm font-semibold text-slate-900 leading-snug truncate" title={currentDisaster?.name}>
              {currentDisaster?.name || 'Assam Flood Response'}
            </div>
            <div className="text-xs text-slate-500 truncate mt-0.5">
              {currentDisaster?.region || 'Morigaon, Assam'}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
