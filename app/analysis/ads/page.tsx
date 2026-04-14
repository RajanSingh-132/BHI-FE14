'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDataset } from '@/lib/store';
import { AdsMetrics } from '@/lib/types';
import { fetchApi } from '@/lib/api';
import StepIndicator from '@/components/ui/StepIndicator';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

export default function AdsPage() {
    const router = useRouter();
    const { dataset } = useDataset();
    const [metrics, setMetrics] = useState<AdsMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!dataset) { setLoading(false); return; }

        fetchApi<{ metrics: AdsMetrics }>('/api/analytics?type=ads')
            .then(res => { setMetrics(res.metrics); setLoading(false); })
            .catch(err => {
                setError(err.message || 'Failed to load ads metrics.');
                setLoading(false);
            });
    }, [dataset]);

    const noDataset = !dataset;
    const fmt = (v: number) => '₹' + (v >= 1000000 ? (v / 1000000).toFixed(1) + 'M' : v >= 1000 ? (v / 1000).toFixed(0) + 'K' : v.toString());
    const fmtNum = (v: number) => v >= 1000000 ? (v / 1000000).toFixed(1) + 'M' : v >= 1000 ? (v / 1000).toFixed(0) + 'K' : v.toString();

    return (
        <div className="fade-up">
            <StepIndicator current="ads" />

            {noDataset && (
                <div style={{ marginBottom: '24px' }}>
                    <Alert type="error" title="No Dataset Available"
                        message="No advertising data found in the dataset. Please upload a valid dataset containing ads campaign data before running this analysis." />
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
                        <div style={{ fontSize: '64px', marginBottom: '16px', opacity: 0.3 }}>◉</div>
                        <div style={{ fontFamily: 'Syne,sans-serif', fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>No Ads Data Available</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>Upload a dataset from the Dashboard first.</div>
                        <Button onClick={() => router.push('/')}>← Back to Dashboard</Button>
                    </div>
                </Card>
            ) : loading ? (
                <Card>
                    <div style={{ textAlign: 'center', padding: '60px 0' }}>
                        <div style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
                        <div style={{ color: 'var(--text-secondary)' }}>Analysing advertising data from {dataset.name}...</div>
                    </div>
                </Card>
            ) : metrics && (
                <>
                    {/* Top 3 KPIs */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px', marginBottom: '24px' }}>
                        {[
                            { label: 'Total Ad Spend', value: fmt(metrics.totalSpend), color: '#ef4444', sub: 'All campaigns' },
                            { label: 'Total Impressions', value: fmtNum(metrics.totalImpressions), color: '#3b82f6', sub: 'Across all channels' },
                            { label: 'Total Clicks', value: fmtNum(metrics.totalClicks), color: '#10b981', sub: 'All campaigns' },
                        ].map(kpi => (
                            <Card key={kpi.label} glow>
                                <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '1.5px', marginBottom: '10px' }}>{kpi.label.toUpperCase()}</div>
                                <div style={{ fontSize: '30px', fontFamily: 'Syne,sans-serif', fontWeight: 800, color: kpi.color }}>{kpi.value}</div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{kpi.sub}</div>
                            </Card>
                        ))}
                    </div>

                    {/* Performance ratios */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px', marginBottom: '24px' }}>
                        {[
                            { label: 'Avg CTR', value: metrics.avgCTR + '%', color: '#f59e0b', good: metrics.avgCTR > 2 },
                            { label: 'Avg CPC', value: '₹' + metrics.avgCPC.toFixed(2), color: '#a855f7', good: true },
                            { label: 'ROAS', value: metrics.roas + 'x', color: '#10b981', good: metrics.roas > 3 },
                        ].map(kpi => (
                            <Card key={kpi.label}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '1.5px', marginBottom: '10px' }}>{kpi.label.toUpperCase()}</div>
                                        <div style={{ fontSize: '28px', fontFamily: 'Syne,sans-serif', fontWeight: 800, color: kpi.color }}>{kpi.value}</div>
                                    </div>
                                    <span style={{
                                        fontSize: '10px', padding: '3px 8px', borderRadius: '20px',
                                        background: kpi.good ? '#10b98115' : '#ef444415',
                                        color: kpi.good ? 'var(--success)' : '#ef4444',
                                        border: `1px solid ${kpi.good ? '#10b98130' : '#ef444430'}`,
                                    }}>{kpi.good ? '✓ Good' : '↓ Low'}</span>
                                </div>
                            </Card>
                        ))}
                    </div>

                    {/* Campaign Performance Table */}
                    {metrics.byCampaign.length > 0 && (
                        <Card style={{ marginBottom: '24px' }}>
                            <h3 style={{ fontFamily: 'Syne,sans-serif', fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>Campaign Performance</h3>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                            {['Campaign', 'Spend', 'Clicks', 'Conversions', 'Conv. Rate'].map(h => (
                                                <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text-muted)', fontSize: '11px', letterSpacing: '1px', fontWeight: 500 }}>{h.toUpperCase()}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {metrics.byCampaign.map(c => (
                                            <tr key={c.campaign} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}
                                                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                                <td style={{ padding: '12px', fontWeight: 500 }}>{c.campaign}</td>
                                                <td style={{ padding: '12px', fontFamily: 'DM Mono,monospace', color: '#ef4444' }}>{fmt(c.spend)}</td>
                                                <td style={{ padding: '12px', fontFamily: 'DM Mono,monospace', color: '#3b82f6' }}>{fmtNum(c.clicks)}</td>
                                                <td style={{ padding: '12px', fontFamily: 'DM Mono,monospace', color: '#10b981' }}>{c.conversions.toLocaleString()}</td>
                                                <td style={{ padding: '12px' }}>
                                                    <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', background: 'var(--accent-soft)', color: 'var(--accent-bright)', fontFamily: 'DM Mono,monospace' }}>
                                                        {c.clicks > 0 ? ((c.conversions / c.clicks) * 100).toFixed(1) : '0.0'}%
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    )}

                    {/* Channel ROAS */}
                    {metrics.byChannel.length > 0 && (
                        <Card style={{ marginBottom: '24px' }}>
                            <h3 style={{ fontFamily: 'Syne,sans-serif', fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>Channel ROAS</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(metrics.byChannel.length, 4)},1fr)`, gap: '12px' }}>
                                {metrics.byChannel.map((ch, i) => {
                                    const colors = ['#f97316', '#3b82f6', '#2563eb', '#ef4444'];
                                    return (
                                        <div key={ch.channel} style={{ padding: '16px', background: 'var(--bg)', borderRadius: '12px', border: '1px solid var(--border)', textAlign: 'center' }}>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>{ch.channel}</div>
                                            <div style={{ fontSize: '24px', fontFamily: 'Syne,sans-serif', fontWeight: 800, color: colors[i % 4] }}>{ch.roas}x</div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>{fmt(ch.spend)} spend</div>
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>
                    )}

                    {/* Show message if no campaign/channel data */}
                    {metrics.byCampaign.length === 0 && metrics.byChannel.length === 0 && (
                        <Card style={{ marginBottom: '24px' }}>
                            <div style={{ color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center', padding: '32px 0' }}>
                                No campaign or channel breakdown data found in the dataset.
                            </div>
                        </Card>
                    )}
                </>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Button variant="ghost" onClick={() => router.push('/analysis/revenue')}>← Back</Button>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <Button variant="secondary" onClick={() => alert('Ads report exported!')}>Export Report</Button>
                    <Button onClick={() => router.push('/analysis/summary')}>Next: Full Analysis →</Button>
                    <Button variant="ghost" onClick={() => router.push('/analysis/summary')} style={{ borderColor: 'var(--success)', color: 'var(--success)' }}>Submit ✓</Button>
                </div>
            </div>
        </div>
    );
}