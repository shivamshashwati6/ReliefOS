import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LifeBuoy, 
  User, 
  ShieldAlert, 
  HeartPulse, 
  Package, 
  LifeBuoy as RescueIcon, 
  ArrowRight, 
  Lock, 
  Mail, 
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DEMO_USERS, ROLE_DEFAULT_ROUTES } from '../config/roles';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginAsDemoUser, isAuthenticated, currentUser } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // If already authenticated, redirect to role dashboard
  React.useEffect(() => {
    if (isAuthenticated && currentUser) {
      const targetPath = ROLE_DEFAULT_ROUTES[currentUser.role] || '/command/dashboard';
      navigate(targetPath, { replace: true });
    }
  }, [isAuthenticated, currentUser, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = login(email, password);
    setIsLoading(false);

    if (result.success) {
      const redirectPath = location.state?.from?.pathname || ROLE_DEFAULT_ROUTES[result.user.role] || '/command/dashboard';
      navigate(redirectPath, { replace: true });
    } else {
      setError(result.error);
    }
  };

  const handleDemoLogin = (demoUser) => {
    setError('');
    const result = loginAsDemoUser(demoUser.id);
    if (result.success) {
      const redirectPath = ROLE_DEFAULT_ROUTES[result.user.role] || '/command/dashboard';
      navigate(redirectPath, { replace: true });
    }
  };

  const demoAccounts = [
    {
      user: DEMO_USERS.find((u) => u.role === 'CITIZEN'),
      label: 'Citizen',
      roleDesc: 'Citizen incident reporting and local safety info',
      icon: User
    },
    {
      user: DEMO_USERS.find((u) => u.role === 'COMMAND_CENTER'),
      label: 'Command Center',
      roleDesc: 'Overall operational response and priority areas',
      icon: ShieldAlert
    },
    {
      user: DEMO_USERS.find((u) => u.department === 'HEALTH'),
      label: 'Health',
      roleDesc: 'Medical emergencies and field health teams',
      icon: HeartPulse
    },
    {
      user: DEMO_USERS.find((u) => u.department === 'FOOD_SUPPLY'),
      label: 'Food & Supply',
      roleDesc: 'Rations, water distribution, and supply logistics',
      icon: Package
    },
    {
      user: DEMO_USERS.find((u) => u.department === 'RESCUE'),
      label: 'Rescue',
      roleDesc: 'Rescue operations and evacuation boats',
      icon: RescueIcon
    }
  ];

  return (
    <div className="min-h-screen w-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 md:p-8 font-sans">
      <div className="w-full max-w-md space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 text-white shadow-xs mb-1">
            <LifeBuoy className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            RELIEF-OS
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Disaster Response Platform
          </p>
        </div>

        {/* Main Sign In Form Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-5">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900">
              Sign in to your account
            </h2>
            <p className="text-xs text-slate-500">
              Enter your credentials to access the platform.
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@relief.local"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            {/* Primary Action: Sign In */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 cursor-pointer"
            >
              <span>{isLoading ? 'Signing in...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Demo Accounts Section (Visually Secondary) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
          <div>
            <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Demo mode — prototype authentication
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Click a demo account below to test role-specific features:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {demoAccounts.map((item, index) => {
              const Icon = item.icon;
              const isLastOdd = index === demoAccounts.length - 1 && demoAccounts.length % 2 !== 0;

              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => item.user && handleDemoLogin(item.user)}
                  className={`flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-slate-100 hover:border-slate-300 text-left transition-colors text-slate-700 cursor-pointer ${
                    isLastOdd ? 'sm:col-span-2 sm:w-1/2 sm:mx-auto' : ''
                  }`}
                >
                  <div className="p-1.5 rounded-md bg-white border border-slate-200 text-slate-600 shrink-0">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-slate-900 block truncate">
                      {item.label}
                    </span>
                    <span className="text-[10px] text-slate-500 block truncate">
                      {item.user?.name}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}

export default LoginPage;
