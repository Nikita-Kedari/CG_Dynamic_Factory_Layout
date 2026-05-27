'use client';

import { AuthGuard } from '@/components/auth-guard';
import { Button } from '@/components/ui/button';
import { logout, getCurrentUser, getCurrentToken } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import {
  Upload,
  Grid3x3,
  History,
  LogOut,
  Factory,
  Zap,
  TrendingUp,
  Check,
  X,
  Users,
  ChevronRight,
  AlertCircle,
  ShieldCheck,
  Layout,
  CheckCircle,
  Copy
} from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

export default function AdminPage() {
  const router = useRouter();
  const user = getCurrentUser();
  const [layouts, setLayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLayouts();
  }, []);

  const fetchLayouts = async () => {
    const token = getCurrentToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const res = await fetch('/api/layouts', { headers });
      const data = await res.json();
      if (Array.isArray(data)) {
        setLayouts(data.filter((l: any) => l.status !== 'draft'));
      } else {
        setLayouts([]);
      }
    } catch (error) {
      console.error('Failed to fetch layouts', error);
    }
  };

  const handleApprove = async (id: string) => {
    setLoading(true);
    const token = getCurrentToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      await fetch(`/api/layouts/${id}/approve`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ reviewedBy: user?.username || 'Admin' }),
      });
      await fetchLayouts();
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (id: string) => {
    const comment = prompt("Please enter a reason for rejection (this will be sent to the developer):");
    if (comment === null) return; // User cancelled

    setLoading(true);
    const token = getCurrentToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      await fetch(`/api/layouts/${id}/reject`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ reviewedBy: user?.username || 'Admin', adminComments: comment }),
      });

      await fetchLayouts();
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (id: string) => {
    setLoading(true);
    const token = getCurrentToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      await fetch('/api/layouts/active', {
        method: 'POST',
        headers,
        body: JSON.stringify({ id }),
      });
      await fetchLayouts();
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const handleCopyUrl = (layoutId: string) => {
    const url = `${window.location.origin}/view?id=${layoutId}`;
    navigator.clipboard.writeText(url).then(() => {
      toast({
        title: 'URL copied!',
        description: 'Anyone with this link can view the layout without logging in.',
      });
    });
  };

  const quickActions = [
    {
      icon: Layout,
      title: 'Layout Editor',
      description: 'Visual drag & drop editor',
      href: '/admin/editor',
      color: 'text-purple-600 bg-purple-50',
    },
    {
      icon: History,
      title: 'Rollback History',
      description: 'View active logs',
      href: '/admin/history',
      color: 'text-amber-600 bg-amber-50',
    },
  ];

  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-sm">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row py-4 sm:py-0 sm:h-16 items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Admin Console</h1>
                  <p className="text-xs text-slate-500">Configuration & Control</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 border border-emerald-100">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-sm font-medium text-emerald-700">System Online</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

          {/* Quick Actions */}
          <div className="mb-12 grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
            {quickActions.map((action, idx) => {
              const Icon = action.icon;
              return (
                <Link
                  key={idx}
                  href={action.href}
                  className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-indigo-300 hover:shadow-md"
                >
                  <div className={`mb-4 inline-flex rounded-xl p-3 ${action.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-bold text-slate-900">{action.title}</h3>
                  <p className="mt-1 text-sm text-slate-500">{action.description}</p>
                </Link>
              );
            })}
          </div>

          {/* Layout Management Section */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900">Layout Version Control</h3>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white overflow-x-auto w-full shadow-sm">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50/80">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Version Name</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Created At</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {layouts.map((layout) => (
                    <tr key={layout.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Link target="_blank" href={`/admin/editor?id=${layout.id}`} className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer">
                            {layout.name}
                          </Link>
                          <button
                            onClick={() => handleCopyUrl(layout.id)}
                            className="inline-flex items-center justify-center rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                            title="Copy shareable URL"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <span className="text-xs text-slate-400 font-mono mt-0.5">{layout.version}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{new Date(layout.createdAt).toLocaleDateString()} {new Date(layout.createdAt).toLocaleTimeString()}</td>
                      <td className="px-6 py-4">
                        {layout.isActive ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200 whitespace-nowrap">
                            <CheckCircle className="w-3 h-3 mr-1" /> Live
                          </span>
                        ) : layout.status === 'approved' ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200 whitespace-nowrap">
                            Approved
                          </span>
                        ) : layout.status === 'rejected' ? (
                          <div className="flex flex-col gap-2 min-w-[120px] max-w-[240px]">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200 w-fit whitespace-nowrap">Rejected</span>
                            {layout.adminComments && <p className="text-[10px] text-red-600 bg-red-50 p-2 rounded-lg border border-red-100 break-words leading-tight">{layout.adminComments}</p>}
                          </div>
                        ) : layout.status === 'pushed' ? (
                          <div className="flex flex-col gap-2 min-w-[120px] max-w-[240px]">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200 w-fit whitespace-nowrap">Changes Requested</span>
                            {layout.adminComments && <p className="text-[10px] text-blue-600 bg-blue-50 p-2 rounded-lg border border-blue-100 break-words leading-tight">{layout.adminComments}</p>}
                          </div>
                        ) : layout.status === 'pending' ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200 whitespace-nowrap">
                            <AlertCircle className="w-3 h-3 mr-1" /> Pending Review
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 whitespace-nowrap">
                            {layout.status || 'Inactive'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <Link href={`/admin/editor?id=${layout.id}`}>
                            <Button className="h-9 px-3 text-slate-700 border border-slate-200 bg-white hover:bg-slate-800 hover:text-white hover:border-slate-800 hover:scale-[1.02] hover:shadow-md active:scale-95 transition-all duration-200 text-xs font-medium rounded-md">
                               View
                            </Button>
                          </Link>
                          {(layout.status === 'pending' || layout.status === 'pushed') && (
                            <>
                              <Button
                                onClick={() => handleApprove(layout.id)}
                                disabled={loading}
                                className="bg-blue-600 hover:bg-blue-700 text-white h-9 px-3 rounded-md flex items-center justify-center shadow-sm"
                              >
                                <Check className="h-4 w-4 mr-1" /> Approve
                              </Button>
                              <Button
                                onClick={() => handleReject(layout.id)}
                                disabled={loading}
                                className="bg-rose-500 hover:bg-rose-600 text-white h-9 px-3 rounded-md flex items-center justify-center shadow-sm"
                              >
                                <X className="h-4 w-4 mr-1" /> Reject
                              </Button>
                            </>
                          )}
                          {layout.status === 'approved' && !layout.isActive && (
                            <Button
                              onClick={() => handleActivate(layout.id)}
                              disabled={loading}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white h-9 px-3 rounded-md flex items-center justify-center shadow-sm"
                            >
                              <Factory className="h-4 w-4 mr-1" /> Make Live
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
