'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDataset } from '@/lib/store';
import { AdsMetrics, CampaignData } from '@/lib/types';
import { fetchApi } from '@/lib/api';
import StepIndicator from '@/components/ui/StepIndicator';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

const COLORS = ['#f97316', '#3b82f6', '#2563eb', '#ef4444', '#10b981', '#a855f7', '#06b6d4'];

function fmtCurrency(v: any): string {
    const val = Number(v);
    if (v == null || isNaN(val)) return '—';
    return '₹' + val.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}
function fmtNum(v: any): string {
    const val = Number(v);
    if (v == null || isNaN(val)) return '—';
    return val.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

function hasAdsData(m: AdsMetrics): boolean {
    return (
        m.totalSpend > 0 || m.totalImpressions > 0 ||
        m.totalClicks > 0 || m.byCampaign.length > 0 || m.byChannel.length > 0
    );
}

function BestWorstCampaign({ title, entry, color, icon }: { title: string; entry: CampaignData | null; color: string; icon: string }) {
    if (!entry) return null;
    const convRate = entry.clicks > 0 ? ((entry.conversions / entry.clicks) * 100).toFixed(1) : '0.0';
    return (
        <div style={{ padding: '16px 20px', background: `${color}08`, border: `1px solid ${color}30`, borderRadius: '12px', flex: 1 }}>
            <div style={{ fontSize: '10px', letterSpacing: '1.5px', color, marginBottom: '8px' }}>{icon} {title.toUpperCase()}</div>
            <div style={{ fontFamily: 'Inter,sans-serif', fontSize: '17px', fontWeight: 800, marginBottom: '6px', color }}>{entry.campaign}</div>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'DM Mono,monospace', fontSize: '12px', color: 'var(--text-secondary)' }}>Spend: {fmtCurrency(entry.spend)}</span>
                <span style={{ fontFamily: 'DM Mono,monospace', fontSize: '12px', color: 'var(--text-secondary)' }}>Clicks: {fmtNum(entry.clicks)}</span>
                <span style={{ fontFamily: 'DM Mono,monospace', fontSize: '12px', color: 'var(--text-secondary)' }}>Conv: {entry.conversions.toLocaleString()} ({convRate}%)</span>
            </div>
        </div>
    );
}

export default function AdsPage() {
    const router = useRouter();
    const { dataset } = useDataset();
    const [metrics, setMetrics] = useState<AdsMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState<string | null>(null);
    const [autoSkip, setAutoSkip] = useState<string | null>(null);

    useEffect(() => {
        if (!dataset) { setLoading(false); return; }
        let mounted = true;
        let timer: ReturnType<typeof setTimeout> | null = null;

        const skip = () => {
            if (!mounted) return;
            setAutoSkip('No ads data found in the current dataset. Moving to Summary…');
            setLoading(false);
            timer = setTimeout(() => { if (mounted) router.push('/analysis/summary'); }, 1200);
        };

        fetchApi<{ metrics: AdsMetrics }>('/api/analytics?type=ads')
            .then(res => {
                if (!mounted) return;
                if (!hasAdsData(res.metrics)) { skip(); return; }
                setMetrics(res.metrics);
                setLoading(false);
            })
            .catch(err => {
                if (!mounted) return;
                const msg: string = err.message || '';
                const noData = ['no dataset', 'not found', 'no data', 'upload'].some(t => msg.toLowerCase().includes(t));
                if (noData) { skip(); return; }
                setError(msg || 'Failed to load ads analysis.');
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
            <StepIndicator current="ads" />

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
                    <Alert type="info" title="Skipping Ads" message={autoSkip} />
                </div>
            )}

            {noDataset ? (
                <Card>
                    <div style={{ textAlign: 'center', padding: '60px 0' }}>
                        <div style={{ fontSize: '64px', marginBottom: '16px', opacity: 0.3 }}>◉</div>
                        <div style={{ fontFamily: 'Inter,sans-serif', fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>No Ads Data Available</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>Upload a dataset from the Dashboard first.</div>
                        <Button onClick={() => router.push('/')}>← Back to Dashboard</Button>
                    </div>
                </Card>
            ) : autoSkip ? spinnerCard('Moving to Summary…')
            : loading ? spinnerCard(`Analysing ads data from ${dataset?.name}…`)
            : metrics && (
                <>
                    {/* ── Primary KPI Row ──────────────────────────────────────── */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px', marginBottom: '24px' }}>
                        {[
                            { label: 'Total Ad Spend',   value: fmtCurrency(metrics.totalSpend),       color: '#ef4444', sub: 'All campaigns' },
                            { label: 'Total Impressions', value: fmtNum(metrics.totalImpressions),      color: '#3b82f6', sub: 'Across all channels' },
                            { label: 'Total Clicks',     value: fmtNum(metrics.totalClicks),            color: '#10b981', sub: 'All campaigns' },
                        ].map(kpi => (
                            <Card key={kpi.label} glow>
                                <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '1.5px', marginBottom: '10px' }}>{kpi.label.toUpperCase()}</div>
                                <div style={{ fontSize: '30px', fontFamily: 'Inter,sans-serif', fontWeight: 800, color: kpi.color }}>{kpi.value}</div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{kpi.sub}</div>
                            </Card>
                        ))}
                    </div>

                    {/* ── Performance Ratios ───────────────────────────────────── */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '24px' }}>
                        {[
                            { label: 'Avg CTR',          value: `${metrics.avgCTR}%`,                  color: '#f59e0b', good: metrics.avgCTR > 2 },
                            { label: 'Avg CPC',          value: `₹${metrics.avgCPC.toFixed(2)}`,       color: '#a855f7', good: true },
                            { label: 'ROAS',             value: `${metrics.roas}x`,                    color: '#10b981', good: metrics.roas >= 3 },
                            { label: 'Cost/Conversion',  value: metrics.costPerConversion > 0 ? fmtCurrency(metrics.costPerConversion) : '—', color: '#06b6d4', good: true },
                        ].map(kpi => (
                            <Card key={kpi.label}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '1.5px', marginBottom: '10px' }}>{kpi.label.toUpperCase()}</div>
                                        <div style={{ fontSize: '24px', fontFamily: 'Inter,sans-serif', fontWeight: 800, color: kpi.color }}>{kpi.value}</div>
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

                    {/* ── Best / Worst Campaign ────────────────────────────────── */}
                    {(metrics.bestCampaign || metrics.worstCampaign) && (
                        <Card style={{ marginBottom: '24px' }}>
                            <h3 style={{ fontFamily: 'Inter,sans-serif', fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>🏆 Campaign Performance</h3>
                            <div style={{ display: 'flex', gap: '16px' }}>
                                <BestWorstCampaign title="Best Campaign"  entry={metrics.bestCampaign}  color="#10b981" icon="★" />
                                <BestWorstCampaign title="Worst Campaign" entry={metrics.worstCampaign} color="#ef4444" icon="▼" />
                            </div>
                        </Card>
                    )}

                    {/* ── Totals row ───────────────────────────────────────────── */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '16px', marginBottom: '24px' }}>
                        <Card>
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '1.5px', marginBottom: '8px' }}>TOTAL CONVERSIONS</div>
                            <div style={{ fontSize: '26px', fontFamily: 'Inter,sans-serif', fontWeight: 800, color: '#f97316' }}>
                                {metrics.totalConversions > 0 ? metrics.totalConversions.toLocaleString() : '—'}
                            </div>
                        </Card>
                        <Card>
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '1.5px', marginBottom: '8px' }}>TOTAL CAMPAIGNS</div>
                            <div style={{ fontSize: '26px', fontFamily: 'Inter,sans-serif', fontWeight: 800, color: '#6366f1' }}>
                                {metrics.byCampaign.length > 0 ? metrics.byCampaign.length : '—'}
                            </div>
                        </Card>
                    </div>

                    {/* ── Campaign Performance Table ───────────────────────────── */}
                    {metrics.byCampaign.length > 0 && (
                        <Card style={{ marginBottom: '24px' }}>
                            <h3 style={{ fontFamily: 'Inter,sans-serif', fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>
                                All Campaigns
                                <span style={{ fontFamily: 'DM Mono,monospace', fontSize: '11px', color: 'var(--text-muted)', marginLeft: '8px' }}>({metrics.byCampaign.length})</span>
                            </h3>
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
                                        {metrics.byCampaign.map(c => {
                                            const convRate = c.clicks > 0 ? ((c.conversions / c.clicks) * 100).toFixed(1) : '0.0';
                                            const isTop = c.campaign === metrics.bestCampaign?.campaign;
                                            return (
                                                <tr key={c.campaign} style={{ borderBottom: '1px solid var(--border)' }}
                                                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                                                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                                    <td style={{ padding: '12px', fontWeight: 500 }}>
                                                        {isTop && <span style={{ marginRight: '6px', fontSize: '12px' }}>★</span>}
                                                        {c.campaign}
                                                    </td>
                                                    <td style={{ padding: '12px', fontFamily: 'DM Mono,monospace', color: '#ef4444' }}>{fmtCurrency(c.spend)}</td>
                                                    <td style={{ padding: '12px', fontFamily: 'DM Mono,monospace', color: '#3b82f6' }}>{fmtNum(c.clicks)}</td>
                                                    <td style={{ padding: '12px', fontFamily: 'DM Mono,monospace', color: '#10b981' }}>{c.conversions.toLocaleString()}</td>
                                                    <td style={{ padding: '12px' }}>
                                                        <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', background: 'var(--accent-soft)', color: 'var(--accent-bright)', fontFamily: 'DM Mono,monospace' }}>
                                                            {convRate}%
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    )}

                    {/* ── Channel ROAS ─────────────────────────────────────────── */}
                    {metrics.byChannel.length > 0 && (
                        <Card style={{ marginBottom: '24px' }}>
                            <h3 style={{ fontFamily: 'Inter,sans-serif', fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>
                                Channel ROAS
                                <span style={{ fontFamily: 'DM Mono,monospace', fontSize: '11px', color: 'var(--text-muted)', marginLeft: '8px' }}>({metrics.byChannel.length})</span>
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(metrics.byChannel.length, 4)},1fr)`, gap: '12px' }}>
                                {metrics.byChannel.map((ch, i) => (
                                    <div key={ch.channel} style={{ padding: '16px', background: 'var(--bg)', borderRadius: '12px', border: '1px solid var(--border)', textAlign: 'center' }}>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>{ch.channel}</div>
                                        <div style={{ fontSize: '24px', fontFamily: 'Inter,sans-serif', fontWeight: 800, color: COLORS[i % COLORS.length] }}>{ch.roas}x</div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>{fmtCurrency(ch.spend)} spend</div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}

                    {metrics.byCampaign.length === 0 && metrics.byChannel.length === 0 && (
                        <Card style={{ marginBottom: '24px' }}>
                            <div style={{ color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center', padding: '32px 0' }}>
                                No campaign or channel breakdown columns detected in dataset.
                            </div>
                        </Card>
                    )}
                </>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Button variant="ghost" onClick={() => router.push('/analysis/revenue')}>← Back</Button>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <Button onClick={() => router.push('/analysis/summary')}>Next: Summary →</Button>
                </div>
            </div>
        </div>
    );
}
