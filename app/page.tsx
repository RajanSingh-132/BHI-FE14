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
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function DashboardPage() {
  const router = useRouter();
  const { setDataset, dataset } = useDataset();
  const [dragging, setDragging] = useState(false);
  const [uploaded, setUploaded] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback((file: File) => {
    if (!file.name.match(/\.(csv|xlsx|xls)$/i)) {
      setAlert({ type: 'error', msg: 'Only CSV or Excel files are supported.' });
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
    const totalColumns = Math.max(
      headerRow.length,
      ...dataRows.map(row => row.length),
      0,
    );

    const baseHeaders = Array.from({ length: totalColumns }, (_, idx) => sanitizeHeader(headerRow[idx], idx));
    const nameCounter = new Map<string, number>();
    const headers = baseHeaders.map((name) => {
      const count = (nameCounter.get(name) || 0) + 1;
      nameCounter.set(name, count);
      return count === 1 ? name : `${name}_${count}`;
    });

    return dataRows
      .map((row) => {
        const record: Record<string, string | number | null> = {};
        headers.forEach((header, idx) => {
          record[header] = normalizeCellValue(row[idx]);
        });
        return record;
      })
      .filter(record => Object.values(record).some(v => v !== null && v !== ''));
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
          } catch (error) {
            reject(error);
          }
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
    const rows = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      raw: true,
      defval: null,
      blankrows: false,
    }) as unknown[][];

    return buildRecordsFromRows(rows);
  };

  const handleNext = async () => {
    if (!uploaded) {
      setAlert({ type: 'error', msg: 'No dataset uploaded. Please upload a dataset file before proceeding.' });
      return;
    }
    setUploading(true);

    try {
      const isExcel = uploaded.name.match(/\.(xlsx|xls)$/i);
      const parsedData = isExcel ? await parseExcelFile(uploaded) : await parseCsvFile(uploaded);

      if (!parsedData.length) {
        setAlert({ type: 'error', msg: 'No valid data rows found. Please check header and data rows in the file.' });
        return;
      }

      await fetchApi<any>('/api/upload-json', {
        method: 'POST',
        body: JSON.stringify({
          files: [{ file_name: uploaded.name, data: parsedData }],
        }),
      });

      const ds: Dataset = {
        name: uploaded.name,
        size: uploaded.size,
        type: uploaded.type || (isExcel ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'text/csv'),
        uploadedAt: new Date(),
        data: parsedData,
      };
      setDataset(ds);
      console.log('[Upload] Upload successful, navigating...');
      router.push('/analysis/leads');
    } catch (error: any) {
      console.error('[Upload] Unexpected error:', error);
      setAlert({ type: 'error', msg: `Upload failed: ${error.message || 'Server error'}` });
    } finally {
      setUploading(false);
    }
  };

  const handleReset = async () => {
    if (resetting) return;
    setResetting(true);

    try {
      await fetchApi('/api/reset-session', { method: 'POST' });
      setUploaded(null);
      setDataset(null);
      setAlert({ type: 'success', msg: 'Session reset successfully. You can upload a new dataset.' });
    } catch (error: any) {
      console.error('[Reset] Failed to reset session:', error);
      setAlert({ type: 'error', msg: `Reset failed: ${error.message || 'Server error'}` });
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="fade-up">
      <StepIndicator current="upload" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '32px' }}>
        {[
          { label: 'Total Datasets', value: dataset ? '1' : '0', color: '#3b82f6' },
          { label: 'Last Analysed', value: dataset ? 'Just now' : '—', color: '#10b981' },
          { label: 'Reports Generated', value: dataset ? '—' : '0', color: '#f59e0b' },
          { label: 'Insights Found', value: dataset ? '—' : '0', color: '#a855f7' },
        ].map(s => (
          <Card key={s.label}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', letterSpacing: '1px' }}>{s.label.toUpperCase()}</div>
            <div style={{ fontSize: '28px', fontFamily: 'Inter, sans-serif', fontWeight: 800, color: s.color }}>{s.value}</div>
          </Card>
        ))}
      </div>

      <Card glow style={{ marginBottom: '24px' }}>
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>Upload Dataset</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Upload your business data file to begin the analysis pipeline. Supports CSV, XLSX.
          </p>
        </div>

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
          <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" hidden
            onChange={e => e.target.files?.[0] && processFile(e.target.files[0])} />
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>
            {uploaded ? '✓' : dragging ? '↓' : '⬡'}
          </div>
          {uploaded ? (
            <div>
              <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--success)', marginBottom: '6px' }}>{uploaded.name}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{formatBytes(uploaded.size)} · {uploaded.type || 'text/csv'}</div>
              <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>Click to replace file</div>
            </div>
          ) : (
            <div>
              <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '6px' }}>
                {dragging ? 'Drop file here' : 'Drag & drop your dataset'}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>or click to browse files</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                {['CSV', 'XLSX', 'XLS'].map(t => (
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

        {alert && (
          <div style={{ marginTop: '16px' }}>
            <Alert type={alert.type} title={alert.type === 'success' ? 'Upload Successful' : 'Upload Failed'}
              message={alert.msg} onClose={() => setAlert(null)} />
          </div>
        )}

        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <Button variant="ghost" onClick={handleReset} loading={resetting}>Reset</Button>
          <Button size="lg" onClick={handleNext} loading={uploading} style={{ minWidth: '140px' }}>
            Next →
          </Button>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
        {[
          { step: '01', title: 'Upload Dataset', desc: 'Drag & drop or browse your CSV or Excel business data file.' },
          { step: '02', title: 'Run Analysis', desc: 'BHI AI engine analyses your leads, revenue, and ads data automatically.' },
          { step: '03', title: 'Get Insights', desc: 'View rich visual reports and actionable business intelligence.' },
        ].map(item => (
          <Card key={item.step}>
            <div style={{ fontFamily: 'DM Mono,monospace', fontSize: '11px', color: 'var(--accent-bright)', marginBottom: '10px' }}>STEP {item.step}</div>
            <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '6px' }}>{item.title}</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{item.desc}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}
