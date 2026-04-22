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
    const { setDataset } = useDataset();
    const [dragging, setDragging] = useState(false);
    const [uploaded, setUploaded] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    const processFile = useCallback((file: File) => {
        if (!file.name.match(/\.(csv|xlsx|xls|json|pdf)$/i)) {
            setAlert({ type: 'error', msg: 'File format not supported.' });
            return;
        }
        setUploaded(file);
        setAlert({ type: 'success', msg: `"${file.name}" ready for analysis.` });
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault(); setDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) processFile(file);
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
        if (!uploaded) {
            setAlert({ type: 'error', msg: 'Please select a file to continue.' });
            return;
        }
        setUploading(true);
        try {
            await fetchApi('/api/reset-session', { method: 'POST' });
            const isExcel = uploaded.name.match(/\.(xlsx|xls)$/i);
            const parsedData = isExcel ? await parseExcelFile(uploaded) : await parseCsvFile(uploaded);
            if (!parsedData.length) { setAlert({ type: 'error', msg: 'No valid data found.' }); return; }
            await fetchApi<any>('/api/upload-json', {
                method: 'POST',
                body: JSON.stringify({ files: [{ file_name: uploaded.name, data: parsedData }] }),
            });
            const ds: Dataset = {
                name: uploaded.name, size: uploaded.size,
                type: uploaded.type || (isExcel ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'text/csv'),
                uploadedAt: new Date(), data: parsedData,
            };
            setDataset(ds);
            router.push('/analysis/leads');
        } catch (error: any) {
            setAlert({ type: 'error', msg: `Upload failed: ${error.message || 'Server error'}` });
        } finally { setUploading(false); }
    };

    return (
        <div className="min-h-full flex flex-col justify-start max-w-[1200px] mx-auto px-5 md:px-10 py-5 md:py-[30px] mobile-scroll pb-24 md:pb-8 text-[var(--text-primary)]">
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

            <div className="grid grid-cols-1 md:grid-cols-[1.1fr,1.3fr] gap-6 md:gap-10 items-start">
                <div>
                    <div className="mb-4 md:mb-8 text-center md:text-left">
                        <div className="text-[10px] font-bold text-[var(--accent)] tracking-[0.1em] mb-3 md:mb-4 uppercase">STEP 01 / DATA INGESTION</div>
                        <h1 className="font-inter text-2xl md:text-[42px] font-[800] leading-[1.1] text-[var(--text-primary)] mb-4 md:mb-8 tracking-tighter">
                            Initialize Your Business Diagnostic
                        </h1>
                        <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4 md:mb-8 mx-auto md:mx-0 max-w-[440px]">
                            To construct your Health Index, our engine requires structured financial data. Please upload your latest ledger, revenue reports, or advertising performance files.
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
                                "Uploading multi-year data sets allows for deeper trend detection and more accurate health forecasting."
                            </p>
                        </div>
                    </div>

                    <div className="mb-8 hide-on-mobile md:block">
                        <div className="text-[10px] font-[800] text-[var(--accent)] tracking-[0.1em] mb-4 uppercase">Supported Formats</div>
                        <div className="flex gap-2.5">
                            {['.XLSX', '.CSV', '.PDF', '.JSON'].map(ext => (
                                <div key={ext} className="px-4 py-1.5 bg-[var(--bg-secondary)] rounded-full text-[11px] font-[700] text-[var(--text-secondary)] border border-[var(--border)]">
                                    {ext}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-5">
                    <div 
                        onDrop={handleDrop} 
                        onDragOver={e => { e.preventDefault(); setDragging(true); }} 
                        onDragLeave={() => setDragging(false)} 
                        className={`border-[1.5px] border-dashed rounded-[24px] p-10 text-center transition-all duration-300 cursor-pointer min-h-[300px] md:min-h-[340px] flex flex-col items-center justify-center ${dragging ? 'border-[var(--accent)] bg-[var(--accent-soft)]' : 'border-[var(--border)] bg-[var(--bg-card)]'}`} 
                        onClick={() => fileRef.current?.click()}
                    >
                        <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls,.json,.pdf" hidden onChange={e => e.target.files?.[0] && processFile(e.target.files[0])} />
                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-[24px] bg-[var(--accent-soft)] flex items-center justify-center mb-8 shadow-premium">
                            {uploaded ? <span className="text-2xl">📄</span> : (
                                <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="var(--accent)" fillOpacity="0.1"/>
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M14 2v6h6" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M12 18v-6m0 0-3 3m3-3 3 3" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            )}
                        </div>
                        <h3 className="font-inter text-xl md:text-[22px] font-bold text-[var(--text-primary)] mb-2 tracking-tight">
                            {uploaded ? uploaded.name : 'Drag and drop your financial files'}
                        </h3>
                        <p className="text-sm text-[var(--text-secondary)] mb-8">or browse your local directories</p>
                        <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}
                            className="btn-primary px-9 py-3 rounded-xl text-sm active:opacity-80"
                        >
                            + Select Files
                        </button>
                    </div>

                    <div className="flex md:hidden gap-2 justify-center mb-4">
                        {['.XLSX', '.CSV', '.PDF', '.JSON'].map(ext => (
                            <div key={ext} className="px-3 py-1 bg-[var(--bg-secondary)] rounded-full text-[9px] font-[700] text-[var(--text-secondary)] border border-[var(--border)]">
                                {ext}
                            </div>
                        ))}
                    </div>

                    {alert && <div className="fade-up"><Alert type={alert.type} title={alert.type === 'success' ? 'Ready' : 'Note'} message={alert.msg} onClose={() => setAlert(null)} /></div>}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 mt-2">
                        <div className="flex justify-center gap-6">
                            <div className="flex items-center gap-2 text-[9px] font-[800] text-[var(--text-muted)] tracking-wider uppercase"><span className="text-xs">🛡️</span> ENCRYPTED</div>
                            <div className="flex items-center gap-2 text-[9px] font-[800] text-[var(--text-muted)] tracking-wider uppercase"><span className="text-xs">🛡️</span> SOC2 READY</div>
                        </div>
                        <button 
                            onClick={handleNext} 
                            disabled={uploading} 
                            className={`w-full md:w-auto px-10 py-3.5 md:py-2.5 rounded-xl md:rounded-lg text-sm font-bold transition-all uppercase tracking-wider ${uploaded ? 'btn-primary' : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] border-none cursor-not-allowed'}`}
                            style={{ cursor: uploading ? 'wait' : (uploaded ? 'pointer' : 'not-allowed') }}
                        >
                            {uploading ? 'INGESTING...' : 'NEXT →'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}