'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { login, register, getMockLoginCredentials } from '@/lib/auth';
import { Factory, Eye, EyeOff, AlertCircle, InfoIcon, KeyRound, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { UserRole } from '@/lib/types';

export default function LoginPage() {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('developer');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const mockCredentials = getMockLoginCredentials();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      if (isRegisterMode) {
        // Registration Mode
        const result = await register({ username, password, role });
        if (!result) {
          setError('Failed to create account. Username may already exist.');
          setIsLoading(false);
          return;
        }
        
        setSuccess('Account created successfully! Logging you in...');
        setTimeout(() => {
          if (role === 'admin') {
            router.push('/admin');
          } else if (role === 'developer') {
            router.push('/developer');
          } else {
            router.push('/');
          }
        }, 1500);
      } else {
        // Login Mode
        const result = await login({ username, password });
        if (!result) {
          setError('Invalid username or password');
          setIsLoading(false);
          return;
        }

        // Redirect based on role
        if (result.user.role === 'admin') {
          router.push('/admin');
        } else if (result.user.role === 'developer') {
          router.push('/developer');
        } else {
          router.push('/');
        }
      }
    } catch (err) {
      setError('An error occurred. Please verify backend connection and try again.');
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (cred: { username: string; password: string; role: UserRole }) => {
    setUsername(cred.username);
    setPassword(cred.password);
    setRole(cred.role);
    setIsRegisterMode(false);
  };

  return (
    <div className="flex min-h-screen bg-[#030712] text-slate-100 selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* Dynamic Background Accents */}
      <div className="absolute top-[-20%] left-[-20%] w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[150px] pointer-events-none" />

      {/* Left side - Form */}
      <div className="flex w-full flex-col justify-center px-6 py-12 sm:w-1/2 sm:px-12 lg:px-16 z-10">
        <div className="mx-auto w-full max-w-md">
          <Link href="/" className="mb-10 flex items-center gap-3 group">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 group-hover:scale-105 transition-all">
              <Factory className="h-6 w-6" />
            </div>
            <span className="text-2xl font-black tracking-tight text-white">FloorViz <span className="text-indigo-500">Pro</span></span>
          </Link>

          <div className="mb-8">
            <h1 className="text-3xl font-black text-white tracking-tight">
              {isRegisterMode ? 'Create your account' : 'Welcome back'}
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              {isRegisterMode 
                ? 'Register your profile to access factory layouts and designs' 
                : 'Sign in to access your factory blueprints and control editor'}
            </p>
          </div>

          {/* Form Tabs */}
          <div className="grid grid-cols-2 bg-slate-900/80 p-1 rounded-xl mb-6 border border-slate-800">
            <button
              onClick={() => { setIsRegisterMode(false); setError(''); setSuccess(''); }}
              className={`py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${!isRegisterMode ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <KeyRound className="h-3.5 w-3.5" />
              Sign In
            </button>
            <button
              onClick={() => { setIsRegisterMode(true); setError(''); setSuccess(''); }}
              className={`py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${isRegisterMode ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <UserPlus className="h-3.5 w-3.5" />
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-3 rounded-xl border border-rose-500/30 bg-rose-500/5 p-3.5 text-xs font-semibold text-rose-400 animate-in fade-in zoom-in-95 duration-200">
                <AlertCircle className="h-5 w-5 flex-shrink-0 text-rose-500" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3.5 text-xs font-semibold text-emerald-400 animate-in fade-in zoom-in-95 duration-200">
                <AlertCircle className="h-5 w-5 flex-shrink-0 text-emerald-500" />
                <span>{success}</span>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="username" className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
                Username
              </label>
              <Input
                id="username"
                type="text"
                placeholder="e.g. nikita_k"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                className="bg-slate-900/60 border-slate-800 focus:border-indigo-500 rounded-xl py-6 text-sm text-white"
                autoComplete="username"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="bg-slate-900/60 border-slate-800 focus:border-indigo-500 rounded-xl py-6 pr-10 text-sm text-white"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Role selection - always visible to specify access details */}
            <div className="space-y-2">
              <label htmlFor="role" className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
                Assigned System Role
              </label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                disabled={isLoading}
                className="w-full bg-slate-900/60 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-3.5 text-sm font-bold text-white outline-none cursor-pointer appearance-none transition-all"
              >
                <option value="developer">Developer (Editing / Drag & Drop / Auto-Layout)</option>
                <option value="admin">Administrator (Approvals / Finalize Snapshots)</option>
                <option value="viewer">Viewer (Read-only Factory Monitoring)</option>
              </select>
            </div>

            <Button
              type="submit"
              className="w-full bg-indigo-600 text-white hover:bg-indigo-500 font-bold rounded-xl py-6 shadow-lg shadow-indigo-600/20 active:scale-98 transition-all"
              disabled={isLoading || !username || !password}
              size="lg"
            >
              {isLoading 
                ? (isRegisterMode ? 'Creating account...' : 'Signing in...') 
                : (isRegisterMode ? 'Create Account' : 'Sign In')}
            </Button>
          </form>

          {/* Seed Demo Credentials */}
          <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/40 p-5 backdrop-blur-sm">
            <div className="mb-3 flex items-center gap-2">
              <InfoIcon className="h-4 w-4 text-indigo-400" />
              <p className="text-sm font-bold text-white uppercase tracking-wider">Pre-Seeded Credentials</p>
            </div>
            <p className="mb-4 text-xs text-slate-400">
              Click any credential below to auto-fill the forms with standard seeded accounts:
            </p>
            <div className="grid grid-cols-3 gap-3">
              {mockCredentials.map((cred) => (
                <button
                  key={cred.username}
                  onClick={() => handleQuickLogin(cred)}
                  className="rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 p-3 text-left transition-all hover:scale-102 flex flex-col justify-between"
                >
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{cred.role}</span>
                  <span className="text-xs font-bold text-white mt-1 truncate">{cred.username}</span>
                  <span className="text-[9px] text-slate-500 font-medium truncate mt-0.5">pass123</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Premium Branding / Accents */}
      <div className="hidden w-1/2 bg-gradient-to-br from-indigo-950 via-slate-950 to-[#030712] p-16 text-slate-200 sm:flex sm:flex-col sm:justify-center border-l border-slate-900 relative">
        <div className="absolute top-[30%] right-[10%] w-[350px] h-[350px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="mx-auto max-w-md space-y-10 z-10">
          <div>
            <h2 className="text-4xl font-black text-white tracking-tight leading-tight">
              Manage your factory layout with <span className="text-indigo-400">precision</span>
            </h2>
            <p className="mt-4 text-base text-slate-400 leading-relaxed">
              Industrial grade collision-avoidance constraints, orthogonal flow pathfinding, and interactive role-based controls.
            </p>
          </div>

          <div className="space-y-5">
            {[
              {
                title: 'Intelligent A* Routing',
                description: 'Obstacle-aware orthogonal flow routing with turn penalties',
              },
              {
                title: 'Collision Guard',
                description: 'Enforces strict 10-unit minimum workstation spacing',
              },
              {
                title: 'Dynamic Topologies',
                description: 'Auto-layout models including L-Type, U-Type, and S-Line',
              },
            ].map((feature, idx) => (
              <div key={idx} className="flex gap-4 items-start">
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                  ✓
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">{feature.title}</h3>
                  <p className="text-xs text-slate-400 mt-1">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-5 backdrop-blur-sm">
            <p className="text-xs italic text-slate-400 leading-relaxed">
              "The dynamic layout engine allows our developers to safely reposition heavy line segments while ensuring orthogonal flow line continuity."
            </p>
            <p className="mt-3 text-[10px] text-indigo-400 font-bold uppercase tracking-widest">
              — Lead Systems Architect, Capgemini
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
