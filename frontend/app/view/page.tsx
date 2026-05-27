'use client';

import { GridEditor } from '@/components/admin/grid-editor';
import { Factory } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function ViewPage() {
    const [isClient, setIsClient] = useState(false);
    const [layoutData, setLayoutData] = useState<any>(null);
    const [layoutName, setLayoutName] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setIsClient(true);

        const params = new URLSearchParams(window.location.search);
        const id = params.get('id');

        if (!id) {
            setError('No layout ID provided. Use ?id=<layout-id> in the URL.');
            setLoading(false);
            return;
        }

        fetch(`/api/layouts/${id}`)
            .then(res => res.json())
            .then(data => {
                if (data && data.error) {
                    setError(data.error);
                    return;
                }

                if (data && data.version) {
                    // Map backend database structure to frontend Factory type
                    const mappedFactory = {
                        id: (data.version.layout_id || id).toString(),
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
                            adminComment: a.admin_comment || '',
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
                                    adminComment: w.admin_comment || '',
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
                    setLayoutName(data.version.version_name || data.version.layout_name);
                } else {
                    setError('Layout not found. Please check the URL and try again.');
                }
            })
            .catch(err => {
                console.error(err);
                setError('Failed to load layout. Please try again later.');
            })
            .finally(() => setLoading(false));
    }, []);

    if (error) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#0b1120]">
                <div className="text-center">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 mb-4">
                        <Factory className="h-8 w-8 text-red-500" />
                    </div>
                    <h1 className="text-xl font-bold text-white mb-2">Unable to Load Layout</h1>
                    <p className="text-slate-400 max-w-md mx-auto">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen flex-col bg-[#0b1120]">
            {/* Header */}
            <header className="sticky top-0 z-40 border-b border-slate-800 bg-[#0b1120]/80 backdrop-blur-sm">
                <div className="flex h-14 items-center justify-between px-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
                            <Factory className="h-5 w-5" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-white">
                                {layoutName || 'Factory Layout'}
                            </h1>
                            <p className="text-xs text-slate-400">Shared Layout View</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex flex-1 overflow-hidden">
                {isClient && !loading ? (
                    <GridEditor initialFactory={layoutData} readOnly={true} />
                ) : (
                    <div className="flex flex-1 items-center justify-center text-slate-400 bg-[#0b1120]">
                        <div className="flex items-center gap-3">
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-600 border-t-slate-200" />
                            Loading layout...
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
