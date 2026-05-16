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

    if (!id) {
      setLoading(false);
      return;
    }

    const tryLoading = async () => {
      try {
        // 1. Try Local Mock Store first (for fresh uploads)
        const localRes = await fetch(`/api/layouts/${id}`);
        if (localRes.ok) {
          const localData = await localRes.json();
          if (localData.factory) {
            setLayoutData(localData.factory);
            setLayoutId(localData.id);
            setLayoutName(localData.name || localData.version);
            setLoading(false);
            return;
          }
        }

        // 2. Fallback to SQL Backend (for production data)
        const baseUrl = 'http://localhost:4000/api';
        const backendRes = await fetch(`${baseUrl}/layouts/${id}/view`);
        if (backendRes.ok) {
          const data = await backendRes.json();
          if (data.error) throw new Error(data.error);

          // Map backend database structure to frontend Factory type
          const mappedFactory = {
            id: data.version.layout_id.toString(),
            name: data.version.layout_name,
            width: data.canvas.width,
            height: data.canvas.length,
            gridUnit: 50,
            areas: (data.areas || []).map((a: any) => ({
              id: a.area_id.toString(),
              areaId: a.area_code || a.area_id.toString(),
              areaName: a.area_name,
              x: a.pos_x,
              y: a.pos_y,
              width: a.width,
              height: a.length,
              lines: (a.lines || []).map((l: any) => ({
                id: l.line_id.toString(),
                lineId: l.line_code || l.line_id.toString(),
                lineName: l.line_name,
                x: l.pos_x,
                y: l.pos_y,
                width: l.width,
                height: l.length,
                lineType: l.line_type || 'Straight',
              workCenters: (l.workstations || []).map((w: any) => ({
                id: w.ws_id.toString(),
                workCenterId: w.ws_code || w.ws_id.toString(),
                name: w.ws_name || w.ws_code || `W${w.ws_id}`,
                machineName: w.ws_name,
                x: w.pos_x,
                y: w.pos_y,
                width: w.width,
                height: w.length,
                status: w.status || 'operational',
                detail: w.detail,
                parameters: { 
                  ...w,
                  ws_id: w.ws_code || w.ws_id.toString(),
                  oee: w.oee || 0,
                  orders: w.orders || 0
                }
              }))
              })),
              buffers: [],
              storage: []
            })),
            flows: (data.areas || []).flatMap((a: any) => 
              (a.lines || []).flatMap((l: any) => 
                (l.workstations || []).flatMap((w: any) => 
                  (w.flows || []).map((f: any) => ({
                    id: f.flow_id.toString(),
                    fromWsId: f.from_ws_id.toString(),
                    toWsId: f.to_ws_id.toString(),
                    arrowType: f.arrow_type || 'escalator',
                    label: f.flow_label || 'Flow'
                  }))
                )
              )
            )
          };

          setLayoutData(mappedFactory);
          setLayoutId(data.version.layout_version_id);
          setLayoutName(data.version.version_name);
        }
      } catch (err) {
        console.warn('Layout loading failed:', err);
      } finally {
        setLoading(false);
      }
    };

    tryLoading();
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const handleSaveFactory = useCallback(async (factory: any) => {
    console.log('Factory triggered save:', factory);
    
    if (!layoutId) {
      console.warn('No layoutId found, saving to local storage fallback');
      localStorage.setItem('lastFactorySave', JSON.stringify(factory));
      return;
    }

    try {
      const isLocal = isNaN(Number(layoutId));
      const baseUrl = isLocal ? '/api' : 'http://localhost:4000/api';

      const response = await fetch(`${baseUrl}/layouts/${layoutId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ factory })
      });

      if (!response.ok) throw new Error('Failed to save layout');
      
      const result = await response.json();
      console.log('Successfully saved layout:', result);
    } catch (err) {
      console.error('Failed saving layout:', err);
    }
  }, [layoutId]);

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
            <GridEditor 
              key={layoutId}
              onSave={handleSaveFactory} 
              initialFactory={layoutData} 
              isAdmin={getCurrentUser()?.role === 'admin'} 
              layoutId={layoutId} 
              onLayoutIdChange={handleLayoutChange}
            />
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
