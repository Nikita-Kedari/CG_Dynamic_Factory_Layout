'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Download, FileText, CheckCircle, AlertCircle, LogOut } from 'lucide-react';
import { Factory } from '@/lib/types';
import { logout, getCurrentToken } from '@/lib/auth';
import { AuthGuard } from '@/components/auth-guard';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DeveloperPage() {
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [preview, setPreview] = useState<Factory | null>(null);
    const [layoutId, setLayoutId] = useState<string | null>(null);
    const [layouts, setLayouts] = useState<any[]>([]);
    const [passedMsg, setPassedMsg] = useState(false);

    const fetchLayouts = () => {
        const token = getCurrentToken();
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        fetch('/api/layouts', { headers })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setLayouts(data);
                } else {
                    setLayouts([]);
                }
            })
            .catch(console.error);
    };

    useEffect(() => {
        fetchLayouts();
    }, []);

    const passToAdmin = async (id: string) => {
        const token = getCurrentToken();
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        try {
            await fetch(`/api/layouts/${id}/pass-to-admin`, {
                method: 'POST',
                headers
            });
            fetchLayouts();
            setPassedMsg(true);
            setTimeout(() => setPassedMsg(false), 3000);
        } catch (err) {
            console.error(err);
        }
    };

    const handleDownloadTemplate = () => {
        const a = document.createElement('a');
        a.href = '/factory_layout_base.csv';
        a.download = 'factory_layout_base.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError(null);
            setSuccess(false);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        setError(null);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('name', file.name.replace('.csv', ''));

        const token = getCurrentToken();
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        try {
            const response = await fetch('/api/layouts', {
                method: 'POST',
                headers,
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const result = await response.json();
            setSuccess(true);
            setPreview(result.factory);
            setLayoutId(result.layout_version_id || result.id);
            setFile(null);
            fetchLayouts();
        } catch (err) {
            setError('Failed to upload layout. Please check the file format.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <AuthGuard requiredRole="developer">
            <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
                <div className="mx-auto max-w-5xl space-y-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-slate-900">Developer Portal</h1>
                                <p className="text-slate-500">Manage factory layout definitions.</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => { logout(); router.push('/'); }} 
                            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-slate-900 hover:text-white transition-colors"
                        >
                            <LogOut className="h-4 w-4" />
                            Logout
                        </button>
                    </div>

                    <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                        {/* Download Section */}
                        <div className="rounded-2xl bg-white p-6 sm:p-8 shadow-sm border border-slate-100 flex flex-col justify-between">
                            <div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600 mb-6">
                                    <Download className="h-6 w-6" />
                                </div>
                                <h2 className="text-xl font-bold text-slate-900">1. Get the CSV File</h2>
                                <p className="mt-2 text-slate-500">
                                    Download the specific factory_layout_base CSV. It includes all required columns for
                                    defining areas, lines, and machines with coordinates.
                                </p>
                            </div>
                            <Button onClick={handleDownloadTemplate} className="mt-8 w-full bg-slate-900 text-white hover:bg-slate-950 hover:scale-[1.01] hover:shadow-lg active:scale-95 transition-all duration-200">
                                <FileText className="mr-2 h-4 w-4" />
                                Download factory_layout_base.csv
                            </Button>
                        </div>

                        {/* Upload Section */}
                        <div className="rounded-2xl bg-white p-6 sm:p-8 shadow-sm border border-slate-100 flex flex-col justify-between">
                            <div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 mb-6">
                                    <Upload className="h-6 w-6" />
                                </div>
                                <h2 className="text-xl font-bold text-slate-900">2. Upload Configuration</h2>
                                <p className="mt-2 text-slate-500">
                                    Upload your modified CSV file to create a new layout version.
                                </p>
                            </div>

                            <div className="mt-8 space-y-4">
                                <div className="relative">
                                    <input
                                        type="file"
                                        accept=".csv"
                                        onChange={handleFileChange}
                                        className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                                    />
                                </div>
                                <Button
                                    onClick={handleUpload}
                                    disabled={!file || uploading}
                                    className="w-full bg-blue-600 text-white font-bold h-12 rounded-xl shadow-md hover:bg-slate-900 hover:text-white hover:scale-[1.01] hover:shadow-lg active:scale-95 transition-all duration-200 flex items-center justify-center gap-2"
                                >
                                    {uploading ? 'Uploading...' : 'Upload Configuration'}
                                </Button>
                            </div>

                            {success && (
                                <div className="mt-4 flex flex-col gap-3">
                                    <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
                                        <CheckCircle className="h-4 w-4" />
                                        Upload successful! Layout created.
                                    </div>
                                    {layoutId && (
                                        <Link href={`/admin/editor?id=${layoutId}`}>
                                            <Button className="w-full bg-slate-900 text-white hover:bg-slate-950 hover:scale-[1.01] hover:shadow-lg active:scale-95 transition-all duration-200">
                                                Show me the layout editor
                                            </Button>
                                        </Link>
                                    )}
                                </div>
                            )}

                            {error && (
                                <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                                    <AlertCircle className="h-4 w-4" />
                                    {error}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Preview Section - Optional */}
                    {preview && (
                        <div className="rounded-2xl bg-white p-8 shadow-sm border border-slate-100">
                            <h3 className="text-lg font-bold text-slate-900 mb-4">Upload Summary</h3>
                            <div className="overflow-x-auto rounded-lg border border-slate-200 w-full">
                                <table className="min-w-full divide-y divide-slate-200">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Area</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Lines</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Total Machines</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 bg-white">
                                        {preview.areas.map((area) => (
                                            <tr key={area.id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{area.areaName}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{area.lines.length} Line(s)</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                    {area.lines.reduce((acc, l) => acc + l.workCenters.length, 0)} Machines
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Layout History Section */}
                    <div className="rounded-2xl bg-white p-8 shadow-sm border border-slate-100 mt-8 relative">
                        {passedMsg && (
                            <div className="absolute top-8 right-8 flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 shadow-sm border border-emerald-200">
                                <CheckCircle className="h-4 w-4" />
                                Layout passed to admin!
                            </div>
                        )}
                        <h3 className="text-xl font-bold text-slate-900 mb-6">Layout Version History</h3>
                        <div className="overflow-x-auto rounded-lg border border-slate-200 w-full">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Version</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 bg-white">
                                    {layouts.map((l: any) => (
                                        <tr key={l.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{l.version}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{l.name}</td>
                                            <td className="px-6 py-4">
                                                {l.status === 'draft' || !l.status ? (
                                                    <span className="px-2 py-1 text-xs font-medium bg-slate-100 text-slate-600 rounded-full whitespace-nowrap">Draft</span>
                                                ) : l.status === 'pending' ? (
                                                    <span className="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded-full whitespace-nowrap">Pending Admin</span>
                                                ) : l.status === 'pushed' ? (
                                                    <div className="flex flex-col gap-2 min-w-[150px] max-w-[300px]">
                                                        <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full w-fit whitespace-nowrap">Changes Requested</span>
                                                        {(l.adminComments || l.admin_comments) && (
                                                            <div className="text-[11px] text-blue-600 bg-blue-50 p-2.5 rounded-xl border border-blue-100 leading-relaxed break-words">
                                                                <strong className="block mb-1 opacity-70">Admin Feedback:</strong> {l.adminComments || l.admin_comments}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : l.status === 'rejected' ? (
                                                    <div className="flex flex-col gap-2 min-w-[150px] max-w-[300px]">
                                                        <span className="inline-block px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full w-fit whitespace-nowrap">Rejected</span>
                                                        {(l.adminComments || l.admin_comments) && (
                                                            <div className="text-[11px] text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-100 leading-relaxed break-words">
                                                                <strong className="block mb-1 opacity-70">Admin Comment:</strong> {l.adminComments || l.admin_comments}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : l.isActive || l.status === 'approved' ? (
                                                    <span className="px-2 py-1 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full whitespace-nowrap">Admin Approved</span>
                                                ) : (
                                                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full whitespace-nowrap">{l.status}</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                                <div className="flex justify-end gap-2">
                                                    {(!l.status || l.status === 'draft' || l.status === 'rejected' || l.status === 'pushed') ? (
                                                         <>
                                                             <Link href={`/admin/editor?id=${l.id}`}>
                                                                 <Button className="text-slate-700 border border-slate-200 bg-white hover:bg-slate-900 hover:text-white hover:border-slate-900 hover:scale-[1.02] hover:shadow-md active:scale-95 transition-all duration-200 h-9 px-3 rounded-md text-xs font-medium">
                                                                     Edit
                                                                 </Button>
                                                             </Link>
                                                             <Button 
                                                                 onClick={() => passToAdmin(l.id)} 
                                                                 className="bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-500/20 hover:scale-[1.02] active:scale-95 transition-all duration-200 text-white h-9 px-3 rounded-md text-xs font-medium"
                                                             >
                                                                 {(l.status === 'rejected' || l.status === 'pushed') ? 'Re-Submit' : 'Pass to Admin'}
                                                             </Button>
                                                         </>
                                                    ) : (
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">Locked for Review</span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {layouts.length === 0 && (
                                        <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">No layouts found.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </div>
        </AuthGuard>
    );
}
