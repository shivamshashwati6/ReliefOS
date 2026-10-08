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
  AlertCircle,
  Sparkles
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
      title: 'Citizen',
      desc: 'Resident incident reporting & community status',
      icon: User,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/70',
      badgeColor: 'bg-emerald-100 text-emerald-800'
    },
    {
      user: DEMO_USERS.find((u) => u.role === 'COMMAND_CENTER'),
      title: 'Command Center',
      desc: 'Tactical overview, zone prioritization & cross-agency ops',
      icon: ShieldAlert,
      color: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100/70',
      badgeColor: 'bg-blue-100 text-blue-800'
    },
    {
      user: DEMO_USERS.find((u) => u.department === 'HEALTH'),
      title: 'Health Department',
      desc: 'Medical triage, clinical teams & supply requisitions',
      icon: HeartPulse,
      color: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100/70',
      badgeColor: 'bg-rose-100 text-rose-800'
    },
    {
      user: DEMO_USERS.find((u) => u.department === 'FOOD_SUPPLY'),
      title: 'Food & Supply',
      desc: 'Ration distribution, potable water & supply inventory',
      icon: Package,
      color: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100/70',
      badgeColor: 'bg-amber-100 text-amber-800'
    },
    {
      user: DEMO_USERS.find((u) => u.department === 'RESCUE'),
      title: 'Rescue Department',
      desc: 'NDRF vessel deployment, flood evacuations & SAR ops',
      icon: RescueIcon,
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100/70',
      badgeColor: 'bg-indigo-100 text-indigo-800'
    }
  ];

  return (
    <div className="min-h-screen w-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 md:p-8 font-sans">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left Side: Brand Narrative & Quick Demo Selection */}
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-700">
              <LifeBuoy className="w-3.5 h-3.5 text-blue-600" />
              <span>RELIEF-OS Disaster Response Platform</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Rapid Coordination for Critical Operations
            </h1>
            
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl">
              Role-tailored interfaces empowering Citizens, Emergency Command Center Operators, and Specialized Response Departments.
            </p>
          </div>

          {/* Demo Mode Section */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Demo mode — prototype authentication
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">1-Click Instant Login</span>
            </div>

            <p className="text-xs text-slate-500">
              Select any role below to experience its tailored workflow and permissions immediately:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {demoAccounts.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.title}
                    type="button"
                    onClick={() => item.user && handleDemoLogin(item.user)}
                    className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${item.color} group`}
                  >
                    <div className="p-2 rounded-lg bg-white/80 shrink-0 shadow-2xs mt-0.5">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                          {item.title}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                      <div className="text-[11px] text-slate-600 truncate mt-0.5 font-medium">
                        {item.user?.email}
                      </div>
                      <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                        {item.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side: Traditional Login Form */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Sign in to your account
              </h2>
              <p className="text-xs text-slate-500">
                Use your credentials or pick from the demo accounts.
              </p>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. command@relief.local"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700">
                    Password
                  </label>
                  <span className="text-[11px] text-slate-400">Demo pwd: demo</span>
                </div>
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

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                <span>{isLoading ? 'Signing in...' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="pt-2 border-t border-slate-100 text-center">
              <p className="text-[11px] text-slate-500">
                Fast prototype test: click any demo role on the left to sign in directly.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default LoginPage;
