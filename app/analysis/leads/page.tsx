'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useDataset } from '@/lib/store';
import { LeadMetrics } from '@/lib/types';
import { fetchApi } from '@/lib/api';
import { ArrowLeft, ArrowRight, TrendingUp, Users, Target, BarChart3, Star, Zap, Sparkles, Trophy, AlertCircle, Quote, Receipt, UserCheck, Info } from 'lucide-react';
import StepIndicator from '@/components/ui/StepIndicator';

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
    const maxVal = Math.max(...trendData.map(d => d.leads), 10);
    
    // Generate Path for Desktop Line Chart
    const points = trendData.map((d, i) => ({
        x: (i / Math.max(trendData.length - 1, 1)) * 1000,
        y: 250 - (d.leads / maxVal) * 200,
        val: d.leads,
        label: d.month
    }));
    
    const linePath = points.length > 0 
        ? `M${points[0].x},${points[0].y} ` + points.slice(1).map(p => `L${p.x},${p.y}`).join(' ')
        : '';
    
    const areaPath = points.length > 0
        ? `${linePath} L1000,250 L0,250 Z`
        : '';

    // Dynamic KPIs based on backend response
    const dynamicKPIs = [
        { label: 'Qualified', value: metrics?.qualifiedLeads, icon: UserCheck, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Converted', value: metrics?.convertedLeads, icon: Target, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Conv. Rate', value: metrics?.conversionRate ? `${metrics.conversionRate}%` : null, icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50' },
        { label: 'Cost/Lead', value: metrics?.costPerLead ? `₹${metrics.costPerLead.toFixed(2)}` : null, icon: Receipt, color: 'text-rose-600', bg: 'bg-rose-50' },
    ].filter(k => k.value !== null && k.value !== undefined && k.value !== 0 && k.value !== "0%" && k.value !== "₹0");

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
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                        {dynamicKPIs.map(kpi => {
                            const Icon = kpi.icon;
                            return (
                                <div key={kpi.label} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-4 md:p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
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

                {/* Responsive Content Grid */}
                <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6">
                    
                    {/* TOP ON MOBILE: Lead Velocity & Key Metrics */}
                    <div className="order-1 lg:order-2 lg:col-span-1 space-y-6">
                        {(metrics?.totalLeads ?? 0) > 0 && (
                            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-sm flex flex-col justify-between min-h-[180px] md:min-h-[350px]">
                                <div>
                                    <div className="flex justify-between items-center mb-4 md:mb-6">
                                        <h4 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">LEAD VELOCITY</h4>
                                        <div className="px-2 py-1 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-[10px] font-black text-amber-600 flex items-center gap-1">
                                            <TrendingUp size={10} /> 
                                        </div>
                                    </div>
                                    <div className="text-5xl md:text-6xl font-black text-[var(--text-primary)] tracking-tighter mb-2 flex items-baseline gap-3">
                                        {metrics?.totalLeads?.toLocaleString()}
                                        {(!metrics?.monthlyTrend || metrics.monthlyTrend.length === 0) && (
                                            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest border border-slate-100 px-2 py-0.5 rounded">Trend: N/A</span>
                                        )}
                                    </div>
                                    <p className="text-xs md:text-sm text-[var(--text-secondary)] font-medium leading-relaxed">
                                        Total actionable leads processed this cycle.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Best / Worst Leads Integration (DYNAMIC KPIs) */}
                        <div className="grid grid-cols-1 gap-4">
                            {metrics?.bestLead && metrics.bestLead.source && (
                                <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20 rounded-2xl p-5 shadow-sm flex items-center gap-5 translate-y-0 hover:-translate-y-1 transition-transform">
                                    <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-emerald-100">
                                        <Trophy size={24} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Top Lead Source</h4>
                                        <div className="text-lg font-black text-emerald-900 dark:text-emerald-100 truncate">{metrics.bestLead.source}</div>
                                        <div className="text-[10px] font-bold text-emerald-600/70 mt-0.5 uppercase tracking-tight">{metrics.bestLead.count?.toLocaleString()} LEADS GENERATED</div>
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
                                        <div className="text-[10px] font-bold text-rose-600/70 mt-0.5 uppercase tracking-tight">{metrics.worstLead.count?.toLocaleString()} LEADS GENERATED</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* SECOND ON MOBILE: Lead Acquisition Trends */}
                    <div className="order-2 lg:order-1 lg:col-span-2 space-y-6">
                        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-6 md:p-8 shadow-sm relative overflow-hidden group/chart">
                            <div className="flex justify-between items-start mb-6 md:mb-8">
                                <div>
                                    <h3 className="text-base md:text-lg font-bold text-[var(--text-primary)] uppercase tracking-tight">Lead Acquisition Trends</h3>
                                    <div className="md:hidden mt-1 px-2 py-0.5 bg-[var(--bg-secondary)] text-[var(--text-muted)] rounded text-[9px] font-bold inline-block uppercase">{trendData.length > 0 ? 'DYNAMIC DATA' : '30D GROWTH'}</div>
                                </div>
                                <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-full text-[10px] font-bold">
                                    <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                                    VERIFIED LEADS
                                </div>
                            </div>
                            
                            {/* Removed tooltips */}

                            {/* Responsive Chart: Line on Desktop, Bars on Mobile */}
                            <div className="h-[220px] md:h-[250px] w-full relative">
                                {/* Mobile Dynamic Bars with Static Values */}
                                <div className="flex md:hidden items-end justify-between h-full w-full gap-2 px-1 pb-10">
                                    {trendData.length > 0 ? trendData.map((d, i) => (
                                        <div 
                                            key={i} 
                                            className="flex-1 h-full flex flex-col items-center justify-end group/bar"
                                        >
                                            <span className="text-[8px] font-bold text-amber-600 mb-1">{d.leads.toLocaleString()}</span>
                                            <div 
                                                className="w-full rounded-t-md bg-amber-400 dark:bg-amber-600 shadow-sm"
                                                style={{ height: `${Math.max((d.leads / maxVal) * 100, 5)}%` }}
                                            />
                                        </div>
                                    )) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-[var(--text-muted)] italic text-xs gap-2">
                                            <Info size={20} className=" opacity-10" />
                                            No trend data available for this dataset
                                        </div>
                                    )}
                                </div>
                                
                                {/* Desktop Dynamic Line with Points & Labels */}
                                {trendData.length > 0 && (
                                    <div className="hidden md:block w-full h-full relative">
                                        <svg className="w-full h-full overflow-visible" viewBox="0 0 1000 250" preserveAspectRatio="none">
                                            <defs>
                                                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.2" />
                                                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                                                </linearGradient>
                                            </defs>
                                            <path d={areaPath} fill="url(#chartGradient)" />
                                            <path d={linePath} fill="none" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" />
                                            
                                            {/* Interaction Points */}
                                            {points.map((p, i) => (
                                                <g key={i}>
                                                    {/* Value Label */}
                                                    <text x={p.x} y={p.y - 15} textAnchor="middle" fill="#f59e0b" fontSize="12" fontWeight="bold">
                                                        {p.val.toLocaleString()}
                                                    </text>
                                                    {/* Visible Point */}
                                                    <circle 
                                                        cx={p.x} 
                                                        cy={p.y} 
                                                        r="5" 
                                                        fill="white" 
                                                        stroke="#f59e0b" 
                                                        strokeWidth="2.5"
                                                    />
                                                </g>
                                            ))}
                                        </svg>
                                    </div>
                                )}

                                <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[8px] md:text-[10px] font-black text-[var(--text-muted)] pt-4 border-t border-[var(--border)] uppercase tracking-tighter overflow-hidden">
                                    {trendData.length > 0 ? (
                                        trendData.map((d, i) => {
                                            const shouldShow = trendData.length <= 12 || 
                                                            i === 0 || 
                                                            i === trendData.length - 1 || 
                                                            i % Math.ceil(trendData.length / 6) === 0;
                                            
                                            return shouldShow ? (
                                                <span key={i} className={`flex-1 text-center truncate px-1 ${hoveredIdx === i ? 'text-amber-600 scale-110' : ''}`}>{d.month}</span>
                                            ) : null;
                                        })
                                    ) : (
                                        <div className="w-full text-center text-[var(--text-muted)] py-2">Historical data markers unavailable</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Row with distribution and scores */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                            {/* Lead Status Distribution Card */}
                            {(metrics?.byStatus && metrics.byStatus.length > 0) && (
                                <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl md:rounded-3xl p-6 shadow-sm">
                                    <h4 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-4">
                                        LEAD STATUS DISTRIBUTION
                                    </h4>
                                    <div className="space-y-5">
                                        {metrics.byStatus.map((s, i) => {
                                            const maxCount = Math.max(...metrics.byStatus.map(x => x.count), 1);
                                            const percentage = (s.count / maxCount) * 100;
                                            return (
                                                <div key={s.status}>
                                                    <div className="flex justify-between items-center mb-1.5 text-[9px] font-bold text-[var(--text-secondary)] uppercase">
                                                        <span>{s.status}</span>
                                                        <span className="text-[var(--text-primary)]">{s.count.toLocaleString()}</span>
                                                    </div>
                                                    <div className="h-2 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                                                        <div 
                                                            className="h-full rounded-full transition-all duration-1000" 
                                                            style={{ background: COLORS[i % COLORS.length], width: `${percentage}%` }} 
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Lead Source Distribution Card */}
                            {(metrics?.topSources && metrics.topSources.length > 0) && (
                                <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl md:rounded-3xl p-6 shadow-sm">
                                    <h4 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-4">
                                        LEAD SOURCE DISTRIBUTION
                                    </h4>
                                    <div className="space-y-5">
                                        {metrics.topSources.map((source, i) => {
                                            const maxCount = Math.max(...metrics.topSources.map(x => x.count), 1);
                                            const percentage = (source.count / maxCount) * 100;
                                            return (
                                                <div key={source.source}>
                                                    <div className="flex justify-between items-center mb-1.5 text-[9px] font-bold text-[var(--text-secondary)] uppercase">
                                                        <span>{source.source}</span>
                                                        <span className="text-[var(--text-primary)]">{source.count.toLocaleString()}</span>
                                                    </div>
                                                    <div className="h-2 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                                                        <div 
                                                            className="h-full rounded-full transition-all duration-1000" 
                                                            style={{ background: COLORS[(i + 2) % COLORS.length], width: `${percentage}%` }} 
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Fallback when neither is available */}
                            {!(metrics?.byStatus && metrics.byStatus.length > 0) && !(metrics?.topSources && metrics.topSources.length > 0) && (
                                <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl md:rounded-3xl p-6 shadow-sm">
                                    <h4 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-4">
                                        DISTRIBUTION
                                    </h4>
                                    <div className="text-xs text-[var(--text-muted)] italic py-4">No distribution data available</div>
                                </div>
                            )}

                            {/* Score Card */}
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
                    </div>
                </div>
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
                    onClick={() => router.push('/analysis/revenue')} 
                    className="hidden md:flex bg-zinc-900 dark:bg-black hover:bg-black text-white px-8 py-3 rounded-xl text-xs font-black items-center gap-3 transition-opacity"
                >
                    NEXT: REVENUE <ArrowRight size={16} />
                </button>
            </div>
        </div>
    );
}