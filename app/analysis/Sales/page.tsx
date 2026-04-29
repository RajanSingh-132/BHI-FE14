'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useDataset } from '@/lib/store';
import { RevenueMetrics } from '@/lib/types';
import { fetchApi } from '@/lib/api';
import { ArrowLeft, ArrowRight, DollarSign, BarChart3, PieChart, Info, Target, Wallet, Trophy, AlertCircle, Percent } from 'lucide-react';
import StepIndicator from '@/components/ui/StepIndicator';
import RevenueTrendChart from '@/components/charts/RevenueTrendChart';

export default function RevenuePage() {
    const router = useRouter();
    const { dataset } = useDataset();
    const [metrics, setMetrics] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const hasFetched = useRef(false);

    useEffect(() => {
        if (!dataset || hasFetched.current) {
            if (!dataset) setLoading(false);
            return;
        }

        hasFetched.current = true;
        fetchApi<{ metrics: any }>('/api/analytics?type=Sales')
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
            <div className="text-slate-500 font-semibold tracking-wide animate-pulse uppercase text-xs">Processing revenue data...</div>
        </div>
    );
    const kpis = [
        { label: 'Total Revenue', rawValue: metrics?.totalRevenue, value: metrics?.totalRevenue ? `₹${metrics.totalRevenue.toLocaleString()}` : '0', icon: DollarSign, color: 'text-zinc-600', bg: 'bg-zinc-50' },
        { label: 'Won Revenue', rawValue: metrics?.wonRevenue, value: metrics?.wonRevenue ? `₹${metrics.wonRevenue.toLocaleString()}` : '0', icon: Trophy, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Qualified Revenue', rawValue: metrics?.qualifiedRevenue, value: metrics?.qualifiedRevenue ? `₹${metrics.qualifiedRevenue.toLocaleString()}` : '0', icon: Target, color: 'text-blue-600', bg: 'bg-blue-50' },
    ];

    return (
        <div className="min-h-full flex flex-col bg-[var(--bg)] text-[var(--text-primary)] overflow-y-auto pb-24 md:pb-10">
            {/* Header Section */}
            <div className="hidden md:flex px-8 pt-6 pb-2 border-b border-[var(--border)] justify-between items-center gap-4">
                <div>
                    <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest block mb-1">PAGE 03</span>
                    <h1 className="text-4xl font-black tracking-tight text-[var(--text-primary)]">Revenue Growth</h1>
                </div>
                <div className="w-auto">
                    <StepIndicator current="revenue" />
                </div>
            </div>

            <div className="flex-1 p-4 md:p-8 space-y-6 md:space-y-8">

                {/* KPI Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                    {kpis.map(kpi => {
                        const Icon = kpi.icon;
                        return (
                            <div key={kpi.label} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-4 md:p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{kpi.label}</h4>
                                    <div className={`${kpi.bg} ${kpi.color} p-1.5 rounded-lg shrink-0`}>
                                        <Icon size={14} />
                                    </div>
                                </div>
                                <div className={`text-lg md:text-xl font-black ${kpi.color} tracking-tight`}>
                                    {kpi.value}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Analysis Row */}
                <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-6 md:p-8 shadow-sm flex flex-col min-h-[400px]">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h3 className="text-sm font-black text-[var(--text-primary)] tracking-wide uppercase flex items-center gap-2">
                                    <div className="w-1.5 h-6 bg-amber-500 rounded-full" /> Monthly Revenue Trend
                                </h3>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1.5 text-[9px] font-black text-emerald-600 uppercase tracking-tighter">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> WON REVENUE
                                </div>
                                <div className="flex items-center gap-1.5 text-[9px] font-black text-amber-600 uppercase tracking-tighter">
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" /> TOTAL REVENUE
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 w-full">
                            {metrics?.monthlyRevenue && metrics.monthlyRevenue.length > 0 ? (
                                <RevenueTrendChart data={metrics.monthlyRevenue} />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-[var(--text-muted)] italic text-[11px] gap-2">
                                   <Info size={18} className=" opacity-10" />
                                   Time-series data unavailable for trend analysis
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-6 md:p-8 flex flex-col shadow-sm">
                        <h3 className="text-sm font-black mb-6 text-[var(--text-primary)] tracking-wide uppercase flex items-center gap-2 flex-shrink-0">
                            <div className="w-1.5 h-6 bg-blue-600 rounded-full" /> Allocation by Region
                        </h3>
                        <div className="flex-1 overflow-x-auto">
                            <table className="w-full text-left border-separate border-spacing-y-2">
                                <thead>
                                    <tr>
                                        <th className="px-3 py-2 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Region</th>
                                        <th className="px-3 py-2 text-[10px] font-black text-emerald-600 uppercase tracking-widest text-right">Won Revenue</th>
                                        <th className="px-3 py-2 text-[10px] font-black text-slate-900 uppercase tracking-widest text-right">Total Revenue</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {metrics?.byRegion && metrics.byRegion.length > 0 ? metrics.byRegion.slice(0, 10).map((r: any, i: number) => (
                                        <tr key={r.region} className="group">
                                            <td className="px-3 py-3 bg-[var(--bg-secondary)] border-l border-y border-[var(--border)] rounded-l-xl text-[11px] font-bold text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors uppercase truncate">
                                                {r.region}
                                            </td>
                                            <td className="px-3 py-3 bg-[var(--bg-secondary)] border-y border-[var(--border)] text-[12px] font-black text-emerald-600 text-right tabular-nums">
                                                ₹{r.wonRevenue?.toLocaleString() || 0}
                                            </td>
                                            <td className="px-3 py-3 bg-[var(--bg-secondary)] border-r border-y border-[var(--border)] rounded-r-xl text-[12px] font-black text-slate-900 text-right tabular-nums">
                                                ₹{r.revenue.toLocaleString()}
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={3} className="text-xs text-[var(--text-muted)] italic py-8 text-center bg-[var(--bg-secondary)] rounded-xl">
                                                No regional data available
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Regional Insight Cards - BOTTOM */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    {/* Won Revenue Insights */}
                    {metrics?.bestWonRegion && (
                        <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20 rounded-2xl p-5 shadow-sm flex items-center gap-5 transition-transform hover:-translate-y-1">
                            <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-emerald-100">
                                <Trophy size={24} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Best Won Region</h4>
                                <div className="text-lg font-black text-emerald-900 dark:text-emerald-100 truncate">Region: {metrics.bestWonRegion.region}</div>
                                <div className="text-[10px] font-bold text-emerald-600/70 mt-0.5 uppercase tracking-tight">₹{metrics.bestWonRegion.wonRevenue.toLocaleString()} GENERATED</div>
                            </div>
                        </div>
                    )}

                    {metrics?.worstWonRegion && (
                        <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/20 rounded-2xl p-5 shadow-sm flex items-center gap-5 transition-transform hover:-translate-y-1">
                            <div className="w-12 h-12 bg-rose-500 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-rose-100">
                                <AlertCircle size={24} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-[10px] font-bold text-rose-600 uppercase tracking-widest">Worst Won Region</h4>
                                <div className="text-lg font-black text-rose-900 dark:text-rose-100 truncate">Region: {metrics.worstWonRegion.region}</div>
                                <div className="text-[10px] font-bold text-rose-600/70 mt-0.5 uppercase tracking-tight">₹{metrics.worstWonRegion.wonRevenue.toLocaleString()} GENERATED</div>
                            </div>
                        </div>
                    )}

                    {/* Total Revenue Insights */}
                    {metrics?.bestRevenue && (
                        <div className="bg-emerald-50/50 dark:bg-emerald-900/5 border border-emerald-100/50 dark:border-emerald-900/10 rounded-2xl p-5 shadow-sm flex items-center gap-5 transition-transform hover:-translate-y-1">
                            <div className="w-12 h-12 bg-emerald-400 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-emerald-50">
                                <Trophy size={24} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-[10px] font-bold text-emerald-600/80 uppercase tracking-widest">Highest Revenue Region</h4>
                                <div className="text-lg font-black text-emerald-900 dark:text-emerald-100 truncate">Region: {metrics.bestRevenue.region || metrics.bestRevenue.name}</div>
                                <div className="text-[10px] font-bold text-emerald-600/60 mt-0.5 uppercase tracking-tight">₹{(metrics.bestRevenue.revenue || metrics.bestRevenue.value)?.toLocaleString()} GENERATED</div>
                            </div>
                        </div>
                    )}

                    {metrics?.worstRevenue && (
                        <div className="bg-rose-50/50 dark:bg-rose-900/5 border border-rose-100/50 dark:border-rose-900/10 rounded-2xl p-5 shadow-sm flex items-center gap-5 transition-transform hover:-translate-y-1">
                            <div className="w-12 h-12 bg-rose-400 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-rose-50">
                                <AlertCircle size={24} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-[10px] font-bold text-rose-600/80 uppercase tracking-widest">Lowest Revenue Region</h4>
                                <div className="text-lg font-black text-rose-900 dark:text-rose-100 truncate">Region: {metrics.worstRevenue.region || metrics.worstRevenue.name}</div>
                                <div className="text-[10px] font-bold text-rose-600/60 mt-0.5 uppercase tracking-tight">₹{(metrics.worstRevenue.revenue || metrics.worstRevenue.value)?.toLocaleString()} GENERATED</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer Navigation */}
            <div className="md:px-8 md:py-6 md:border-t border-[var(--border)] flex justify-between items-center p-4 bg-[var(--bg-card)]">
                <button
                    onClick={() => router.push('/analysis/leads')}
                    className="hidden md:flex items-center gap-2 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors uppercase tracking-widest"
                >
                    <ArrowLeft size={16} /> PREVIOUS
                </button>
                <div className="hidden md:block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                    3 of 5 Diagnostic Steps
                </div>
                <button
                    onClick={() => router.push('/analysis/ads')}
                    className="hidden md:flex bg-zinc-900 dark:bg-black hover:bg-black text-white px-8 py-3 rounded-xl text-xs font-black items-center gap-3 transition-opacity"
                >
                    NEXT: ADS <ArrowRight size={16} />
                </button>
            </div>
        </div>
    );
}
