'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDataset } from '@/lib/store';
import { fetchApi } from '@/lib/api';
import { LeadMetrics, RevenueMetrics, AdsMetrics } from '@/lib/types';
import StepIndicator from '@/components/ui/StepIndicator';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

function fmt(v: any): string {
    const val = Number(v);
    if (v == null || isNaN(val)) return '—';
    return '₹' + val.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}
function fmtNum(v: any): string {
    const val = Number(v);
    if (v == null || isNaN(val)) return '—';
    return val.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

function isLikelyNoDataIssue(msg: string): boolean {
    const t = msg.toLowerCase();
    return ['no data', 'not found', 'missing', 'empty', 'upload', 'no dataset'].some(w => t.includes(w));
}

/* ── Inline stat row ─────────────────────────────────────────────────── */
function StatRow({ label, value, color }: { label: string; value: string; color: string }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{label}</span>
            <span style={{ fontFamily: 'DM Mono,monospace', fontSize: '13px', fontWeight: 600, color }}>{value}</span>
        </div>
    );
}

/* ── Section Card ─────────────────────────────────────────────────────── */
function SectionCard({ icon, title, color, children }: {
    icon: string; title: string; color: string; children: React.ReactNode;
}) {
    return (
        <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <span style={{ fontSize: '20px', color }}>{icon}</span>
                <h3 style={{ fontFamily: 'Inter,sans-serif', fontSize: '14px', fontWeight: 700 }}>{title}</h3>
            </div>
            {children}
        </Card>
    );
}

/* ── Submitted Success ────────────────────────────────────────────────── */
function SubmittedView({ onNewAnalysis, onViewReport, submittedAt }: {
    onNewAnalysis: () => void;
    onViewReport: () => void;
    submittedAt: string;
}) {
    return (
        <div className="fade-up" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
            <Card glow style={{ textAlign: 'center', maxWidth: '520px', margin: '0 auto', padding: '60px 40px' }}>
                <div style={{ fontSize: '64px', marginBottom: '20px' }}>✓</div>
                <div style={{ fontFamily: 'Inter,sans-serif', fontSize: '24px', fontWeight: 800, marginBottom: '8px', color: 'var(--success)' }}>
                    Analysis Submitted!
                </div>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px', lineHeight: 1.6 }}>
                    Your BHI analysis report has been saved successfully.
                </div>
                {submittedAt && (
                    <div style={{ fontFamily: 'DM Mono,monospace', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '28px' }}>
                        {new Date(submittedAt).toLocaleString('en-IN')}
                    </div>
                )}
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                    <Button variant="secondary" onClick={onViewReport}>View Report</Button>
                    <Button onClick={onNewAnalysis}>New Analysis</Button>
                </div>
            </Card>
        </div>
    );
}

/* ── Main Page ────────────────────────────────────────────────────────── */
export default function SummaryPage() {
    const router = useRouter();
    const { dataset } = useDataset();

    const [leads,   setLeads]   = useState<LeadMetrics | null>(null);
    const [revenue, setRevenue] = useState<RevenueMetrics | null>(null);
    const [ads,     setAds]     = useState<AdsMetrics | null>(null);

    const [loading,    setLoading]    = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submitted,  setSubmitted]  = useState(false);
    const [submittedAt, setSubmittedAt] = useState('');

    const [error,   setError]   = useState<string | null>(null);
    const [warning, setWarning] = useState<string | null>(null);

    /* ── Fetch all analytics on mount ────────────────────────────────── */
    useEffect(() => {
        if (!dataset) { setLoading(false); return; }

        async function fetchAll() {
            const [lRes, rRes, aRes] = await Promise.allSettled([
                fetchApi<{ metrics: LeadMetrics }>('/api/analytics?type=leads'),
                fetchApi<{ metrics: RevenueMetrics }>('/api/analytics?type=revenue'),
                fetchApi<{ metrics: AdsMetrics }>('/api/analytics?type=ads'),
            ]);

            const failures: string[] = [];

            if (lRes.status === 'fulfilled') setLeads(lRes.value.metrics);
            else failures.push(lRes.reason?.message || 'Leads analysis unavailable.');

            if (rRes.status === 'fulfilled') setRevenue(rRes.value.metrics);
            else failures.push(rRes.reason?.message || 'Revenue analysis unavailable.');

            if (aRes.status === 'fulfilled') setAds(aRes.value.metrics);
            else failures.push(aRes.reason?.message || 'Ads analysis unavailable.');

            const successCount = [lRes, rRes, aRes].filter(r => r.status === 'fulfilled').length;

            if (successCount === 0) {
                setError('Failed to load any analysis section. Please re-upload the dataset.');
            } else if (failures.length > 0) {
                const hasHardFail = failures.some(m => !isLikelyNoDataIssue(m));
                if (hasHardFail) {
                    setError('Some analysis sections failed to load due to a server error.');
                } else {
                    setWarning('Some sections were skipped — matching columns were not found in the current dataset.');
                }
            }
            setLoading(false);
        }

        fetchAll();
    }, [dataset]);

    /* ── Submit report to backend ────────────────────────────────────── */
    const handleSubmit = useCallback(async () => {
        if (submitting) return;
        setSubmitting(true);
        setError(null);
        try {
            const res = await fetchApi<{ status: string; submitted_at: string }>('/api/submit-report', {
                method: 'POST',
            });
            setSubmittedAt(res.submitted_at || '');
            setSubmitted(true);
        } catch (err: any) {
            setError(`Submit failed: ${err.message || 'Server error. Please try again.'}`);
        } finally {
            setSubmitting(false);
        }
    }, [submitting]);

    /* ── Generate dynamic insights from real data ───────────────────── */
    const insights: { icon: string; text: string; type: 'success' | 'warning' | 'info' }[] = [];

    if (leads) {
        if (leads.conversionRate > 10) insights.push({ icon: '↑', text: `Strong conversion rate of ${leads.conversionRate}% from ${leads.totalLeads.toLocaleString()} total leads.`, type: 'success' });
        else if (leads.conversionRate > 0) insights.push({ icon: '!', text: `Conversion rate is ${leads.conversionRate}% — consider optimising lead qualification.`, type: 'warning' });
        if (leads.bestLead) insights.push({ icon: '★', text: `Top lead source: "${leads.bestLead.source}" with ${leads.bestLead.count.toLocaleString()} leads (${leads.bestLead.percentage}%).`, type: 'info' });
        if (leads.worstLead && leads.topSources.length > 1) insights.push({ icon: '▼', text: `Weakest lead source: "${leads.worstLead.source}" — review and optimise allocation.`, type: 'warning' });
    }
    if (revenue) {
        if (revenue.roi > 0) insights.push({ icon: '◇', text: `Positive ROI of ${revenue.roi}% with ${revenue.closedDeals} closed deals.`, type: 'success' });
        if (revenue.growthRate > 0) insights.push({ icon: '↗', text: `Revenue growing at ${revenue.growthRate}% based on monthly trend.`, type: 'success' });
        if (revenue.bestRevenue) insights.push({ icon: '◈', text: `Best revenue segment: "${revenue.bestRevenue.name}" contributing ${fmt(revenue.bestRevenue.value)}.`, type: 'info' });
    }
    if (ads) {
        if (ads.roas >= 3) insights.push({ icon: '◉', text: `Excellent ROAS of ${ads.roas}x — ads are generating strong returns.`, type: 'success' });
        else if (ads.roas > 0) insights.push({ icon: '!', text: `ROAS is ${ads.roas}x — consider optimising spend across underperforming campaigns.`, type: 'warning' });
        if (ads.bestCampaign) insights.push({ icon: '★', text: `Best campaign: "${ads.bestCampaign.campaign}" with ${fmtNum(ads.bestCampaign.clicks)} clicks.`, type: 'success' });
    }
    // Fallback insights if no data
    if (insights.length === 0) {
        insights.push(
            { icon: '✓', text: 'Analysis pipeline completed. Upload a richer dataset to see detailed insights.', type: 'success' },
            { icon: '◈', text: 'Dataset profile synced with BHI Core engine.', type: 'info' },
        );
    }

    const typeColors = { success: '#10b981', warning: '#f59e0b', info: '#3b82f6' };

    if (submitted) {
        return <SubmittedView
            onNewAnalysis={() => router.push('/')}
            onViewReport={() => setSubmitted(false)}
            submittedAt={submittedAt}
        />;
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
                    <Alert type="error" title="Error" message={error} onClose={() => setError(null)} />
                </div>
            )}
            {warning && (
                <div style={{ marginBottom: '24px' }}>
                    <Alert type="warning" title="Partial Analysis" message={warning} onClose={() => setWarning(null)} />
                </div>
            )}

            {/* ── Loading ───────────────────────────────────────────────── */}
            {loading ? (
                <Card>
                    <div style={{ textAlign: 'center', padding: '60px 0' }}>
                        <div style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
                        <div style={{ color: 'var(--text-secondary)' }}>Generating full analysis report…</div>
                    </div>
                </Card>
            ) : (
                <>
                    {/* ── Report Header ──────────────────────────────────────── */}
                    <Card glow style={{ marginBottom: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                            <div>
                                <div style={{ fontSize: '11px', color: 'var(--accent-bright)', letterSpacing: '2px', marginBottom: '8px' }}>FULL ANALYSIS REPORT</div>
                                <h2 style={{ fontFamily: 'Inter,sans-serif', fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>BHI Business Intelligence Summary</h2>
                                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                    {dataset ? `Dataset: ${dataset.name}` : 'No dataset'} · Generated {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                                </div>
                            </div>
                            <span style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '12px', background: '#10b98115', color: 'var(--success)', border: '1px solid #10b98133' }}>
                                ✓ Complete
                            </span>
                        </div>
                    </Card>

                    {/* ── Overview Cards ─────────────────────────────────────── */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '20px', marginBottom: '24px' }}>
                        {leads ? (
                            <SectionCard icon="◈" title="Leads Overview" color="#3b82f6">
                                <StatRow label="Total Leads"     value={leads.totalLeads.toLocaleString()}     color="#3b82f6" />
                                <StatRow label="Qualified"       value={leads.qualifiedLeads.toLocaleString()} color="#10b981" />
                                <StatRow label="Converted"       value={leads.convertedLeads.toLocaleString()} color="#a855f7" />
                                <StatRow label="Conv. Rate"      value={`${leads.conversionRate}%`}            color="#f59e0b" />
                                {leads.bestLead && (
                                    <StatRow label="Best Source" value={leads.bestLead.source}                 color="#10b981" />
                                )}
                                {leads.costPerLead > 0 && (
                                    <StatRow label="Cost/Lead"   value={fmt(leads.costPerLead)}                color="#ef4444" />
                                )}
                            </SectionCard>
                        ) : (
                            <Card>
                                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: '13px' }}>
                                    <div style={{ fontSize: '32px', marginBottom: '12px', opacity: 0.3 }}>◈</div>
                                    No leads data found
                                </div>
                            </Card>
                        )}

                        {revenue ? (
                            <SectionCard icon="◇" title="Revenue Overview" color="#10b981">
                                <StatRow label="Total Revenue"  value={fmt(revenue.totalRevenue)}    color="#10b981" />
                                <StatRow label="Pipeline"       value={fmt(revenue.pipelineValue)}   color="#3b82f6" />
                                <StatRow label="Closed Deals"   value={String(revenue.closedDeals)}  color="#f59e0b" />
                                <StatRow label="Avg Deal Size"  value={fmt(revenue.avgDealSize)}     color="#a855f7" />
                                <StatRow label="ROI"            value={revenue.roi !== 0 ? `${revenue.roi > 0 ? '+' : ''}${revenue.roi}%` : '—'} color={revenue.roi >= 0 ? '#10b981' : '#ef4444'} />
                                {revenue.bestRevenue && (
                                    <StatRow label="Best Segment" value={revenue.bestRevenue.name}    color="#10b981" />
                                )}
                            </SectionCard>
                        ) : (
                            <Card>
                                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: '13px' }}>
                                    <div style={{ fontSize: '32px', marginBottom: '12px', opacity: 0.3 }}>◇</div>
                                    No revenue data found
                                </div>
                            </Card>
                        )}

                        {ads ? (
                            <SectionCard icon="◉" title="Ads Overview" color="#ef4444">
                                <StatRow label="Total Spend"    value={fmt(ads.totalSpend)}                      color="#ef4444" />
                                <StatRow label="Impressions"    value={fmtNum(ads.totalImpressions)}             color="#3b82f6" />
                                <StatRow label="Clicks"         value={fmtNum(ads.totalClicks)}                  color="#10b981" />
                                <StatRow label="Avg CTR"        value={`${ads.avgCTR}%`}                         color="#f59e0b" />
                                <StatRow label="ROAS"           value={`${ads.roas}x`}                           color="#10b981" />
                                {ads.bestCampaign && (
                                    <StatRow label="Best Campaign" value={ads.bestCampaign.campaign}             color="#10b981" />
                                )}
                            </SectionCard>
                        ) : (
                            <Card>
                                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: '13px' }}>
                                    <div style={{ fontSize: '32px', marginBottom: '12px', opacity: 0.3 }}>◉</div>
                                    No ads data found
                                </div>
                            </Card>
                        )}
                    </div>

                    {/* ── Best / Worst Summary ───────────────────────────────── */}
                    {(leads?.bestLead || revenue?.bestRevenue || ads?.bestCampaign) && (
                        <Card style={{ marginBottom: '24px' }}>
                            <h3 style={{ fontFamily: 'Inter,sans-serif', fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>🏆 Top Performers Across All Sections</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px' }}>
                                {leads?.bestLead && (
                                    <div style={{ padding: '14px', background: '#3b82f608', border: '1px solid #3b82f630', borderRadius: '10px' }}>
                                        <div style={{ fontSize: '10px', color: '#3b82f6', letterSpacing: '1px', marginBottom: '6px' }}>★ BEST LEAD SOURCE</div>
                                        <div style={{ fontFamily: 'Inter,sans-serif', fontWeight: 700, marginBottom: '4px' }}>{leads.bestLead.source}</div>
                                        <div style={{ fontFamily: 'DM Mono,monospace', fontSize: '12px', color: 'var(--text-secondary)' }}>{leads.bestLead.count.toLocaleString()} leads · {leads.bestLead.percentage}%</div>
                                    </div>
                                )}
                                {revenue?.bestRevenue && (
                                    <div style={{ padding: '14px', background: '#10b98108', border: '1px solid #10b98130', borderRadius: '10px' }}>
                                        <div style={{ fontSize: '10px', color: '#10b981', letterSpacing: '1px', marginBottom: '6px' }}>★ BEST REVENUE SEGMENT</div>
                                        <div style={{ fontFamily: 'Inter,sans-serif', fontWeight: 700, marginBottom: '4px' }}>{revenue.bestRevenue.name}</div>
                                        <div style={{ fontFamily: 'DM Mono,monospace', fontSize: '12px', color: 'var(--text-secondary)' }}>{fmt(revenue.bestRevenue.value)}</div>
                                    </div>
                                )}
                                {ads?.bestCampaign && (
                                    <div style={{ padding: '14px', background: '#ef444408', border: '1px solid #ef444430', borderRadius: '10px' }}>
                                        <div style={{ fontSize: '10px', color: '#ef4444', letterSpacing: '1px', marginBottom: '6px' }}>★ BEST CAMPAIGN</div>
                                        <div style={{ fontFamily: 'Inter,sans-serif', fontWeight: 700, marginBottom: '4px' }}>{ads.bestCampaign.campaign}</div>
                                        <div style={{ fontFamily: 'DM Mono,monospace', fontSize: '12px', color: 'var(--text-secondary)' }}>{fmtNum(ads.bestCampaign.clicks)} clicks · {ads.bestCampaign.conversions} conv.</div>
                                    </div>
                                )}
                            </div>
                        </Card>
                    )}

                    {/* ── Dynamic Insights ───────────────────────────────────── */}
                    <Card style={{ marginBottom: '24px' }}>
                        <h3 style={{ fontFamily: 'Inter,sans-serif', fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>
                            🔍 Key Insights &amp; Recommendations
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            {insights.map((ins, i) => {
                                const c = typeColors[ins.type];
                                return (
                                    <div key={i} style={{ display: 'flex', gap: '12px', padding: '12px', background: 'var(--bg)', borderRadius: '10px', border: '1px solid var(--border)' }}>
                                        <span style={{ fontSize: '16px', color: c, flexShrink: 0 }}>{ins.icon}</span>
                                        <span style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{ins.text}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                </>
            )}

            {/* ── Navigation ─────────────────────────────────────────────── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Button variant="ghost" onClick={() => router.push('/analysis/ads')}>← Back</Button>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <Button
                        size="lg"
                        loading={submitting}
                        onClick={handleSubmit}
                        style={{ background: 'var(--success)', border: '1px solid var(--success)', minWidth: '180px' }}
                    >
                        {submitting ? 'Submitting…' : 'Submit Analysis ✓'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
