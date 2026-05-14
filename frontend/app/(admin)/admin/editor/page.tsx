'use client';

import { AuthGuard } from '@/components/auth-guard';
import { GridEditor } from '@/components/admin/grid-editor';
import { logout, getCurrentUser } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { LogOut, Factory, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function EditorPage() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [layoutData, setLayoutData] = useState<any>(null);
  const [layoutId, setLayoutId] = useState<string | null>(null);
  const [layoutName, setLayoutName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [parentName, setParentName] = useState('Admin Console');
  const [parentUrl, setParentUrl] = useState('/admin');

  useEffect(() => {
    setIsClient(true);
    const user = getCurrentUser();
    if (user?.role === 'developer') {
      setParentName('Developer Portal');
      setParentUrl('/developer');
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    // Use full URL to avoid port confusion
    const baseUrl = 'http://localhost:4000/api';
    
    fetch(`${baseUrl}/layouts`)
      .then(res => res.json())
      .then(data => {
        if (!Array.isArray(data)) {
          console.warn('Backend returned non-array data. Using fallback.');
          return;
        }

        if (id) {
          const matched = data.find((l: any) => l.id.toString() === id.toString());
          if (matched) {
            setLayoutData(matched.factory);
            setLayoutId(matched.id);
            setLayoutName(matched.name);
            return;
          }
        }
        
        const active = data.find((l: any) => l.isActive) || data[0];
        if (active) {
          setLayoutData(active.factory);
          setLayoutId(active.id);
          setLayoutName(active.name);
        }
      })
      .catch(err => {
        console.warn('Backend fetch failed. Using fallback factory.', err);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const handleSaveFactory = async (factory: any) => {
    console.log('Factory triggered save:', factory);
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
    if (layoutId) {
      try {
        await fetch(`${baseUrl}/layouts/${layoutId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ factory })
        });
        console.log('Successfully saved to active layout record.');
      } catch (err) {
        console.error('Failed remotely saving layout:', err);
      }
    }
  };

  return (
    <AuthGuard>
      <div className="flex h-screen flex-col bg-slate-50">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-sm">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
                <Factory className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  Layout Editor {layoutName && <span className="text-indigo-600">- {layoutName}</span>}
                </h1>
                <p className="text-xs text-slate-500">Visual factory layout designer</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 border border-emerald-100">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm font-medium text-emerald-700">Editor Active</span>
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

          {/* Breadcrumb */}
          <nav className="border-t border-slate-100 bg-slate-50/60 px-4 py-2 text-xs sm:px-6 lg:px-8">
            <div className="flex items-center gap-2">
              <Link href={parentUrl} className="text-slate-400 hover:text-indigo-600 transition-colors">
                {parentName}
              </Link>
              <ChevronRight className="h-3 w-3 text-slate-300" />
              <span className="text-indigo-600 font-medium">Layout Editor</span>
            </div>
          </nav>
        </header>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {isClient && !loading ? (
            <GridEditor onSave={handleSaveFactory} initialFactory={layoutData} isAdmin={getCurrentUser()?.role === 'admin'} layoutId={layoutId} />
          ) : (
            <div className="flex flex-1 items-center justify-center text-slate-400 bg-[#0f172a]">
              Loading layout...
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
