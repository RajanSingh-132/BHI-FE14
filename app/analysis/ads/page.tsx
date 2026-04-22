'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDataset } from '@/lib/store';
import { AdsMetrics } from '@/lib/types';
import { fetchApi } from '@/lib/api';
import { ArrowLeft, ArrowRight, Target, BarChart2, Zap, AlertCircle, Trophy } from 'lucide-react';
import StepIndicator from '@/components/ui/StepIndicator';

export default function AdsPage() {
    const router = useRouter();
    const { dataset } = useDataset();
    const [metrics, setMetrics] = useState<AdsMetrics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!dataset) { setLoading(false); return; }
        fetchApi<{ metrics: AdsMetrics }>('/api/analytics?type=ads')
            .then(res => {
                setMetrics(res.metrics);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [dataset]);

    if (!dataset) return (
        <div className="h-full flex flex-col items-center justify-center p-6 text-center gap-6 bg-[var(--bg)]">
            <div className="text-6xl mb-4">📈</div>
            <h2 className="font-syne text-2xl font-extrabold text-[var(--text-primary)] tracking-tight">No Dataset Available</h2>
            <button onClick={() => router.push('/')} className="btn-primary px-8 py-3 rounded-xl flex items-center gap-2">
                <ArrowLeft size={18} /> Back to Dashboard
            </button>
        </div>
    );

    if (loading) return (
        <div className="h-full flex flex-col items-center justify-center p-6 gap-6 bg-[var(--bg)]">
            <div className="w-12 h-12 border-4 border-[var(--bg-secondary)] border-t-[var(--accent)] rounded-full animate-spin" />
            <div className="text-[var(--text-muted)] font-semibold tracking-wide animate-pulse uppercase text-xs">Analyzing ads performance...</div>
        </div>
    );

    const kpis = [
        { label: 'Total Ad Spend', rawValue: metrics?.totalSpend, value: `₹${metrics?.totalSpend?.toLocaleString()}`, icon: Wallet, color: 'text-rose-500', bg: 'bg-rose-50' },
        { label: 'ROAS', rawValue: metrics?.roas, value: `${metrics?.roas}x`, icon: Zap, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Total Conversions', rawValue: metrics?.totalConversions, value: metrics?.totalConversions?.toLocaleString(), icon: Target, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Cost per Conv.', rawValue: metrics?.costPerConversion, value: `₹${metrics?.costPerConversion?.toLocaleString()}`, icon: BarChart2, color: 'text-emerald-800', bg: 'bg-emerald-50' },
    ].filter(k => k.rawValue !== null && k.rawValue !== undefined && k.rawValue !== 0);

    const hasClicks = metrics?.byCampaign?.some(c => (c.clicks ?? 0) > 0);
    const hasConversions = metrics?.byCampaign?.some(c => (c.conversions ?? 0) > 0);

    return (
        <div className="h-full flex flex-col bg-[var(--bg)] text-[var(--text-primary)] overflow-y-auto pb-24 md:pb-10">
            {/* Header Section */}
            <div className="hidden md:flex px-8 pt-6 pb-2 border-b border-[var(--border)] justify-between items-center gap-4 shrink-0">
                <div>
                    <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest block mb-1">PAGE 04</span>
                    <h1 className="text-4xl font-black tracking-tight text-[var(--text-primary)] leading-none">
                        Ads Analysis
                    </h1>
                </div>
                <div className="flex items-center gap-6">
                    <div className="text-xs font-bold text-[var(--text-secondary)] hidden lg:flex items-center gap-2">
                        Campaign Status: <span className="bg-[var(--accent-soft)] text-[var(--accent)] px-3 py-1 rounded-full text-[10px] font-black uppercase">Optimized</span>
                    </div>
                    <div className="w-auto">
                        <StepIndicator current="ads" />
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="p-4 md:p-8 space-y-6 md:space-y-8">
                
                {/* KPI Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                    {kpis.map(kpi => (
                        <div key={kpi.label} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-5 shadow-sm">
                            <div className="flex items-center justify-between mb-3 text-[var(--text-muted)]">
                                <span className="text-[10px] font-bold tracking-wider uppercase">{kpi.label}</span>
                                <kpi.icon size={16} />
                            </div>
                            <div className={`text-xl md:text-2xl font-black ${kpi.color} tracking-tight`}>{kpi.value}</div>
                        </div>
                    ))}
                </div>

                {/* Best / Worst Campaign Insights */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    {metrics?.bestCampaign && ( (metrics.bestCampaign.conversions ?? 0) > 0 || (metrics.bestCampaign.clicks ?? 0) > 0 || (metrics.bestCampaign.spend ?? 0) > 0 ) && (
                        <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20 rounded-2xl p-5 shadow-sm flex items-center gap-5 transition-transform hover:-translate-y-1">
                            <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-emerald-100">
                                <Trophy size={24} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Top Performing Campaign</h4>
                                <div className="text-lg font-black text-emerald-900 dark:text-emerald-100 truncate">{metrics.bestCampaign.campaign}</div>
                                <div className="text-[10px] font-bold text-emerald-600/70 mt-0.5 uppercase tracking-tight">
                                    {(metrics.bestCampaign.conversions ?? 0) > 0 
                                        ? `${metrics.bestCampaign.conversions.toLocaleString()} CONVERSIONS`
                                        : (metrics.bestCampaign.clicks ?? 0) > 0 
                                            ? `${metrics.bestCampaign.clicks.toLocaleString()} CLICKS`
                                            : `₹${metrics.bestCampaign.spend.toLocaleString()} SPENT`
                                    }
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {metrics?.worstCampaign && ( (metrics.worstCampaign.conversions ?? 0) > 0 || (metrics.worstCampaign.clicks ?? 0) > 0 || (metrics.worstCampaign.spend ?? 0) > 0 ) && (
                        <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/20 rounded-2xl p-5 shadow-sm flex items-center gap-5 transition-transform hover:-translate-y-1">
                            <div className="w-12 h-12 bg-rose-500 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-rose-100">
                                <AlertCircle size={24} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-[10px] font-bold text-rose-600 uppercase tracking-widest">Underperforming Campaign</h4>
                                <div className="text-lg font-black text-rose-900 dark:text-rose-100 truncate">{metrics.worstCampaign.campaign}</div>
                                <div className="text-[10px] font-bold text-rose-600/70 mt-0.5 uppercase tracking-tight">
                                    {(metrics.worstCampaign.conversions ?? 0) > 0 
                                        ? `${metrics.worstCampaign.conversions.toLocaleString()} CONVERSIONS`
                                        : (metrics.worstCampaign.clicks ?? 0) > 0 
                                            ? `${metrics.worstCampaign.clicks.toLocaleString()} CLICKS`
                                            : `₹${metrics.worstCampaign.spend.toLocaleString()} SPENT`
                                    }
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Comparison Row: Tables Side-by-Side */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                    {/* Top Campaigns */}
                    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-6 md:p-8 flex flex-col shadow-sm">
                        <h3 className="text-sm font-black mb-6 text-[var(--text-primary)] tracking-wide uppercase flex items-center gap-2 shrink-0">
                            <div className="w-1.5 h-6 bg-amber-500 rounded-full" /> Top Campaigns
                        </h3>
                        <div className="flex-1 overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest border-b border-[var(--border)]">
                                        <th className="pb-4">Campaign</th>
                                        <th className="pb-4">Spend</th>
                                        {hasConversions && <th className="pb-4 text-right">Conv.</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {metrics?.byCampaign.slice(0, 5).map(c => (
                                        <tr key={c.campaign} className="group hover:bg-[var(--bg-secondary)] transition-colors">
                                            <td className="py-4 text-[11px] font-bold text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] truncate max-w-[120px]">{c.campaign}</td>
                                            <td className="py-4 text-[11px] font-medium text-[var(--text-muted)] tabular-nums">₹{c.spend.toLocaleString()}</td>
                                            {hasConversions && <td className="py-4 text-[11px] font-black text-right tabular-nums text-indigo-500 dark:text-indigo-400">{(c.conversions ?? 0).toLocaleString()}</td>}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Ad Spend by Channel (Dynamic) */}
                    {metrics?.byChannel && metrics.byChannel.length > 0 && (
                        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-6 md:p-8 flex flex-col shadow-sm">
                            <h3 className="text-sm font-black mb-6 text-[var(--text-primary)] tracking-wide uppercase flex items-center gap-2 shrink-0">
                                <div className="w-1.5 h-6 bg-indigo-500 rounded-full" /> Ad Spend by Channel
                            </h3>
                            <div className="flex-1 overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest border-b border-[var(--border)]">
                                            <th className="pb-4">Channel</th>
                                            <th className="pb-4">Spend</th>
                                            <th className="pb-4 text-right">ROAS</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {metrics.byChannel.map(ch => (
                                            <tr key={ch.channel} className="group hover:bg-[var(--bg-secondary)] transition-colors">
                                                <td className="py-4 text-[11px] font-bold text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]">{ch.channel}</td>
                                                <td className="py-4 text-[11px] font-medium text-[var(--text-muted)] tabular-nums">₹{ch.spend.toLocaleString()}</td>
                                                <td className="py-4 text-[11px] font-black text-right tabular-nums text-emerald-600 dark:text-emerald-400">{ch.roas}x</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Navigation */}
                <div className="md:px-0 md:py-6 md:border-t md:border-gray-100 flex justify-between items-center p-4">
                    <button 
                        onClick={() => router.push('/analysis/revenue')} 
                        className="hidden md:flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-gray-900 transition-colors uppercase tracking-widest"
                    >
                        <ArrowLeft size={16} /> PREVIOUS
                    </button>
                    <div className="hidden md:block text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        4 of 5 Diagnostic Steps
                    </div>
                    <button 
                        onClick={() => router.push('/analysis/summary')} 
                        className="hidden md:flex bg-zinc-900 hover:bg-black text-white px-8 py-3 rounded-xl text-xs font-black items-center gap-3 transition-opacity"
                    >
                        NEXT: SUMMARY <ArrowRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}

// Re-using icon for spend locally
function Wallet({ size }: { size: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
            <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
            <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
        </svg>
    );
}
