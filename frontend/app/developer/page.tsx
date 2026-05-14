'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Download, FileText, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { generateSampleCSV } from '@/lib/csv-handler';
import { Factory } from '@/lib/types';
import Link from 'next/link';

export default function DeveloperPage() {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [preview, setPreview] = useState<Factory | null>(null);
    const [layoutId, setLayoutId] = useState<string | null>(null);
    const [layouts, setLayouts] = useState<any[]>([]);
    const [passedMsg, setPassedMsg] = useState(false);

    const fetchLayouts = () => {
        fetch('/api/layouts')
            .then(res => res.json())
            .then(data => setLayouts(data))
            .catch(console.error);
    };

    useEffect(() => {
        fetchLayouts();
    }, []);

    const passToAdmin = async (id: string) => {
        try {
            await fetch(`/api/layouts/${id}/pass-to-admin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
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
        a.href = '/c1_layout_9_workcentres_with_details.csv';
        a.download = 'c1_layout_9_workcentres_with_details.csv';
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

        try {
            const response = await fetch('/api/layouts', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const result = await response.json();
            setSuccess(true);
            setPreview(result.factory);
            setLayoutId(result.id);
            setFile(null);
            fetchLayouts();
        } catch (err) {
            setError('Failed to upload layout. Please check the file format.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="mx-auto max-w-5xl space-y-8">
                <div className="flex items-center gap-4">
                    <Link href="/">
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Developer Portal</h1>
                        <p className="text-slate-500">Manage factory layout definitions.</p>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Download Section */}
                    <div className="rounded-2xl bg-white p-8 shadow-sm border border-slate-100 flex flex-col justify-between">
                        <div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600 mb-6">
                                <Download className="h-6 w-6" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900">1. Get the CSV File</h2>
                            <p className="mt-2 text-slate-500">
                                Download the specific c1_layout_9_workcentres_with_details CSV. It includes all required columns for
                                defining areas, lines, and machines with coordinates.
                            </p>
                        </div>
                        <Button onClick={handleDownloadTemplate} className="mt-8 w-full bg-slate-900 hover:bg-slate-800">
                            <FileText className="mr-2 h-4 w-4" />
                            Download c1_layout_9_workcentres_with_details.csv
                        </Button>
                    </div>

                    {/* Upload Section */}
                    <div className="rounded-2xl bg-white p-8 shadow-sm border border-slate-100 flex flex-col justify-between">
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
                                className="w-full bg-blue-600 hover:bg-blue-700"
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
                                        <Button className="w-full bg-slate-900 hover:bg-slate-800">
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
                        <div className="overflow-hidden rounded-lg border border-slate-200">
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
                    <div className="overflow-hidden rounded-lg border border-slate-200">
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
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {l.status === 'draft' || !l.status ? (
                                                <span className="px-2 py-1 text-xs font-medium bg-slate-100 text-slate-600 rounded-full">Draft</span>
                                            ) : l.status === 'pending' ? (
                                                <span className="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">Pending Admin</span>
                                            ) : l.status === 'rejected' ? (
                                                <div className="flex flex-col gap-1">
                                                    <span className="inline-block px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full w-fit">Rejected</span>
                                                    {l.adminComments && (
                                                        <div className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-100 mt-1">
                                                            <strong>Admin Comment:</strong> {l.adminComments}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : l.isActive || l.status === 'approved' ? (
                                                <span className="px-2 py-1 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full">Admin Approved</span>
                                            ) : (
                                                <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">{l.status}</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm align-top">
                                            <div className="flex justify-end gap-2 text-slate-900">
                                                {(!l.status || l.status === 'draft' || l.status === 'rejected') && (
                                                    <>
                                                        <Link href={`/admin/editor?id=${l.id}`}>
                                                            <Button variant="outline" size="sm" className="text-slate-900 hover:text-slate-900 border-slate-200 hover:bg-slate-100">
                                                                Edit
                                                            </Button>
                                                        </Link>
                                                        <Button 
                                                            onClick={() => passToAdmin(l.id)} 
                                                            size="sm" 
                                                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                                        >
                                                            {l.status === 'rejected' ? 'Re-Submit' : 'Pass to Admin'}
                                                        </Button>
                                                    </>
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
    );
}
