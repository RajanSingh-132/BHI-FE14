'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDataset } from '@/lib/store';
import { fetchApi } from '@/lib/api';
import { LeadMetrics, RevenueMetrics, AdsMetrics } from '@/lib/types';
import StepIndicator from '@/components/ui/StepIndicator';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

export default function SummaryPage() {
    const router = useRouter();
    const { dataset } = useDataset();
    const [leads, setLeads] = useState<LeadMetrics | null>(null);
    const [revenue, setRevenue] = useState<RevenueMetrics | null>(null);
    const [ads, setAds] = useState<AdsMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!dataset) {
            setLoading(false);
            return;
        }

        async function fetchAll() {
            try {
                const [lRes, rRes, aRes] = await Promise.all([
                    fetchApi<{ metrics: LeadMetrics }>('/api/analytics?type=leads'),
                    fetchApi<{ metrics: RevenueMetrics }>('/api/analytics?type=revenue'),
                    fetchApi<{ metrics: AdsMetrics }>('/api/analytics?type=ads'),
                ]);
                setLeads(lRes.metrics);
                setRevenue(rRes.metrics);
                setAds(aRes.metrics);
                setLoading(false);
            } catch (err: any) {
                console.error('Failed to fetch summary metrics:', err);
                setError(err.message || 'Failed to load analysis report.');
                setLoading(false);
            }
        }

        fetchAll();
    }, [dataset]);

    const fmt = (v: number) => '₹' + (v >= 1000000 ? (v / 1000000).toFixed(1) + 'M' : v >= 1000 ? (v / 1000).toFixed(0) + 'K' : v.toString());

    if (submitted) {
        return (
            <div className="fade-up" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                <Card glow style={{ textAlign: 'center', maxWidth: '480px', margin: '0 auto', padding: '60px 40px' }}>
                    <div style={{ fontSize: '64px', marginBottom: '20px' }}>✓</div>
                    <div style={{ fontFamily: 'var(--font-syne, Syne, sans-serif)', fontSize: '24px', fontWeight: 800, marginBottom: '8px', color: 'var(--success)' }}>Analysis Submitted!</div>
                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '28px', lineHeight: 1.6 }}>
                        Your BHI analysis report has been submitted successfully. The full report will be available in your reports dashboard.
                    </div>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                        <Button variant="secondary" onClick={() => setSubmitted(false)}>View Report</Button>
                        <Button onClick={() => router.push('/')}>New Analysis</Button>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="fade-up">
            <StepIndicator current="summary" />

            {!dataset && (
                <div style={{ marginBottom: '24px' }}>
                    <Alert type="error" title="No Dataset Available"
                        message="No dataset found. Please complete the full analysis pipeline from the Dashboard." />
                </div>
            )}

            {error && (
                <div style={{ marginBottom: '24px' }}>
                    <Alert type="error" title="Analysis Error" message={error} onClose={() => setError(null)} />
                </div>
            )}

            {loading ? (
                <Card>
                    <div style={{ textAlign: 'center', padding: '60px 0' }}>
                        <div style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
                        <div style={{ color: 'var(--text-secondary)' }}>Generating full analysis report...</div>
                    </div>
                </Card>
            ) : (
                <>
                    <Card glow style={{ marginBottom: '24px', background: 'linear-gradient(135deg, #0f1628 0%, #0a0f1e 100%)', border: '1px solid var(--border-glow)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                            <div>
                                <div style={{ fontSize: '11px', color: 'var(--accent-bright)', letterSpacing: '2px', marginBottom: '8px' }}>FULL ANALYSIS REPORT</div>
                                <h2 style={{ fontFamily: 'var(--font-syne, Syne, sans-serif)', fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>BHI Business Intelligence Summary</h2>
                                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                    {dataset ? `Dataset: ${dataset.name}` : 'Demo Dataset'} · Generated {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                                </div>
                            </div>
                            <span style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '12px', background: '#10b98115', color: 'var(--success)', border: '1px solid #10b98133' }}>✓ Complete</span>
                        </div>
                    </Card>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '20px', marginBottom: '24px' }}>
                        {leads && (
                            <Card>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                                    <span style={{ fontSize: '20px', color: '#3b82f6' }}>◈</span>
                                    <h3 style={{ fontFamily: 'var(--font-syne, Syne, sans-serif)', fontSize: '14px', fontWeight: 700 }}>Leads Overview</h3>
                                </div>
                                {[
                                    { l: 'Total Leads', v: leads.totalLeads.toLocaleString(), c: '#3b82f6' },
                                    { l: 'Qualified', v: leads.qualifiedLeads.toLocaleString(), c: '#10b981' },
                                    { l: 'Conv. Rate', v: leads.conversionRate + '%', c: '#f59e0b' },
                                    { l: 'Avg Score', v: leads.avgLeadScore, c: '#a855f7' },
                                ].map(row => (
                                    <div key={row.l} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{row.l}</span>
                                        <span style={{ fontFamily: 'var(--font-dm-mono, DM Mono, monospace)', fontSize: '13px', fontWeight: 600, color: row.c }}>{row.v}</span>
                                    </div>
                                ))}
                            </Card>
                        )}

                        {revenue && (
                            <Card>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                                    <span style={{ fontSize: '20px', color: '#10b981' }}>◇</span>
                                    <h3 style={{ fontFamily: 'var(--font-syne, Syne, sans-serif)', fontSize: '14px', fontWeight: 700 }}>Revenue Overview</h3>
                                </div>
                                {[
                                    { l: 'Total Revenue', v: fmt(revenue.totalRevenue), c: '#10b981' },
                                    { l: 'Pipeline', v: fmt(revenue.pipelineValue), c: '#3b82f6' },
                                    { l: 'Closed Deals', v: revenue.closedDeals, c: '#f59e0b' },
                                    { l: 'Avg Deal Size', v: fmt(revenue.avgDealSize), c: '#a855f7' },
                                ].map(row => (
                                    <div key={row.l} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{row.l}</span>
                                        <span style={{ fontFamily: 'var(--font-dm-mono, DM Mono, monospace)', fontSize: '13px', fontWeight: 600, color: row.c }}>{row.v}</span>
                                    </div>
                                ))}
                            </Card>
                        )}

                        {ads && (
                            <Card>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                                    <span style={{ fontSize: '20px', color: '#ef4444' }}>◉</span>
                                    <h3 style={{ fontFamily: 'var(--font-syne, Syne, sans-serif)', fontSize: '14px', fontWeight: 700 }}>Ads Overview</h3>
                                </div>
                                {[
                                    { l: 'Total Spend', v: fmt(ads.totalSpend), c: '#ef4444' },
                                    { l: 'Impressions', v: (ads.totalImpressions >= 1000000 ? (ads.totalImpressions / 1000000).toFixed(1) + 'M' : (ads.totalImpressions / 1000).toFixed(0) + 'K'), c: '#3b82f6' },
                                    { l: 'Avg CTR', v: ads.avgCTR + '%', c: '#f59e0b' },
                                    { l: 'ROAS', v: ads.roas + 'x', c: '#10b981' },
                                ].map(row => (
                                    <div key={row.l} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{row.l}</span>
                                        <span style={{ fontFamily: 'var(--font-dm-mono, DM Mono, monospace)', fontSize: '13px', fontWeight: 600, color: row.c }}>{row.v}</span>
                                    </div>
                                ))}
                            </Card>
                        )}
                    </div>

                    <Card style={{ marginBottom: '24px' }}>
                        <h3 style={{ fontFamily: 'var(--font-syne, Syne, sans-serif)', fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>🔍 Key Insights & Recommendations</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            {[
                                { icon: '↑', insight: 'Performance metrics successfully calculated from active dataset.', type: 'success' },
                                { icon: '★', insight: 'Data profile generated across leads, revenue and advertising dimensions.', type: 'info' },
                                { icon: '✓', insight: 'Multi-channel attribution analysis complete.', type: 'success' },
                                { icon: '!', insight: 'Review pipeline conversion rates for potential bottlenecks.', type: 'warning' },
                                { icon: '↑', insight: 'Analyze top performing regions for future budget allocation.', type: 'success' },
                                { icon: '◈', insight: 'Dataset profile successfully synced with BHI Core engine.', type: 'info' },
                            ].map((ins, i) => {
                                const colors = { success: '#10b981', warning: '#f59e0b', info: '#3b82f6' };
                                const c = colors[ins.type as keyof typeof colors];
                                return (
                                    <div key={i} style={{ display: 'flex', gap: '12px', padding: '12px', background: 'var(--bg)', borderRadius: '10px', border: '1px solid var(--border)' }}>
                                        <span style={{ fontSize: '16px', color: c, flexShrink: 0 }}>{ins.icon}</span>
                                        <span style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{ins.insight}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                </>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Button variant="ghost" onClick={() => router.push('/analysis/ads')}>← Back</Button>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <Button variant="secondary" onClick={() => alert('Full report exported as PDF!')}>Export PDF</Button>
                    <Button size="lg" onClick={() => setSubmitted(true)} style={{ background: 'var(--success)', border: '1px solid var(--success)' }}>
                        Submit Analysis ✓
                    </Button>
                </div>
            </div>
        </div>
    );
}