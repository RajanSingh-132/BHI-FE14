'use client';
import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDataset } from '@/lib/store';
import { Dataset } from '@/lib/types';
import { formatBytes } from '@/lib/utils';
import { fetchApi } from '@/lib/api';
import Papa from 'papaparse';
import StepIndicator from '@/components/ui/StepIndicator';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

export default function DashboardPage() {
    const router = useRouter();
    const { setDataset, dataset } = useDataset();
    const [dragging, setDragging] = useState(false);
    const [uploaded, setUploaded] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    const processFile = useCallback((file: File) => {
        const allowed = ['text/csv', 'application/json', 'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
        if (!allowed.includes(file.type) && !file.name.match(/\.(csv|json|xlsx|xls)$/i)) {
            setAlert({ type: 'error', msg: 'Only CSV, JSON, or Excel files are supported.' });
            return;
        }
        setUploaded(file);
        setAlert({ type: 'success', msg: `"${file.name}" uploaded successfully. Ready for analysis.` });
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault(); setDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) processFile(file);
    }, [processFile]);

    // Clean object keys: remove NULL bytes, trim whitespace, drop empty keys
    const cleanRow = (row: Record<string, any>): Record<string, any> => {
        const cleaned: Record<string, any> = {};
        for (const [key, value] of Object.entries(row)) {
            const cleanKey = key.replace(/\0/g, '').trim();
            if (cleanKey) {
                cleaned[cleanKey] = value;
            }
        }
        return cleaned;
    };

    const handleNext = async () => {
        if (uploading) return;
        if (!uploaded) {
            setAlert({ type: 'error', msg: 'No dataset uploaded. Please upload a dataset file before proceeding.' });
            return;
        }

        setUploading(true);

        try {
            // 1. Reset Session before upload
            try {
                await fetchApi('/api/reset-session', { method: 'POST' });
            } catch (resetErr: any) {
                console.error('[Upload] Reset session failed:', resetErr);
                setAlert({ type: 'error', msg: `Reset failed: ${resetErr.message || 'Server error'}` });
                setUploading(false);
                return;
            }

            // Helper to push data to backend and finalize
            const postData = async (cleanedData: any[]) => {
                await fetchApi<any>('/api/upload-json', {
                    method: 'POST',
                    body: JSON.stringify({
                        files: [{ file_name: uploaded.name, data: cleanedData }],
                    }),
                });

                const ds: Dataset = {
                    name: uploaded.name, size: uploaded.size,
                    type: uploaded.type || 'text/csv',
                    uploadedAt: new Date(), data: cleanedData,
                };
                setDataset(ds);
                setUploading(false);
                console.log(`[Upload] Upload successful for ${uploaded.name}, navigating...`);
                router.push('/analysis/leads');
            };

            // 2. Proceed with upload
            const isJSON = uploaded.name.match(/\.json$/i);
            const isExcel = uploaded.name.match(/\.(xlsx|xls)$/i);

            if (isJSON) {
                const text = await uploaded.text();
                console.log('[Upload] Reading JSON file:', uploaded.name);
                let rawData = JSON.parse(text);
                if (!Array.isArray(rawData)) rawData = [rawData];

                const cleanedData = rawData.map((row: any) => cleanRow(row));
                console.log(`[Upload] Cleaned ${cleanedData.length} rows from JSON`);
                await postData(cleanedData);

            } else if (isExcel) {
                console.log('[Upload] Parsing Excel file:', uploaded.name);
                const XLSX = await import('xlsx');
                const buffer = await uploaded.arrayBuffer();
                const workbook = XLSX.read(buffer, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const rawData = XLSX.utils.sheet_to_json(worksheet);
                const cleanedData = rawData.map((row: any) => cleanRow(row));
                console.log(`[Upload] Cleaned ${cleanedData.length} rows from Excel`);
                await postData(cleanedData);

            } else {
                console.log('[Upload] Parsing CSV file:', uploaded.name);
                Papa.parse(uploaded, {
                    header: true,
                    skipEmptyLines: true,
                    complete: async (results) => {
                        try {
                            console.log(`[Upload] PapaParse returned ${results.data.length} rows`);
                            const cleanedData = (results.data as Record<string, any>[]).map(cleanRow);
                            console.log(`[Upload] Cleaned ${cleanedData.length} rows`);
                            await postData(cleanedData);
                        } catch (error: any) {
                            console.error('[Upload] Failed to send parsed CSV:', error);
                            setAlert({ type: 'error', msg: `Upload failed: ${error.message || 'Server error'}` });
                            setUploading(false);
                        }
                    },
                    error: (error) => {
                        console.error('[Upload] PapaParse error:', error);
                        setAlert({ type: 'error', msg: `File parse failed: ${error.message}` });
                        setUploading(false);
                    },
                });
            }
        } catch (error: any) {
            console.error('[Upload] Unexpected error:', error);
            setAlert({ type: 'error', msg: `Upload failed: ${error.message || 'Server error'}` });
            setUploading(false);
        }
    };

    return (
        <div className="fade-up">
            <StepIndicator current="upload" />

            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '32px' }}>
                {[
                    { label: 'Total Datasets', value: dataset ? '1' : '0', icon: '◈', color: '#3b82f6' },
                    { label: 'Last Analysed', value: dataset ? 'Just now' : '—', icon: '◎', color: '#10b981' },
                    { label: 'Reports Generated', value: dataset ? '—' : '0', icon: '◇', color: '#f59e0b' },
                    { label: 'Insights Found', value: dataset ? '—' : '0', icon: '⬡', color: '#a855f7' },
                ].map(s => (
                    <Card key={s.label}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', letterSpacing: '1px' }}>{s.label.toUpperCase()}</div>
                                <div style={{ fontSize: '28px', fontFamily: 'Syne,sans-serif', fontWeight: 800, color: s.color }}>{s.value}</div>
                            </div>
                            <div style={{ fontSize: '24px', color: s.color, opacity: 0.6 }}>{s.icon}</div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Upload area */}
            <Card glow style={{ marginBottom: '24px' }}>
                <div style={{ marginBottom: '20px' }}>
                    <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>
                        Upload Dataset
                    </h2>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        Upload your business data file to begin the analysis pipeline. Supports CSV, JSON, XLSX.
                    </p>
                </div>

                {/* Drop Zone */}
                <div
                    onDrop={handleDrop}
                    onDragOver={e => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onClick={() => fileRef.current?.click()}
                    style={{
                        border: `2px dashed ${dragging ? 'var(--accent)' : uploaded ? 'var(--success)' : 'var(--border)'}`,
                        borderRadius: '16px', padding: '48px 32px',
                        textAlign: 'center', cursor: 'pointer',
                        background: dragging ? 'var(--accent-soft)' : uploaded ? '#10b98108' : 'var(--bg)',
                        transition: 'all 0.3s',
                        boxShadow: dragging ? '0 0 24px var(--accent)22' : 'none',
                    }}
                >
                    <input ref={fileRef} type="file" accept=".csv,.json,.xlsx,.xls" hidden onChange={e => e.target.files?.[0] && processFile(e.target.files[0])} />
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>
                        {uploaded ? '✓' : dragging ? '↓' : '⬡'}
                    </div>
                    {uploaded ? (
                        <div>
                            <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--success)', marginBottom: '6px' }}>{uploaded.name}</div>
                            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                {formatBytes(uploaded.size)} · {uploaded.type || 'text/csv'}
                            </div>
                            <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>Click to replace file</div>
                        </div>
                    ) : (
                        <div>
                            <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '6px' }}>
                                {dragging ? 'Drop file here' : 'Drag & drop your dataset'}
                            </div>
                            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                                or click to browse files
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                {['CSV', 'JSON', 'XLSX', 'XLS'].map(t => (
                                    <span key={t} style={{
                                        padding: '4px 10px', borderRadius: '6px', fontSize: '11px',
                                        background: 'var(--bg-card)', border: '1px solid var(--border)',
                                        color: 'var(--text-muted)', fontFamily: 'DM Mono,monospace',
                                    }}>{t}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Alert */}
                {alert && (
                    <div style={{ marginTop: '16px' }}>
                        <Alert
                            type={alert.type} title={alert.type === 'success' ? 'Upload Successful' : 'Upload Failed'}
                            message={alert.msg} onClose={() => setAlert(null)}
                        />
                    </div>
                )}

                {/* Next button */}
                <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    {uploaded && (
                        <Button variant="ghost" onClick={() => { setUploaded(null); setAlert(null); }}>
                            Clear
                        </Button>
                    )}
                    <Button size="lg" onClick={handleNext} loading={uploading}
                        style={{ minWidth: '140px' }}>
                        Next →
                    </Button>
                </div>
            </Card>

            {/* Instructions */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                {[
                    { step: '01', title: 'Upload Dataset', desc: 'Drag & drop or browse your CSV, JSON, or Excel business data file.' },
                    { step: '02', title: 'Run Analysis', desc: 'BHI AI engine analyses your leads, revenue, and ads data automatically.' },
                    { step: '03', title: 'Get Insights', desc: 'View rich visual reports and actionable business intelligence.' },
                ].map(item => (
                    <Card key={item.step}>
                        <div style={{ fontFamily: 'DM Mono,monospace', fontSize: '11px', color: 'var(--accent-bright)', marginBottom: '10px' }}>
                            STEP {item.step}
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '6px' }}>{item.title}</div>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{item.desc}</div>
                    </Card>
                ))}
            </div>
        </div>
    );
}