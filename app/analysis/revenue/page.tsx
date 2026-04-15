'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDataset } from '@/lib/store';
import { RevenueMetrics } from '@/lib/types';
import { fetchApi } from '@/lib/api';
import StepIndicator from '@/components/ui/StepIndicator';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#a855f7', '#ec4899', '#06b6d4', '#f97316'];

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
    const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
    return (
        <div style={{ background: 'var(--bg)', borderRadius: '4px', height: '6px', overflow: 'hidden', flex: 1 }}>
            <div style={{ height: '100%', borderRadius: '4px', background: color, width: `${pct}%`, transition: 'width 0.8s ease' }} />
        </div>
    );
}

function fmt(v: any): string {
    const val = Number(v);
    if (v == null || isNaN(val)) return '—';
    return '₹' + val.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

function hasRevenueData(m: RevenueMetrics): boolean {
    return (
        m.totalRevenue > 0 || m.pipelineValue > 0 ||
        m.avgDealSize > 0  || m.closedDeals > 0   ||
        m.byRegion.length > 0 || m.monthlyRevenue.length > 0
    );
}

export default function RevenuePage() {
    const router = useRouter();
    const { dataset } = useDataset();
    const [metrics, setMetrics] = useState<RevenueMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState<string | null>(null);
    const [autoSkip, setAutoSkip] = useState<string | null>(null);

    useEffect(() => {
        if (!dataset) { setLoading(false); return; }
        let mounted = true;
        let timer: ReturnType<typeof setTimeout> | null = null;

        const skip = () => {
            if (!mounted) return;
            setAutoSkip('No revenue data found in the current dataset. Moving to Ads Analysis…');
            setLoading(false);
            timer = setTimeout(() => { if (mounted) router.push('/analysis/ads'); }, 1200);
        };

        fetchApi<{ metrics: RevenueMetrics }>('/api/analytics?type=revenue')
            .then(res => {
                if (!mounted) return;
                if (!hasRevenueData(res.metrics)) { skip(); return; }
                setMetrics(res.metrics);
                setLoading(false);
            })
            .catch(err => {
                if (!mounted) return;
                const msg: string = err.message || '';
                const noData = ['no dataset', 'not found', 'no data', 'upload'].some(t => msg.toLowerCase().includes(t));
                if (noData) { skip(); return; }
                setError(msg || 'Failed to load revenue analysis.');
                setLoading(false);
            });

        return () => { mounted = false; if (timer) clearTimeout(timer); };
    }, [dataset, router]);

    const noDataset = !dataset;

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
            <StepIndicator current="revenue" />

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
                    <Alert type="info" title="Skipping Revenue" message={autoSkip} />
                </div>
            )}

            {noDataset ? (
                <Card>
                    <div style={{ textAlign: 'center', padding: '60px 0' }}>
                        <div style={{ fontSize: '64px', marginBottom: '16px', opacity: 0.3 }}>◇</div>
                        <div style={{ fontFamily: 'Inter,sans-serif', fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>No Revenue Data Available</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>Upload a dataset from the Dashboard first.</div>
                        <Button onClick={() => router.push('/')}>← Back to Dashboard</Button>
                    </div>
                </Card>
            ) : autoSkip ? spinnerCard('Moving to Ads Analysis…')
            : loading ? spinnerCard(`Analysing revenue from ${dataset?.name}…`)
            : metrics && (
                <>
                    {/* ── Primary KPI Row ──────────────────────────────────────── */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '24px' }}>
                        {[
                            { label: 'Total Revenue',  value: fmt(metrics.totalRevenue),  color: '#10b981', icon: '◇' },
                            { label: 'Pipeline Value',  value: fmt(metrics.pipelineValue), color: '#3b82f6', icon: '⬡' },
                            { label: 'Avg Deal Size',   value: fmt(metrics.avgDealSize),   color: '#f59e0b', icon: '◎' },
                            { label: 'Closed Deals',    value: metrics.closedDeals.toLocaleString(), color: '#a855f7', icon: '✓' },
                        ].map(kpi => (
                            <Card key={kpi.label} glow>
                                <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '1.5px', marginBottom: '10px' }}>{kpi.label.toUpperCase()}</div>
                                <div style={{ fontSize: '28px', fontFamily: 'Inter,sans-serif', fontWeight: 800, color: kpi.color }}>{kpi.value}</div>
                            </Card>
                        ))}
                    </div>

                    {/* ── Secondary KPI Row ────────────────────────────────────── */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px', marginBottom: '24px' }}>
                        {[
                            { label: 'Growth Rate',  value: metrics.growthRate !== 0 ? `${metrics.growthRate > 0 ? '+' : ''}${metrics.growthRate}%` : '—', color: metrics.growthRate >= 0 ? '#10b981' : '#ef4444' },
                            { label: 'Total Spend',  value: metrics.totalSpend > 0 ? fmt(metrics.totalSpend) : '—',                                           color: '#ef4444' },
                            { label: 'ROI',          value: metrics.roi !== 0 ? `${metrics.roi > 0 ? '+' : ''}${metrics.roi}%` : '—',                        color: metrics.roi >= 0 ? '#10b981' : '#ef4444' },
                        ].map(kpi => (
                            <Card key={kpi.label}>
                                <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '1.5px', marginBottom: '8px' }}>{kpi.label.toUpperCase()}</div>
                                <div style={{ fontSize: '26px', fontFamily: 'Inter,sans-serif', fontWeight: 800, color: kpi.color }}>{kpi.value}</div>
                            </Card>
                        ))}
                    </div>

                    {/* ── Best / Worst Revenue Segment ────────────────────────── */}
                    {(metrics.bestRevenue || metrics.worstRevenue) && (
                        <Card style={{ marginBottom: '24px' }}>
                            <h3 style={{ fontFamily: 'Inter,sans-serif', fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>🏆 Revenue Segment Performance</h3>
                            <div style={{ display: 'flex', gap: '16px' }}>
                                {metrics.bestRevenue && (
                                    <div style={{ padding: '16px 20px', background: '#10b98108', border: '1px solid #10b98130', borderRadius: '12px', flex: 1 }}>
                                        <div style={{ fontSize: '10px', letterSpacing: '1.5px', color: '#10b981', marginBottom: '8px' }}>★ BEST SEGMENT</div>
                                        <div style={{ fontFamily: 'Inter,sans-serif', fontSize: '18px', fontWeight: 800, marginBottom: '4px', color: '#10b981' }}>{metrics.bestRevenue.name}</div>
                                        <div style={{ fontFamily: 'DM Mono,monospace', fontSize: '13px', color: 'var(--text-secondary)' }}>{fmt(metrics.bestRevenue.value)}</div>
                                    </div>
                                )}
                                {metrics.worstRevenue && (
                                    <div style={{ padding: '16px 20px', background: '#ef444408', border: '1px solid #ef444430', borderRadius: '12px', flex: 1 }}>
                                        <div style={{ fontSize: '10px', letterSpacing: '1.5px', color: '#ef4444', marginBottom: '8px' }}>▼ WORST SEGMENT</div>
                                        <div style={{ fontFamily: 'Inter,sans-serif', fontSize: '18px', fontWeight: 800, marginBottom: '4px', color: '#ef4444' }}>{metrics.worstRevenue.name}</div>
                                        <div style={{ fontFamily: 'DM Mono,monospace', fontSize: '13px', color: 'var(--text-secondary)' }}>{fmt(metrics.worstRevenue.value)}</div>
                                    </div>
                                )}
                            </div>
                        </Card>
                    )}

                    {/* ── Monthly Chart + Region ───────────────────────────────── */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', marginBottom: '24px' }}>
                        {metrics.monthlyRevenue.length > 0 ? (
                            <Card>
                                <h3 style={{ fontFamily: 'Inter,sans-serif', fontSize: '15px', fontWeight: 700, marginBottom: '20px' }}>Monthly Revenue</h3>
                                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '140px' }}>
                                    {metrics.monthlyRevenue.map((m, i) => {
                                        const maxVal = Math.max(...metrics.monthlyRevenue.map(x => x.revenue));
                                        const pct = maxVal > 0 ? (m.revenue / maxVal) * 100 : 0;
                                        const isLast = i === metrics.monthlyRevenue.length - 1;
                                        return (
                                            <div key={m.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', height: '100%', justifyContent: 'flex-end' }}>
                                                <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'DM Mono,monospace' }}>{fmt(m.revenue)}</div>
                                                <div style={{ width: '100%', borderRadius: '4px 4px 0 0', background: isLast ? 'var(--success)' : 'var(--border)', height: `${pct}%`, minHeight: '6px', transition: 'height 0.8s ease' }} />
                                                <div style={{ fontSize: '9px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{m.month}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </Card>
                        ) : (
                            <Card>
                                <h3 style={{ fontFamily: 'Inter,sans-serif', fontSize: '15px', fontWeight: 700, marginBottom: '20px' }}>Monthly Revenue</h3>
                                <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No date column detected in dataset for trend.</div>
                            </Card>
                        )}

                        {metrics.byRegion.length > 0 ? (
                            <Card>
                                <h3 style={{ fontFamily: 'Inter,sans-serif', fontSize: '15px', fontWeight: 700, marginBottom: '20px' }}>
                                    Revenue by Region
                                    <span style={{ fontFamily: 'DM Mono,monospace', fontSize: '11px', color: 'var(--text-muted)', marginLeft: '8px' }}>({metrics.byRegion.length})</span>
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                    {metrics.byRegion.map((r, i) => {
                                        const maxVal = Math.max(...metrics.byRegion.map(x => x.revenue));
                                        const pct = metrics.totalRevenue > 0 ? Math.round((r.revenue / metrics.totalRevenue) * 100) : 0;
                                        return (
                                            <div key={r.region}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '12px' }}>
                                                    <span style={{ color: 'var(--text-secondary)' }}>{r.region}</span>
                                                    <span style={{ fontFamily: 'DM Mono,monospace', color: COLORS[i % COLORS.length] }}>{pct}% · {fmt(r.revenue)}</span>
                                                </div>
                                                <MiniBar value={r.revenue} max={maxVal} color={COLORS[i % COLORS.length]} />
                                            </div>
                                        );
                                    })}
                                </div>
                            </Card>
                        ) : (
                            <Card>
                                <h3 style={{ fontFamily: 'Inter,sans-serif', fontSize: '15px', fontWeight: 700, marginBottom: '20px' }}>Revenue by Region</h3>
                                <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No region column detected in dataset.</div>
                            </Card>
                        )}
                    </div>

                    {/* ── Deal Summary ─────────────────────────────────────────── */}
                    <Card style={{ marginBottom: '24px' }}>
                        <h3 style={{ fontFamily: 'Inter,sans-serif', fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>Deal Summary</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px' }}>
                            {[
                                { label: 'Closed Deals',  value: metrics.closedDeals.toLocaleString(), color: 'var(--success)' },
                                { label: 'Avg Deal Size', value: fmt(metrics.avgDealSize),             color: 'var(--accent-bright)' },
                                { label: 'Pipeline Value', value: fmt(metrics.pipelineValue),          color: '#f59e0b' },
                            ].map(d => (
                                <div key={d.label} style={{ textAlign: 'center', padding: '16px', background: 'var(--bg)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                    <div style={{ fontSize: '26px', fontFamily: 'Inter,sans-serif', fontWeight: 800, color: d.color }}>{d.value}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{d.label}</div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Button variant="ghost" onClick={() => router.push('/analysis/leads')}>← Back</Button>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <Button onClick={() => router.push('/analysis/ads')}>Next: Ads →</Button>
                    <Button variant="ghost" onClick={() => router.push('/analysis/summary')}
                        style={{ borderColor: 'var(--success)', color: 'var(--success)' }}>
                        Skip to Summary ✓
                    </Button>
                </div>
            </div>
        </div>
    );
}
