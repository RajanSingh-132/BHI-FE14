'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useDataset } from '@/lib/store';
import { LeadMetrics } from '@/lib/types';
import { fetchApi } from '@/lib/api';
import { ArrowLeft, ArrowRight, TrendingUp, Users, Target, BarChart3, Star, Zap, Sparkles, Trophy, AlertCircle, Quote, Receipt, UserCheck, Info, CheckCircle } from 'lucide-react';
import StepIndicator from '@/components/ui/StepIndicator';
import LeadTrendChart from '@/components/charts/LeadTrendChart';

const COLORS = ['#f59e0b', '#fbbf24', '#d97706', '#92400e', '#78350f'];

export default function LeadsPage() {
    const router = useRouter();
    const { dataset } = useDataset();
    const [metrics, setMetrics] = useState<LeadMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
    const hasFetched = useRef(false);

    useEffect(() => {
        if (!dataset || hasFetched.current) {
            if (!dataset) setLoading(false);
            return;
        }

        hasFetched.current = true;
        fetchApi<{ metrics: LeadMetrics }>('/api/analytics?type=leads')
            .then(res => {
                setMetrics(res.metrics);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [dataset]);

    if (!dataset) return (
        <div className="h-full flex flex-col items-center justify-center p-6 text-center gap-6">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="font-syne text-2xl font-extrabold text-slate-900 tracking-tight">No Dataset Available</h2>
            <p className="text-slate-500 max-w-sm mb-2">Please upload your financial dataset to begin the analysis process.</p>
            <button onClick={() => router.push('/')} className="btn-primary px-8 py-3 rounded-xl flex items-center gap-2">
                <ArrowLeft size={18} /> Back to Dashboard
            </button>
        </div>
    );

    if (loading) return (
        <div className="h-full flex flex-col items-center justify-center p-6 gap-6">
            <div className="w-12 h-12 border-4 border-slate-100 border-t-amber-500 rounded-full animate-spin" />
            <div className="text-slate-500 font-semibold tracking-wide animate-pulse uppercase text-xs">Analyzing lead performance...</div>
        </div>
    );

    // Dynamic Chart Data Calculations
    const trendData = metrics?.monthlyTrend || [];

    // Lookup byStatus buckets by canonical name (not index)
    const wonStatus = metrics?.byStatus?.find(s => s.status === 'Won');
    const qualifiedStatus = metrics?.byStatus?.find(s => s.status === 'Qualified');
    const contactedStatus = metrics?.byStatus?.find(s => s.status === 'Contacted');

    const count1Label = 'Won';
    const count1Value = wonStatus?.count ?? metrics?.convertedLeads ?? 0;
    const rev1Label = 'WON REVENUE';
    const rev1Value = wonStatus?.revenue ?? metrics?.wonRevenue ?? 0;

    const count2Label = 'Qualified';
    const count2Value = qualifiedStatus?.count ?? metrics?.qualifiedLeads ?? 0;
    const rev2Label = 'QUAL. REVENUE';
    const rev2Value = qualifiedStatus?.revenue ?? metrics?.qualifiedRevenue ?? 0;

    const count3Label = 'Contacted';
    const count3Value = contactedStatus?.count ?? metrics?.contactedLeads ?? 0;
    const rev3Label = 'CONT. REVENUE';
    const rev3Value = contactedStatus?.revenue ?? metrics?.contactedRevenue ?? 0;


    const dynamicKPIs = [
        // Row 1: Counts
        { label: 'Total Leads', value: metrics?.totalLeads ?? 0, icon: Users, bg: 'bg-amber-50', color: 'text-amber-600' },
        { label: count1Label, value: count1Value, icon: CheckCircle, bg: 'bg-emerald-50', color: 'text-emerald-600' },
        { label: count2Label, value: count2Value, icon: Target, bg: 'bg-blue-50', color: 'text-blue-600' },
        { label: count3Label, value: count3Value, icon: Users, bg: 'bg-indigo-50', color: 'text-indigo-600' },
        { label: 'Conv. Rate', value: `${metrics?.conversionRate ?? 0}%`, icon: Zap, bg: 'bg-zinc-50', color: 'text-zinc-600' },

        // Row 2: Financials/Performance
        { label: 'Total Revenue', value: `₹${(metrics?.totalRevenue ?? 0).toLocaleString()}`, icon: TrendingUp, bg: 'bg-zinc-50', color: 'text-zinc-600' },
        { label: rev1Label, value: `₹${rev1Value.toLocaleString()}`, icon: TrendingUp, bg: 'bg-emerald-50', color: 'text-emerald-600' },
        { label: rev2Label, value: `₹${rev2Value.toLocaleString()}`, icon: TrendingUp, bg: 'bg-blue-50', color: 'text-blue-600' },
        { label: rev3Label, value: `₹${rev3Value.toLocaleString()}`, icon: Users, bg: 'bg-indigo-50', color: 'text-indigo-600' },

        { label: 'Cost/Lead', value: `₹${metrics?.costPerLead ?? 0}`, icon: TrendingUp, bg: 'bg-rose-50', color: 'text-rose-600' },
    ];

    const hasWon = metrics?.topSources?.some(s => (s.won ?? 0) > 0);
    const hasQualified = metrics?.topSources?.some(s => (s.qualified ?? 0) > 0);
    const hasContacted = metrics?.topSources?.some(s => (s.contacted ?? 0) > 0);
    const hasRevenue = metrics?.topSources?.some(s => (s.revenue ?? 0) > 0);
    const hasCost = metrics?.topSources?.some(s => (s.cost ?? 0) > 0);
    const hasProfit = metrics?.topSources?.some(s => (s.profit ?? 0) !== 0);
    const hasTotalRevenue = metrics?.topSources?.some(s => (s.totalRevenue ?? 0) > 0);

    return (
        <div className="min-h-full flex flex-col bg-[var(--bg)] text-[var(--text-primary)] overflow-y-auto pb-24 md:pb-10">
            {/* Header Section */}
            <div className="hidden md:flex px-8 pt-6 pb-2 border-b border-[var(--border)] justify-between items-center gap-4">
                <div>
                    <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest block mb-1">PAGE 02</span>
                    <h1 className="text-4xl font-black tracking-tight text-[var(--text-primary)]">Analyze Leads</h1>
                </div>
                <div className="w-auto">
                    <StepIndicator current="leads" />
                </div>
            </div>

            <div className="flex-1 p-4 md:p-8 space-y-6 md:space-y-8">

                {/* Dynamic Top KPI Grid */}
                {dynamicKPIs.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
                        {dynamicKPIs.map((kpi, index) => {
                            const Icon = kpi.icon;
                            return (
                                <div key={`${kpi.label}-${index}`} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-4 md:p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                                    <div className="flex justify-between items-center mb-2">
                                        <h4 className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{kpi.label}</h4>
                                        <div className={`${kpi.bg} ${kpi.color} p-1.5 rounded-lg shrink-0`}>
                                            <Icon size={14} />
                                        </div>
                                    </div>
                                    <div className={`text-xl md:text-2xl font-black ${kpi.color} tracking-tight`}>
                                        {typeof kpi.value === 'number' ? kpi.value.toLocaleString() : kpi.value}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Responsive Content Grid - Trends and Insights */}
                <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6">

                    {/* TOP ON MOBILE: Performance Insights */}
                    <div className="order-1 lg:order-2 lg:col-span-1 space-y-6">
                        <div className="flex items-center justify-between px-1">
                            <h3 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Based on WON lead</h3>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            {metrics?.bestLead && metrics.bestLead.source && (
                                <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20 rounded-2xl p-5 shadow-sm flex items-center gap-5 translate-y-0 hover:-translate-y-1 transition-transform">
                                    <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-emerald-100">
                                        <Trophy size={24} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Best Lead Source</h4>
                                        <div className="text-lg font-black text-emerald-900 dark:text-emerald-100 truncate">{metrics.bestLead.source}</div>
                                        <div className="text-[10px] font-bold text-emerald-600/70 mt-0.5 uppercase tracking-tight">{metrics.bestLead.won?.toLocaleString() ?? metrics.bestLead.count?.toLocaleString()} LEADS GENERATED</div>
                                    </div>
                                </div>
                            )}

                            {metrics?.bestRevenueLead && metrics.bestRevenueLead.source && (
                                <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20 rounded-2xl p-5 shadow-sm flex items-center gap-5 translate-y-0 hover:-translate-y-1 transition-transform">
                                    <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-emerald-100">
                                        <Trophy size={24} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Best Revenue Source</h4>
                                        <div className="text-lg font-black text-emerald-900 dark:text-emerald-100 truncate">{metrics.bestRevenueLead.source}</div>
                                        <div className="text-[10px] font-bold text-emerald-600/70 mt-0.5 uppercase tracking-tight">₹{metrics.bestRevenueLead.revenue?.toLocaleString()} REVENUE GENERATED</div>
                                    </div>
                                </div>
                            )}

                            {metrics?.worstLead && metrics.worstLead.source && (
                                <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/20 rounded-2xl p-5 shadow-sm flex items-center gap-5 translate-y-0 hover:-translate-y-1 transition-transform">
                                    <div className="w-12 h-12 bg-rose-500 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-rose-100">
                                        <AlertCircle size={24} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-[10px] font-bold text-rose-600 uppercase tracking-widest">Worst Lead Source</h4>
                                        <div className="text-lg font-black text-rose-900 dark:text-rose-100 truncate">{metrics.worstLead.source}</div>
                                        <div className="text-[10px] font-bold text-rose-600/70 mt-0.5 uppercase tracking-tight">{metrics.worstLead.won?.toLocaleString() ?? metrics.worstLead.count?.toLocaleString()} LEADS GENERATED</div>
                                    </div>
                                </div>
                            )}

                            {metrics?.worstRevenueLead && metrics.worstRevenueLead.source && (
                                <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/20 rounded-2xl p-5 shadow-sm flex items-center gap-5 translate-y-0 hover:-translate-y-1 transition-transform">
                                    <div className="w-12 h-12 bg-rose-500 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-rose-100">
                                        <AlertCircle size={24} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-[10px] font-bold text-rose-600 uppercase tracking-widest">Worst Revenue Source</h4>
                                        <div className="text-lg font-black text-rose-900 dark:text-rose-100 truncate">{metrics.worstRevenueLead.source}</div>
                                        <div className="text-[10px] font-bold text-rose-600/70 mt-0.5 uppercase tracking-tight">₹{metrics.worstRevenueLead.revenue?.toLocaleString()} REVENUE GENERATED</div>
                                    </div>
                                </div>
                            )}

                            {metrics?.bestUserLead && metrics.bestUserLead.userName && (
                                <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 rounded-2xl p-5 shadow-sm flex items-center gap-5 translate-y-0 hover:-translate-y-1 transition-transform">
                                    <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-100">
                                        <UserCheck size={24} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Best User (Leads)</h4>
                                        <div className="text-lg font-black text-blue-900 dark:text-blue-100 truncate">{metrics.bestUserLead.userName}</div>
                                        <div className="text-[10px] font-bold text-blue-600/70 mt-0.5 uppercase tracking-tight">{metrics.bestUserLead.leads.toLocaleString()} TOTAL LEADS</div>
                                    </div>
                                </div>
                            )}

                            {metrics?.bestUserRevenue && metrics.bestUserRevenue.userName && (
                                <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20 rounded-2xl p-5 shadow-sm flex items-center gap-5 translate-y-0 hover:-translate-y-1 transition-transform">
                                    <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-emerald-100">
                                        <Trophy size={24} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Best User (Revenue)</h4>
                                        <div className="text-lg font-black text-emerald-900 dark:text-emerald-100 truncate">{metrics.bestUserRevenue.userName}</div>
                                        <div className="text-[10px] font-bold text-emerald-600/70 mt-0.5 uppercase tracking-tight">₹{metrics.bestUserRevenue.revenue.toLocaleString()} REVENUE GENERATED</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* SECOND ON MOBILE: Lead Acquisition Trends */}
                    <div className="order-2 lg:order-1 lg:col-span-2">
                        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-6 md:p-8 shadow-sm relative overflow-hidden group/chart h-full flex flex-col min-h-[400px]">
                            <div className="flex justify-between items-start mb-6 md:mb-8">
                                <div>
                                    <h3 className="text-base md:text-lg font-bold text-[var(--text-primary)] uppercase tracking-tight">Lead Acquisition Trends</h3>
                                    <div className="mt-1 px-2 py-0.5 bg-[var(--bg-secondary)] text-[var(--text-muted)] rounded text-[9px] font-bold inline-block uppercase">MONTHLY PERFORMANCE</div>
                                </div>
                                <div className="hidden md:flex items-center gap-4">
                                    <div className="flex items-center gap-1.5 text-[9px] font-black text-emerald-600 uppercase tracking-tighter">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> WON
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[9px] font-black text-blue-600 uppercase tracking-tighter">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> QUALIFIED
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[9px] font-black text-amber-600 uppercase tracking-tighter">
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500" /> CONTACTED
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 w-full relative">
                                {trendData.length > 0 ? (
                                    <LeadTrendChart data={trendData} />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-[var(--text-muted)] italic text-xs gap-2">
                                        <Info size={20} className=" opacity-10" />
                                        No trend data available for this dataset
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Lead Source Distribution - ALWAYS FULL WIDTH */}
                {(metrics?.topSources && metrics.topSources.length > 0) && (
                    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl md:rounded-3xl p-6 shadow-sm mt-6">
                        <h4 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-4">
                            LEAD SOURCE DISTRIBUTION
                        </h4>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-separate border-spacing-y-2">
                                <thead>
                                    <tr>
                                        <th className="px-3 py-2 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Source</th>
                                        {hasWon && <th className="px-3 py-2 text-[10px] font-black text-emerald-600 uppercase tracking-widest text-center">{metrics?.sourceLabels?.won || 'Won'}</th>}
                                        {hasQualified && <th className="px-3 py-2 text-[10px] font-black text-blue-600 uppercase tracking-widest text-center">{metrics?.sourceLabels?.qualified || 'Qualified'}</th>}
                                        {hasContacted && <th className="px-3 py-2 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">Contacted</th>}
                                        <th className="px-3 py-2 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest text-center">Total Leads</th>
                                        {hasRevenue && <th className="px-3 py-2 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest text-right">Revenue</th>}
                                        {hasCost && <th className="px-3 py-2 text-[10px] font-black text-rose-600 uppercase tracking-widest text-right">Cost</th>}
                                        {hasProfit && <th className="px-3 py-2 text-[10px] font-black text-amber-600 uppercase tracking-widest text-right">Profit</th>}
                                        {hasTotalRevenue && <th className="px-3 py-2 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest text-right">Total Revenue</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {metrics.topSources.map((source, i) => (
                                        <tr key={source.source} className="group">
                                            <td className="px-3 py-3 bg-[var(--bg-secondary)] border-l border-y border-[var(--border)] rounded-l-xl text-[11px] font-bold text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors uppercase truncate">
                                                {source.source}
                                            </td>
                                            {hasWon && (
                                                <td className="px-3 py-3 bg-[var(--bg-secondary)] border-y border-[var(--border)] text-[12px] font-black text-emerald-600 text-center tabular-nums">
                                                    {source.won?.toLocaleString() ?? 0}
                                                </td>
                                            )}
                                            {hasQualified && (
                                                <td className="px-3 py-3 bg-[var(--bg-secondary)] border-y border-[var(--border)] text-[12px] font-black text-blue-600 text-center tabular-nums">
                                                    {source.qualified?.toLocaleString() ?? 0}
                                                </td>
                                            )}
                                            {hasContacted && (
                                                <td className="px-3 py-3 bg-[var(--bg-secondary)] border-y border-[var(--border)] text-[12px] font-black text-zinc-500 text-center tabular-nums">
                                                    {source.contacted?.toLocaleString() ?? 0}
                                                </td>
                                            )}
                                            <td className="px-3 py-3 bg-[var(--bg-secondary)] border-y border-[var(--border)] text-[12px] font-black text-[var(--text-primary)] text-center tabular-nums">
                                                {source.count.toLocaleString()}
                                            </td>
                                            {hasRevenue && (
                                                <td className="px-3 py-3 bg-[var(--bg-secondary)] border-y border-[var(--border)] text-[12px] font-black text-[var(--text-muted)] text-right tabular-nums">
                                                    ₹{source.revenue?.toLocaleString() ?? 0}
                                                </td>
                                            )}
                                            {hasCost && (
                                                <td className={`px-3 py-3 bg-[var(--bg-secondary)] border-y border-[var(--border)] text-[12px] font-black text-rose-600 text-right tabular-nums ${(!hasProfit && !hasTotalRevenue) ? 'border-r rounded-r-xl' : ''}`}>
                                                    ₹{source.cost?.toLocaleString() ?? 0}
                                                </td>
                                            )}
                                            {hasProfit && (
                                                <td className={`px-3 py-3 bg-[var(--bg-secondary)] border-y border-[var(--border)] text-[12px] font-black text-amber-600 dark:text-amber-400 text-right tabular-nums ${!hasTotalRevenue ? 'border-r rounded-r-xl' : ''}`}>
                                                    ₹{source.profit?.toLocaleString() ?? 0}
                                                </td>
                                            )}
                                            {hasTotalRevenue && (
                                                <td className="px-3 py-3 bg-[var(--bg-secondary)] border-r border-y border-[var(--border)] rounded-r-xl text-[12px] font-black text-[var(--text-muted)] text-right tabular-nums">
                                                    ₹{source.totalRevenue?.toLocaleString() ?? 0}
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}                   {/* Score Card */}
                {(metrics?.avgLeadScore ?? 0) > 0 && (
                    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl md:rounded-3xl p-6 shadow-sm flex flex-col items-center justify-center text-center">
                        <h4 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-3">QUALITY SCORE</h4>
                        <div className="text-4xl font-black text-[var(--text-primary)] mb-1">{metrics?.avgLeadScore}<span className="text-xs text-[var(--text-muted)] ml-1">/10</span></div>
                        <div className="mt-3 px-3 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-full text-[9px] font-bold uppercase tracking-tighter">
                            {(metrics?.avgLeadScore ?? 0) > 7.5 ? 'HIGH POTENTIAL' : 'MODERATE QUALITY'}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer Navigation */}
            <div className="md:px-8 md:py-6 md:border-t border-[var(--border)] flex justify-between items-center p-4 bg-[var(--bg-card)]">
                <button
                    onClick={() => router.push('/')}
                    className="hidden md:flex items-center gap-2 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors uppercase tracking-widest"
                >
                    <ArrowLeft size={16} /> PREVIOUS
                </button>
                <div className="hidden md:block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                    2 of 5 Diagnostic Steps
                </div>
                <button
                    onClick={() => router.push('/analysis/Sales')}
                    className="hidden md:flex bg-zinc-900 dark:bg-black hover:bg-black text-white px-8 py-3 rounded-xl text-xs font-black items-center gap-3 transition-opacity"
                >
                    NEXT: SALES <ArrowRight size={16} />
                </button>
            </div >
        </div >
    );
}