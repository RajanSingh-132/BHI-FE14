'use client';
import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDataset } from '@/lib/store';
import { Dataset } from '@/lib/types';
import { fetchApi } from '@/lib/api';
import Papa from 'papaparse';
import Alert from '@/components/ui/Alert';

export default function UploadDataset() {
    const router = useRouter();
    const { setDataset, setDatasets } = useDataset();
    const [dragging, setDragging] = useState<string | null>(null);
    const [files, setFiles] = useState<{
        lead: File | null;
        sales: File | null;
        productivity: File | null;
        dataset1: File | null;
        dataset2: File | null;
    }>({ lead: null, sales: null, productivity: null, dataset1: null, dataset2: null });
    const [uploading, setUploading] = useState(false);
    const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

    const leadRef = useRef<HTMLInputElement>(null);
    const salesRef = useRef<HTMLInputElement>(null);
    const prodRef = useRef<HTMLInputElement>(null);
    const dataset1Ref = useRef<HTMLInputElement>(null);
    const dataset2Ref = useRef<HTMLInputElement>(null);

    const processFile = useCallback((file: File, category: string) => {
        if (!file.name.match(/\.(csv|xlsx|xls|json|pdf)$/i)) {
            setAlert({ type: 'error', msg: 'File format not supported.' });
            return;
        }
        setFiles(prev => ({ ...prev, [category]: file }));
        setAlert({ type: 'success', msg: `"${file.name}" added to dashboard.` });
    }, []);

    const handleDrop = useCallback((e: React.DragEvent, category: string) => {
        e.preventDefault(); 
        setDragging(null);
        const file = e.dataTransfer.files[0];
        if (file) processFile(file, category);
    }, [processFile]);

    const sanitizeHeader = (header: unknown, index: number): string => {
        const cleaned = String(header ?? '').replace(/\0/g, '').trim();
        if (!cleaned || cleaned.toLowerCase() === 'null') return `column_${index + 1}`;
        return cleaned;
    };

    const normalizeCellValue = (value: unknown): string | number | null => {
        if (value === undefined || value === null) return null;
        if (value instanceof Date) return value.toISOString();
        if (typeof value === 'string') {
            const cleaned = value.replace(/\0/g, '').trim();
            return cleaned === '' ? null : cleaned;
        }
        if (typeof value === 'number') return Number.isFinite(value) ? value : null;
        if (typeof value === 'boolean') return value ? 'true' : 'false';
        return String(value);
    };

    const buildRecordsFromRows = (rows: unknown[][]): Record<string, string | number | null>[] => {
        if (!rows.length) return [];
        const normalizedRows = rows.filter(Array.isArray) as unknown[][];
        if (!normalizedRows.length) return [];
        const headerRow = normalizedRows[0] ?? [];
        const dataRows = normalizedRows.slice(1);
        const totalColumns = Math.max(headerRow.length, ...dataRows.map(row => row.length), 0);
        const baseHeaders = Array.from({ length: totalColumns }, (_, idx) => sanitizeHeader(headerRow[idx], idx));
        const nameCounter = new Map<string, number>();
        const headers = baseHeaders.map((name) => {
            const count = (nameCounter.get(name) || 0) + 1;
            nameCounter.set(name, count);
            return count === 1 ? name : `${name}_${count}`;
        });
        return dataRows.map((row) => {
            const record: Record<string, string | number | null> = {};
            headers.forEach((header, idx) => { record[header] = normalizeCellValue(row[idx]); });
            return record;
        }).filter(record => Object.values(record).some(v => v !== null && v !== ''));
    };
    const parseCsvFile = (file: File): Promise<Record<string, string | number | null>[]> => {
        return new Promise((resolve, reject) => {
            Papa.parse(file, {
                skipEmptyLines: 'greedy',
                dynamicTyping: true,
                complete: (results) => {
                    try {
                        const rows = (results.data as unknown[]).map((row) => {
                            if (Array.isArray(row)) return row;
                            if (row && typeof row === 'object') return Object.values(row);
                            return [];
                        });
                        resolve(buildRecordsFromRows(rows));
                    } catch (error) { reject(error); }
                },
                error: reject,
            });
        });
    };

    const parseExcelFile = async (file: File): Promise<Record<string, string | number | null>[]> => {
        const XLSX = await import('xlsx');
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array', raw: true, cellDates: true });
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) return [];
        const worksheet = workbook.Sheets[firstSheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: true, defval: null, blankrows: false }) as unknown[][];
        return buildRecordsFromRows(rows);
    };

    const handleNext = async () => {
        if (uploading) return;
        
        const activeFiles = Object.entries(files).filter(([_, f]) => f !== null) as [string, File][];
        if (activeFiles.length === 0) {
            setAlert({ type: 'error', msg: 'Please select at least one file to continue.' });
            return;
        }

        setUploading(true);
        try {
            await fetchApi('/api/reset-session', { method: 'POST' });
            
            const uploadPayload: { file_name: string; data: any[] }[] = [];
            const allDatasets: Dataset[] = [];

            for (const [cat, file] of activeFiles) {
                const isExcel = file.name.match(/\.(xlsx|xls)$/i);
                const parsedData = isExcel ? await parseExcelFile(file) : await parseCsvFile(file);
                
                if (parsedData.length > 0) {
                    uploadPayload.push({ file_name: file.name, data: parsedData });
                    
                    allDatasets.push({
                        name: file.name, size: file.size,
                        type: file.type || (isExcel ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'text/csv'),
                        uploadedAt: new Date(), data: parsedData,
                    });
                }
            }

            if (uploadPayload.length === 0) {
                setAlert({ type: 'error', msg: 'No valid data found in selected files.' });
                return;
            }

            await fetchApi<any>('/api/upload-json', {
                method: 'POST',
                body: JSON.stringify({ files: uploadPayload }),
            });

            if (allDatasets.length > 0) {
                setDataset(allDatasets[0]);
                setDatasets(allDatasets);
            }
            router.push('/analysis/leads');
        } catch (error: any) {
            setAlert({ type: 'error', msg: `Upload failed: ${error.message || 'Server error'}` });
        } finally { setUploading(false); }
    };

    const UploadBlock = ({ category, label, file, inputRef, icon, readOnly = false }: { category: string, label: string, file: File | null, inputRef?: React.RefObject<HTMLInputElement | null>, icon: string, readOnly?: boolean }) => (
        <div 
            onDrop={e => !readOnly && handleDrop(e, category)} 
            onDragOver={e => { if (!readOnly) { e.preventDefault(); setDragging(category); } }} 
            onDragLeave={() => setDragging(null)} 
            className={`flex-1 border-[1.5px] border-dashed rounded-[20px] p-4 text-center transition-all duration-300 flex flex-col items-center justify-center min-h-[100px] ${!readOnly ? 'cursor-pointer hover:border-[var(--accent)] hover:bg-[var(--bg-secondary)]' : 'cursor-default opacity-80'} ${dragging === category ? 'border-[var(--accent)] bg-[var(--accent-soft)]' : 'border-[var(--border)] bg-[var(--bg-card)]'} ${file ? 'border-solid border-[var(--accent)]' : ''}`} 
            onClick={() => !readOnly && inputRef?.current?.click()}
        >
            {!readOnly && <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls,.json,.pdf" hidden onChange={e => e.target.files?.[0] && processFile(e.target.files[0], category)} />}
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${file ? 'bg-emerald-500 text-white' : 'bg-[var(--accent-soft)] text-[var(--accent)]'}`}>
                {file ? <span className="text-lg">✅</span> : <span className="text-lg">{icon}</span>}
            </div>
            <h4 className="text-[10px] font-black uppercase tracking-widest mb-1 text-[var(--text-primary)]">{label}</h4>
            <p className="text-[9px] text-[var(--text-muted)] truncate max-w-full px-2">
                {file ? file.name : (readOnly ? 'Upload Source' : 'Click to Upload')}
            </p>
        </div>
    );

    return (
        <div className="h-screen overflow-y-auto scrollbar-hide flex flex-col justify-start max-w-[1200px] mx-auto px-5 md:px-10 py-5 md:py-[30px] mobile-scroll pb-24 md:pb-8 text-[var(--text-primary)]">
            {/* Stepper - Desktop Only */}
            <div className="hidden md:flex items-center justify-center gap-20 mb-8 relative">
                <div className="absolute top-4 left-[20%] right-[20%] h-[1.5px] bg-[var(--border)] z-0" />
                {[
                    { n: '1', label: 'UPLOAD', active: true },
                    { n: '2', label: 'ANALYSIS' },
                    { n: '3', label: 'REVIEW' },
                    { n: '4', label: 'SUMMARY' }
                ].map((s) => (
                    <div key={s.n} className="flex flex-col items-center gap-3 z-10 relative bg-[var(--bg)] px-[10px]">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold ${s.active ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-secondary)] text-[var(--text-muted)]'}`}>{s.n}</div>
                        <span className={`text-[10px] font-bold tracking-[0.1em] ${s.active ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>{s.label}</span>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1fr,1.4fr] gap-6 md:gap-10 items-start">
                <div>
                    <div className="mb-4 md:mb-8 text-center md:text-left">
                        <div className="text-[10px] font-bold text-[var(--accent)] tracking-[0.1em] mb-3 md:mb-4 uppercase">STEP 01 / DATA INGESTION</div>
                        <h1 className="font-inter text-2xl md:text-[42px] font-[800] leading-[1.1] text-[var(--text-primary)] mb-4 md:mb-8 tracking-tighter">
                            Initialize Your Business Diagnostic
                        </h1>
                        <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4 md:mb-8 mx-auto md:mx-0 max-w-[440px]">
                            To construct your Health Index, our engine requires structured financial data. Please upload your files for Lead, Sales, and Productivity analysis.
                        </p>
                    </div>

                    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 md:p-5 flex gap-4 mb-4 md:mb-8 mx-auto md:mx-0 max-w-[440px] shadow-sm">
                        <div className="w-8 h-8 bg-[var(--accent-soft)] rounded-full flex items-center justify-center shrink-0">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--accent)">
                                <path d="M9 21h6v-1H9v1zm3-20C8.13 1 5 4.13 5 8c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-3.26C17.81 12.47 19 10.38 19 8c0-3.87-3.13-7-7-7z" />
                            </svg>
                        </div>
                        <div>
                            <div className="text-[11px] font-[800] tracking-wider text-[var(--accent)] mb-1 uppercase">ARCHITECTURAL INSIGHT</div>
                            <p className="text-[13px] text-[var(--text-secondary)] italic leading-normal">
                                "Categorizing your data into Lead, Sales, and Productivity allows our engine to cross-reference performance across the full funnel."
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-6">
                    {/* Category Indicators (Read Only) */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <UploadBlock category="lead" label="Lead Data" file={files.lead} icon="🎯" readOnly />
                        <UploadBlock category="sales" label="Sales Data" file={files.sales} icon="💰" readOnly />
                        <UploadBlock category="productivity" label="Productivity" file={files.productivity} icon="⚡" readOnly />
                    </div>

                    <div className="h-[1px] bg-[var(--border)] w-full opacity-50" />

                    {/* Primary Dataset Uploaders */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <UploadBlock category="dataset1" label="Upload Source Dataset 1" file={files.dataset1} inputRef={dataset1Ref} icon="📁" />
                        <UploadBlock category="dataset2" label="Upload Dataset 2" file={files.dataset2} inputRef={dataset2Ref} icon="📂" />
                    </div>

                    <div className="flex md:hidden gap-2 justify-center mb-4">
                        {['.XLSX', '.CSV', '.PDF', '.JSON'].map(ext => (
                            <div key={ext} className="px-3 py-1 bg-[var(--bg-secondary)] rounded-full text-[9px] font-[700] text-[var(--text-secondary)] border border-[var(--border)]">
                                {ext}
                            </div>
                        ))}
                    </div>

                    {alert && <div className="fade-up"><Alert type={alert.type} title={alert.type === 'success' ? 'Ready' : 'Note'} message={alert.msg} onClose={() => setAlert(null)} /></div>}
                    
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 mt-4">
                        <div className="flex justify-center gap-6">
                            <div className="flex items-center gap-2 text-[9px] font-[800] text-[var(--text-muted)] tracking-wider uppercase"><span className="text-xs">🛡️</span> ENCRYPTED</div>
                            <div className="flex items-center gap-2 text-[9px] font-[800] text-[var(--text-muted)] tracking-wider uppercase"><span className="text-xs">🛡️</span> SOC2 READY</div>
                        </div>
                        <button 
                            onClick={handleNext} 
                            disabled={uploading} 
                            className={`w-full md:w-auto px-10 py-3.5 md:py-2.5 rounded-xl md:rounded-lg text-sm font-bold transition-all uppercase tracking-wider ${Object.values(files).some(f => f !== null) ? 'btn-primary' : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] border-none cursor-not-allowed'}`}
                            style={{ cursor: uploading ? 'wait' : (Object.values(files).some(f => f !== null) ? 'pointer' : 'not-allowed') }}
                        >
                            {uploading ? 'INGESTING...' : 'NEXT →'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}