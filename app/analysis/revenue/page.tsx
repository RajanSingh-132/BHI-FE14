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

export default function RevenuePage() {
    const router = useRouter();
    const { dataset } = useDataset();
    const [metrics, setMetrics] = useState<RevenueMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!dataset) { setLoading(false); return; }

        fetchApi<{ metrics: RevenueMetrics }>('/api/analytics?type=revenue')
            .then(res => { setMetrics(res.metrics); setLoading(false); })
            .catch(err => {
                setError(err.message || 'Failed to load revenue metrics.');
                setLoading(false);
            });
    }, [dataset]);

    const noDataset = !dataset;
    const fmt = (v: number) => '₹' + (v >= 1000000 ? (v / 1000000).toFixed(1) + 'M' : v >= 1000 ? (v / 1000).toFixed(0) + 'K' : v.toString());

    return (
        <div className="fade-up">
            <StepIndicator current="revenue" />

            {noDataset && (
                <div style={{ marginBottom: '24px' }}>
                    <Alert type="error" title="No Dataset Available"
                        message="No revenue data found. Please go back and upload a valid dataset containing revenue information before running this analysis." />
                </div>
            )}

            {error && (
                <div style={{ marginBottom: '24px' }}>
                    <Alert type="error" title="Analysis Error" message={error} onClose={() => setError(null)} />
                </div>
            )}

            {noDataset ? (
                <Card>
                    <div style={{ textAlign: 'center', padding: '60px 0' }}>
                        <div style={{ fontSize: '64px', marginBottom: '16px', opacity: 0.3 }}>◇</div>
                        <div style={{ fontFamily: 'Syne,sans-serif', fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>No Revenue Data Available</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>Upload a dataset from the Dashboard first.</div>
                        <Button onClick={() => router.push('/')}>← Back to Dashboard</Button>
                    </div>
                </Card>
            ) : loading ? (
                <Card>
                    <div style={{ textAlign: 'center', padding: '60px 0' }}>
                        <div style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
                        <div style={{ color: 'var(--text-secondary)' }}>Analysing revenue data from {dataset.name}...</div>
                    </div>
                </Card>
            ) : metrics && (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '24px' }}>
                        {[
                            { label: 'Total Revenue', value: fmt(metrics.totalRevenue), color: '#10b981' },
                            { label: 'Pipeline Value', value: fmt(metrics.pipelineValue), color: '#3b82f6' },
                            { label: 'Avg Deal Size', value: fmt(metrics.avgDealSize), color: '#f59e0b' },
                            { label: 'Closed Deals', value: metrics.closedDeals.toLocaleString(), color: '#a855f7' },
                        ].map(kpi => (
                            <Card key={kpi.label} glow>
                                <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '1.5px', marginBottom: '10px' }}>{kpi.label.toUpperCase()}</div>
                                <div style={{ fontSize: '28px', fontFamily: 'Syne,sans-serif', fontWeight: 800, color: kpi.color }}>{kpi.value}</div>
                            </Card>
                        ))}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', marginBottom: '24px' }}>
                        {metrics.monthlyRevenue.length > 0 && (
                            <Card>
                                <h3 style={{ fontFamily: 'Syne,sans-serif', fontSize: '15px', fontWeight: 700, marginBottom: '20px' }}>Monthly Revenue</h3>
                                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', height: '140px' }}>
                                    {metrics.monthlyRevenue.map((m, i) => {
                                        const max = Math.max(...metrics.monthlyRevenue.map(x => x.revenue));
                                        const pct = max > 0 ? (m.revenue / max) * 100 : 0;
                                        return (
                                            <div key={m.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', height: '100%', justifyContent: 'flex-end' }}>
                                                <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'DM Mono,monospace' }}>{fmt(m.revenue)}</div>
                                                <div style={{
                                                    width: '100%', borderRadius: '6px 6px 0 0',
                                                    background: i === metrics.monthlyRevenue.length - 1 ? 'var(--success)' : 'var(--border)',
                                                    height: `${pct}%`, minHeight: '8px', transition: 'height 0.8s ease',
                                                }} />
                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{m.month}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </Card>
                        )}

                        {metrics.byRegion.length > 0 ? (
                            <Card>
                                <h3 style={{ fontFamily: 'Syne,sans-serif', fontSize: '15px', fontWeight: 700, marginBottom: '20px' }}>Revenue by Region</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                    {metrics.byRegion.map((r, i) => {
                                        const max = Math.max(...metrics.byRegion.map(x => x.revenue));
                                        const pct = Math.round((r.revenue / metrics.totalRevenue) * 100);
                                        const colors = ['#10b981', '#3b82f6', '#f59e0b', '#a855f7', '#ec4899'];
                                        return (
                                            <div key={r.region}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '12px' }}>
                                                    <span style={{ color: 'var(--text-secondary)' }}>{r.region}</span>
                                                    <span style={{ fontFamily: 'DM Mono,monospace', color: colors[i % 5] }}>{pct}% · {fmt(r.revenue)}</span>
                                                </div>
                                                <div style={{ background: 'var(--bg)', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
                                                    <div style={{ height: '100%', borderRadius: '4px', background: colors[i % 5], width: `${(r.revenue / max) * 100}%`, transition: 'width 0.8s ease' }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </Card>
                        ) : (
                            <Card>
                                <h3 style={{ fontFamily: 'Syne,sans-serif', fontSize: '15px', fontWeight: 700, marginBottom: '20px' }}>Revenue by Region</h3>
                                <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No region data found in dataset.</div>
                            </Card>
                        )}
                    </div>

                    <Card style={{ marginBottom: '24px' }}>
                        <h3 style={{ fontFamily: 'Syne,sans-serif', fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>Deal Summary</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px' }}>
                            {[
                                { label: 'Closed Deals', value: metrics.closedDeals.toLocaleString(), color: 'var(--success)' },
                                { label: 'Avg Deal Size', value: fmt(metrics.avgDealSize), color: 'var(--accent-bright)' },
                                { label: 'Pipeline Value', value: fmt(metrics.pipelineValue), color: '#f59e0b' },
                            ].map(d => (
                                <div key={d.label} style={{ textAlign: 'center', padding: '16px', background: 'var(--bg)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                    <div style={{ fontSize: '26px', fontFamily: 'Syne,sans-serif', fontWeight: 800, color: d.color }}>{d.value}</div>
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
                    <Button variant="secondary" onClick={() => alert('Revenue report exported!')}>Export Report</Button>
                    <Button onClick={() => router.push('/analysis/ads')}>Next: Ads →</Button>
                    <Button variant="ghost" onClick={() => router.push('/analysis/summary')} style={{ borderColor: 'var(--success)', color: 'var(--success)' }}>Submit ✓</Button>
                </div>
            </div>
        </div>
    );
}