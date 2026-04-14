'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDataset } from '@/lib/store';
import { LeadMetrics } from '@/lib/types';
import { fetchApi } from '@/lib/api';
import StepIndicator from '@/components/ui/StepIndicator';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
    return (
        <div style={{ background: 'var(--bg)', borderRadius: '4px', height: '6px', overflow: 'hidden', flex: 1 }}>
            <div style={{
                height: '100%', borderRadius: '4px', background: color,
                width: `${(value / max) * 100}%`, transition: 'width 0.8s ease',
            }} />
        </div>
    );
}

export default function LeadsPage() {
    const router = useRouter();
    const { dataset } = useDataset();
    const [metrics, setMetrics] = useState<LeadMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!dataset) { setLoading(false); return; }

        fetchApi<{ metrics: LeadMetrics }>('/api/analytics?type=leads')
            .then(res => { setMetrics(res.metrics); setLoading(false); })
            .catch(err => {
                setError(err.message || 'Failed to load leads metrics.');
                setLoading(false);
            });
    }, [dataset]);

    const noDataset = !dataset;

    return (
        <div className="fade-up">
            <StepIndicator current="leads" />

            {noDataset && (
                <div style={{ marginBottom: '24px' }}>
                    <Alert type="error" title="No Dataset Available"
                        message="No leads data found in the dataset. Please go back to the Dashboard and upload a valid dataset containing lead information before running this analysis." />
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
                        <div style={{ fontSize: '64px', marginBottom: '16px', opacity: 0.3 }}>◈</div>
                        <div style={{ fontFamily: 'Syne,sans-serif', fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>No Leads Data Available</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
                            Upload a dataset from the Dashboard to see leads analytics here.
                        </div>
                        <Button onClick={() => router.push('/')}>← Back to Dashboard</Button>
                    </div>
                </Card>
            ) : loading ? (
                <Card>
                    <div style={{ textAlign: 'center', padding: '60px 0' }}>
                        <div style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
                        <div style={{ color: 'var(--text-secondary)' }}>Analysing leads data from {dataset.name}...</div>
                    </div>
                </Card>
            ) : metrics && (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '24px' }}>
                        {[
                            { label: 'Total Leads', value: metrics.totalLeads.toLocaleString(), color: '#3b82f6', icon: '◈' },
                            { label: 'Qualified Leads', value: metrics.qualifiedLeads.toLocaleString(), color: '#10b981', icon: '✓' },
                            { label: 'Conversion Rate', value: metrics.conversionRate + '%', color: '#f59e0b', icon: '↗' },
                            { label: 'Avg Lead Score', value: metrics.avgLeadScore, color: '#a855f7', icon: '◎' },
                        ].map(kpi => (
                            <Card key={kpi.label} glow>
                                <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '1.5px', marginBottom: '10px' }}>{kpi.label.toUpperCase()}</div>
                                <div style={{ fontSize: '30px', fontFamily: 'Syne,sans-serif', fontWeight: 800, color: kpi.color }}>{kpi.value}</div>
                                <div style={{ fontSize: '20px', color: kpi.color, opacity: 0.4, marginTop: '4px' }}>{kpi.icon}</div>
                            </Card>
                        ))}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                        <Card>
                            <h3 style={{ fontFamily: 'Syne,sans-serif', fontSize: '15px', fontWeight: 700, marginBottom: '20px' }}>Lead Sources</h3>
                            {metrics.topSources.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                    {metrics.topSources.map((s, i) => (
                                        <div key={s.source}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
                                                <span style={{ color: 'var(--text-secondary)' }}>{s.source}</span>
                                                <span style={{ fontFamily: 'DM Mono,monospace', color: ['#3b82f6', '#10b981', '#f59e0b', '#a855f7', '#ec4899'][i] }}>{s.percentage}%</span>
                                            </div>
                                            <MiniBar value={s.percentage} max={100} color={['#3b82f6', '#10b981', '#f59e0b', '#a855f7', '#ec4899'][i]} />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No source data found in dataset.</div>
                            )}
                        </Card>

                        <Card>
                            <h3 style={{ fontFamily: 'Syne,sans-serif', fontSize: '15px', fontWeight: 700, marginBottom: '20px' }}>Pipeline Status</h3>
                            {metrics.byStatus.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {metrics.byStatus.map((s, i) => (
                                        <div key={s.status} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: ['#3b82f6', '#f59e0b', '#10b981', '#a855f7', '#10b981'][i % 5], flexShrink: 0 }} />
                                            <div style={{ fontSize: '13px', flex: 1 }}>{s.status}</div>
                                            <div style={{ fontFamily: 'DM Mono,monospace', fontSize: '13px', color: 'var(--text-secondary)' }}>{s.count.toLocaleString()}</div>
                                            <MiniBar value={s.count} max={metrics.totalLeads} color={['#3b82f6', '#f59e0b', '#10b981', '#a855f7', '#10b981'][i % 5]} />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No status data found in dataset.</div>
                            )}
                        </Card>
                    </div>

                    {metrics.monthlyTrend.length > 0 && (
                        <Card style={{ marginBottom: '24px' }}>
                            <h3 style={{ fontFamily: 'Syne,sans-serif', fontSize: '15px', fontWeight: 700, marginBottom: '20px' }}>Monthly Lead Trend</h3>
                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', height: '120px' }}>
                                {metrics.monthlyTrend.map((m, i) => {
                                    const pct = (m.leads / Math.max(...metrics.monthlyTrend.map(x => x.leads))) * 100;
                                    return (
                                        <div key={m.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', height: '100%', justifyContent: 'flex-end' }}>
                                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'DM Mono,monospace' }}>{m.leads}</div>
                                            <div style={{
                                                width: '100%', borderRadius: '6px 6px 0 0',
                                                background: i === metrics.monthlyTrend.length - 1 ? 'var(--accent)' : 'var(--border)',
                                                height: `${pct}%`, minHeight: '8px', transition: 'height 0.8s ease',
                                            }} />
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{m.month}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>
                    )}
                </>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                <Button variant="ghost" onClick={() => router.push('/')}>← Back</Button>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <Button variant="secondary" onClick={() => alert('Analysis exported!')}>Export Report</Button>
                    <Button onClick={() => router.push('/analysis/revenue')}>Next: Revenue →</Button>
                    <Button variant="ghost" onClick={() => router.push('/analysis/summary')} style={{ borderColor: 'var(--success)', color: 'var(--success)' }}>Submit ✓</Button>
                </div>
            </div>
        </div>
    );
}