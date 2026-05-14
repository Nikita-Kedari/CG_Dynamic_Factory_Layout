'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { login, getMockLoginCredentials } from '@/lib/auth';
import { Factory, Eye, EyeOff, AlertCircle, InfoIcon } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const mockCredentials = getMockLoginCredentials();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = login({ username, password });

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
    } catch (err) {
      setError('An error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (cred: { username: string; password: string }) => {
    setUsername(cred.username);
    setPassword(cred.password);
  };

  return (
    <div className="flex min-h-screen">
      {/* Left side - Form */}
      <div className="flex w-full flex-col justify-center px-4 py-12 sm:w-1/2 sm:px-12 lg:px-16">
        <div className="mx-auto w-full max-w-sm">
          <Link href="/" className="mb-12 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Factory className="h-6 w-6" />
            </div>
            <span className="text-2xl font-bold text-primary">FloorViz</span>
          </Link>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-primary">Welcome back</h1>
            <p className="mt-2 text-muted-foreground">
              Sign in to your account to manage your factory operations
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium text-primary">
                Email Address
              </label>
              <Input
                id="username"
                type="email"
                placeholder="admin@factory.com"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                className="border-border"
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-primary">
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
                  className="border-border pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
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

            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={isLoading || !username || !password}
              size="lg"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-8 rounded-lg border border-border bg-card p-4">
            <div className="mb-3 flex items-center gap-2">
              <InfoIcon className="h-4 w-4 text-accent" />
              <p className="text-sm font-medium text-primary">Demo Credentials</p>
            </div>
            <p className="mb-3 text-xs text-muted-foreground">
              Click any credential to auto-fill the form for quick access
            </p>
            <div className="space-y-2">
              {mockCredentials.map((cred) => (
                <button
                  key={cred.username}
                  onClick={() => handleQuickLogin(cred)}
                  className="w-full rounded-lg bg-secondary p-3 text-left text-sm transition-colors hover:bg-secondary/80"
                >
                  <div className="font-medium text-primary">{cred.role.toUpperCase()}</div>
                  <div className="text-xs text-muted-foreground">{cred.username}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{' '}
              <a href="#" className="font-medium text-accent hover:underline">
                Contact us
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Image/Content */}
      <div className="hidden w-1/2 bg-gradient-to-br from-primary to-primary/80 p-12 text-primary-foreground sm:flex sm:flex-col sm:justify-center">
        <div className="mx-auto max-w-sm space-y-8">
          <div>
            <h2 className="text-4xl font-bold">Manage your factory with confidence</h2>
            <p className="mt-4 text-lg text-primary-foreground/80">
              Real-time visibility, instant configuration, and intelligent automation for modern manufacturing.
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                title: 'Real-Time Monitoring',
                description: 'See your entire factory floor at a glance',
              },
              {
                title: 'Dynamic Configuration',
                description: 'Update your layout without any downtime',
              },
              {
                title: 'Instant Activation',
                description: 'Deploy changes with confidence',
              },
            ].map((feature, idx) => (
              <div key={idx} className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/20 text-accent">
                    ✓
                  </div>
                </div>
                <div>
                  <h3 className="font-medium">{feature.title}</h3>
                  <p className="text-sm text-primary-foreground/70">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-primary-foreground/20 bg-primary-foreground/10 p-4">
            <p className="text-sm italic text-primary-foreground/80">
              "This platform transformed how we manage our production. Configuration time reduced by 80%."
            </p>
            <p className="mt-2 text-xs text-primary-foreground/60">
              — Manufacturing Director, Tier 1 Supplier
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
