'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDataset } from '@/lib/store';
import { LeadMetrics, LeadSource } from '@/lib/types';
import { fetchApi } from '@/lib/api';
import StepIndicator from '@/components/ui/StepIndicator';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

/* ── helpers ─────────────────────────────────────────────────────────── */
function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
    const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
    return (
        <div style={{ background: 'var(--bg)', borderRadius: '4px', height: '6px', overflow: 'hidden', flex: 1 }}>
            <div style={{ height: '100%', borderRadius: '4px', background: color, width: `${pct}%`, transition: 'width 0.8s ease' }} />
        </div>
    );
}

function hasLeadsData(m: LeadMetrics): boolean {
    return (
        m.totalLeads > 0 || m.qualifiedLeads > 0 || m.convertedLeads > 0 ||
        m.topSources.length > 0 || m.byStatus.length > 0 || m.monthlyTrend.length > 0
    );
}

function BestWorstCard({
    title, entry, color, icon,
}: {
    title: string;
    entry: LeadSource | null;
    color: string;
    icon: string;
}) {
    if (!entry) return null;
    return (
        <div style={{
            padding: '16px 20px',
            background: `${color}08`,
            border: `1px solid ${color}30`,
            borderRadius: '12px',
            flex: 1,
        }}>
            <div style={{ fontSize: '10px', letterSpacing: '1.5px', color, marginBottom: '8px' }}>{icon} {title.toUpperCase()}</div>
            <div style={{ fontFamily: 'Inter,sans-serif', fontSize: '18px', fontWeight: 800, marginBottom: '4px', color }}>{entry.source}</div>
            <div style={{ fontFamily: 'DM Mono,monospace', fontSize: '13px', color: 'var(--text-secondary)' }}>
                {entry.count.toLocaleString()} leads · {entry.percentage}%
            </div>
        </div>
    );
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#a855f7', '#ec4899', '#06b6d4', '#f97316'];

export default function LeadsPage() {
    const router = useRouter();
    const { dataset } = useDataset();
    const [metrics, setMetrics] = useState<LeadMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [autoSkip, setAutoSkip] = useState<string | null>(null);

    useEffect(() => {
        if (!dataset) { setLoading(false); return; }
        let mounted = true;
        let timer: ReturnType<typeof setTimeout> | null = null;

        const skip = () => {
            if (!mounted) return;
            setAutoSkip('No leads data found in the current dataset. Moving to Revenue Analysis…');
            setLoading(false);
            timer = setTimeout(() => { if (mounted) router.push('/analysis/revenue'); }, 1200);
        };

        fetchApi<{ metrics: LeadMetrics }>('/api/analytics?type=leads')
            .then(res => {
                if (!mounted) return;
                if (!hasLeadsData(res.metrics)) { skip(); return; }
                setMetrics(res.metrics);
                setLoading(false);
            })
            .catch(err => {
                if (!mounted) return;
                const msg: string = err.message || '';
                const isNoData = ['no dataset', 'not found', 'no data', 'upload'].some(t => msg.toLowerCase().includes(t));
                if (isNoData) { skip(); return; }
                setError(msg || 'Failed to load leads analysis.');
                setLoading(false);
            });

        return () => { mounted = false; if (timer) clearTimeout(timer); };
    }, [dataset, router]);

    const noDataset = !dataset;

    // ── spinner card ──────────────────────────────────────────────────────────
    const spinnerCard = (msg: string) => (
        <Card>
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <div style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
                <div style={{ color: 'var(--text-secondary)' }}>{msg}</div>
            </div>
        </Card>
    );

    return (
        <div className="fade-up">
            <StepIndicator current="leads" />

            {/* Alerts */}
            {noDataset && (
                <div style={{ marginBottom: '24px' }}>
                    <Alert type="error" title="No Dataset Available"
                        message="Upload a dataset from the Dashboard before running this analysis." />
                </div>
            )}
            {error && (
                <div style={{ marginBottom: '24px' }}>
                    <Alert type="error" title="Analysis Error" message={error} onClose={() => setError(null)} />
                </div>
            )}
            {autoSkip && (
                <div style={{ marginBottom: '24px' }}>
                    <Alert type="info" title="Skipping Leads" message={autoSkip} />
                </div>
            )}

            {/* Content */}
            {noDataset ? (
                <Card>
                    <div style={{ textAlign: 'center', padding: '60px 0' }}>
                        <div style={{ fontSize: '64px', marginBottom: '16px', opacity: 0.3 }}>◈</div>
                        <div style={{ fontFamily: 'Inter,sans-serif', fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>No Leads Data Available</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>Upload a dataset from the Dashboard to see lead analytics.</div>
                        <Button onClick={() => router.push('/')}>← Back to Dashboard</Button>
                    </div>
                </Card>
            ) : autoSkip ? spinnerCard('Moving to Revenue Analysis…')
            : loading ? spinnerCard(`Analysing leads from ${dataset?.name}…`)
            : metrics && (
                <>
                    {/* ── KPI Row ─────────────────────────────────────────────── */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '24px' }}>
                        {[
                            { label: 'Total Leads',     value: metrics.totalLeads.toLocaleString(),     color: '#3b82f6' },
                            { label: 'Qualified Leads', value: metrics.qualifiedLeads.toLocaleString(),  color: '#10b981' },
                            { label: 'Converted Leads', value: metrics.convertedLeads.toLocaleString(), color: '#a855f7' },
                            { label: 'Conversion Rate', value: `${metrics.conversionRate}%`,             color: '#f59e0b' },
                        ].map(kpi => (
                            <Card key={kpi.label} glow>
                                <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '1.5px', marginBottom: '10px' }}>{kpi.label.toUpperCase()}</div>
                                <div style={{ fontSize: '30px', fontFamily: 'Inter,sans-serif', fontWeight: 800, color: kpi.color }}>{kpi.value}</div>
                            </Card>
                        ))}
                    </div>

                    {/* ── Secondary KPI Row ───────────────────────────────────── */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px', marginBottom: '24px' }}>
                        {[
                            { label: 'Avg Lead Score',  value: metrics.avgLeadScore > 0 ? String(metrics.avgLeadScore) : '—',         color: '#06b6d4' },
                            { label: 'Cost Per Lead',    value: metrics.costPerLead > 0 ? `₹${metrics.costPerLead.toLocaleString()}` : '—', color: '#ef4444' },
                            { label: 'Lead Sources',     value: String(metrics.topSources.length),                                     color: '#f97316' },
                        ].map(kpi => (
                            <Card key={kpi.label}>
                                <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '1.5px', marginBottom: '8px' }}>{kpi.label.toUpperCase()}</div>
                                <div style={{ fontSize: '26px', fontFamily: 'Inter,sans-serif', fontWeight: 800, color: kpi.color }}>{kpi.value}</div>
                            </Card>
                        ))}
                    </div>

                    {/* ── Best / Worst Lead ───────────────────────────────────── */}
                    {(metrics.bestLead || metrics.worstLead) && (
                        <Card style={{ marginBottom: '24px' }}>
                            <h3 style={{ fontFamily: 'Inter,sans-serif', fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>
                                🏆 Lead Source Performance
                            </h3>
                            <div style={{ display: 'flex', gap: '16px' }}>
                                <BestWorstCard title="Best Lead Source"  entry={metrics.bestLead}  color="#10b981" icon="★" />
                                <BestWorstCard title="Worst Lead Source" entry={metrics.worstLead} color="#ef4444" icon="▼" />
                            </div>
                        </Card>
                    )}

                    {/* ── Sources & Status ────────────────────────────────────── */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                        <Card>
                            <h3 style={{ fontFamily: 'Inter,sans-serif', fontSize: '15px', fontWeight: 700, marginBottom: '20px' }}>
                                Lead Sources
                                <span style={{ fontFamily: 'DM Mono,monospace', fontSize: '11px', color: 'var(--text-muted)', marginLeft: '8px' }}>({metrics.topSources.length})</span>
                            </h3>
                            {metrics.topSources.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                    {metrics.topSources.map((s, i) => (
                                        <div key={s.source}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
                                                <span style={{ color: 'var(--text-secondary)' }}>{s.source}</span>
                                                <span style={{ fontFamily: 'DM Mono,monospace', color: COLORS[i % COLORS.length] }}>
                                                    {s.count.toLocaleString()} · {s.percentage}%
                                                </span>
                                            </div>
                                            <MiniBar value={s.percentage} max={100} color={COLORS[i % COLORS.length]} />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No source column detected in dataset.</div>
                            )}
                        </Card>

                        <Card>
                            <h3 style={{ fontFamily: 'Inter,sans-serif', fontSize: '15px', fontWeight: 700, marginBottom: '20px' }}>
                                Pipeline Status
                                <span style={{ fontFamily: 'DM Mono,monospace', fontSize: '11px', color: 'var(--text-muted)', marginLeft: '8px' }}>({metrics.byStatus.length})</span>
                            </h3>
                            {metrics.byStatus.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {metrics.byStatus.map((s, i) => (
                                        <div key={s.status} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                                            <div style={{ fontSize: '13px', flex: 1 }}>{s.status}</div>
                                            <div style={{ fontFamily: 'DM Mono,monospace', fontSize: '13px', color: 'var(--text-secondary)' }}>{s.count.toLocaleString()}</div>
                                            <MiniBar value={s.count} max={metrics.totalLeads || 1} color={COLORS[i % COLORS.length]} />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No status column detected in dataset.</div>
                            )}
                        </Card>
                    </div>

                    {/* ── Monthly Trend ───────────────────────────────────────── */}
                    {metrics.monthlyTrend.length > 0 && (
                        <Card style={{ marginBottom: '24px' }}>
                            <h3 style={{ fontFamily: 'Inter,sans-serif', fontSize: '15px', fontWeight: 700, marginBottom: '20px' }}>Monthly Lead Trend</h3>
                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '120px' }}>
                                {metrics.monthlyTrend.map((m, i) => {
                                    const maxVal = Math.max(...metrics.monthlyTrend.map(x => x.leads));
                                    const pct = maxVal > 0 ? (m.leads / maxVal) * 100 : 0;
                                    const isLast = i === metrics.monthlyTrend.length - 1;
                                    return (
                                        <div key={m.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', height: '100%', justifyContent: 'flex-end' }}>
                                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'DM Mono,monospace' }}>{m.leads.toLocaleString()}</div>
                                            <div style={{ width: '100%', borderRadius: '4px 4px 0 0', background: isLast ? 'var(--accent)' : 'var(--border)', height: `${pct}%`, minHeight: '6px', transition: 'height 0.8s ease' }} />
                                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{m.month}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>
                    )}

                    {/* no chart data message */}
                    {metrics.topSources.length === 0 && metrics.byStatus.length === 0 && metrics.monthlyTrend.length === 0 && (
                        <Card style={{ marginBottom: '24px' }}>
                            <div style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '24px 0' }}>
                                Total leads loaded from dataset but no categorical or date columns were detected for breakdown charts.
                            </div>
                        </Card>
                    )}
                </>
            )}

            {/* ── Navigation ──────────────────────────────────────────────────── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                <Button variant="ghost" onClick={() => router.push('/')}>← Back</Button>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <Button onClick={() => router.push('/analysis/revenue')}>Next: Revenue →</Button>
                    <Button variant="ghost" onClick={() => router.push('/analysis/summary')}
                        style={{ borderColor: 'var(--success)', color: 'var(--success)' }}>
                        Skip to Summary ✓
                    </Button>
                </div>
            </div>
        </div>
    );
}
