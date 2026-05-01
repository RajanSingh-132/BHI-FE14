'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useDataset } from '@/lib/store';
import { ProductivityMetrics } from '@/lib/types';
import { fetchApi } from '@/lib/api';
import { ArrowLeft, ArrowRight, BarChart2, BarChart3, Zap, AlertCircle, Trophy, Users, Layout } from 'lucide-react';
import StepIndicator from '@/components/ui/StepIndicator';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList } from 'recharts';

export default function ProductivityPage() {
    const router = useRouter();
    const { dataset } = useDataset();
    const [metrics, setMetrics] = useState<ProductivityMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [isMounted, setIsMounted] = useState(false);
    const fetchedRef = useRef<any>(null);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (!dataset || fetchedRef.current === dataset) {
            if (!dataset) setLoading(false);
            return;
        }

        fetchedRef.current = dataset;
        setLoading(true);
        fetchApi<{ metrics: ProductivityMetrics }>('/api/analytics?type=Productivity')
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
            <div className="text-[var(--text-muted)] font-semibold tracking-wide animate-pulse uppercase text-xs">Analyzing productivity...</div>
        </div>
    );

    const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'];
    const pieData = metrics?.statusDistribution?.filter(s => s.count > 0).map(s => ({ name: s.status, value: s.count })) || [];

    const getKpiIcon = (label: string) => {
        const lower = label.toLowerCase();
        if (lower.includes('total')) return Layout;
        if (lower.includes('critical') || lower.includes('blocker') || lower.includes('pending')) return AlertCircle;
        if (lower.includes('high') || lower.includes('progress') || lower.includes('completed')) return Zap;
        if (lower.includes('medium') || lower.includes('resolved')) return BarChart3;
        return Layout;
    };

    return (
        <div className="h-full flex flex-col bg-[var(--bg)] text-[var(--text-primary)] overflow-y-auto pb-24 md:pb-10">
            {/* Header Section */}
            <div className="hidden md:flex px-8 pt-6 pb-2 border-b border-[var(--border)] justify-between items-center gap-4 shrink-0">
                <div>
                    <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest block mb-1">PAGE 04</span>
                    <h1 className="text-4xl font-black tracking-tight text-[var(--text-primary)] leading-none">
                        Bug Report
                    </h1>
                </div>
                <div className="flex items-center gap-6">
                    <div className="w-auto">
                        <StepIndicator current="productivity" />
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="p-4 md:p-8 space-y-6 md:space-y-8">

                {/* KPI Grid */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
                    {metrics?.kpiCards?.map(kpi => {
                        const Icon = getKpiIcon(kpi.label);
                        return (
                            <div key={kpi.label} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-5 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300 cursor-default">
                                <div className="flex items-center justify-between mb-3 text-[var(--text-muted)]">
                                    <span className="text-[10px] font-bold tracking-wider uppercase">{kpi.label}</span>
                                    <Icon size={16} />
                                </div>
                                <div className={`text-xl md:text-2xl font-black ${kpi.color} tracking-tight`}>
                                    {kpi.value?.toLocaleString()}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Status Wise Distribution */}
                    <div className="lg:col-span-1 bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-6 shadow-sm flex flex-col">
                        <h3 className="text-sm font-black mb-6 uppercase tracking-wider flex items-center gap-2">
                            <BarChart2 size={18} className="text-[var(--accent)]" /> Status Wise Distribution
                        </h3>
                        <div className="h-[250px] w-full" style={{ minWidth: 0 }}>
                            {isMounted && (
                                <ResponsiveContainer width="100%" height={250}>
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                            label={({ value }) => `${value}`}
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                    {/* Severity Distribution */}
                    {metrics?.severityDistribution?.some(s => s.value > 0) && (
                        <div className="lg:col-span-1 bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-6 shadow-sm flex flex-col">
                            <h3 className="text-sm font-black mb-6 uppercase tracking-wider flex items-center gap-2">
                                <BarChart2 size={18} className="text-rose-500" /> Severity Distribution
                            </h3>
                            <div className="h-[250px] w-full" style={{ minWidth: 0 }}>
                                {isMounted && (
                                    <ResponsiveContainer width="100%" height={250}>
                                        <BarChart data={metrics?.severityDistribution?.filter(s => s.value > 0)} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                            <XAxis
                                                dataKey="name"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: 'var(--text-muted)', fontSize: 9, fontWeight: 600 }}
                                            />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: 'var(--text-muted)', fontSize: 9, fontWeight: 600 }}
                                            />
                                            <Tooltip
                                                cursor={{ fill: 'var(--bg-secondary)', opacity: 0.4 }}
                                                contentStyle={{
                                                    backgroundColor: 'var(--bg-card)',
                                                    border: '1px solid var(--border)',
                                                    borderRadius: '12px',
                                                    fontSize: '12px',
                                                    fontWeight: 'bold'
                                                }}
                                            />
                                            <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={30}>
                                                <LabelList dataKey="value" position="top" fill="var(--text-primary)" fontSize={10} fontWeight="black" offset={10} />
                                                {metrics?.severityDistribution?.filter(s => s.value > 0).map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={['#ef4444', '#f59e0b', '#3b82f6', '#94a3b8'][index % 4]} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Performer KPIs */}
                    <div className="lg:col-span-1 space-y-4">
                        {/* Best Performer */}
                        {metrics?.topPerformers?.[0] && (
                            <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20 rounded-2xl p-4 shadow-sm flex items-center gap-4 transition-transform hover:-translate-y-1 h-[117px]">
                                <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-emerald-100">
                                    <Trophy size={24} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-[9px] font-bold text-emerald-600 uppercase tracking-[0.1em] mb-0.5">Best Performer</h4>
                                    <div className="text-sm font-black text-emerald-900 dark:text-emerald-100 truncate">
                                        {metrics.topPerformers[0].name}
                                    </div>
                                    <div className="text-xl font-black text-emerald-600">
                                        {metrics.topPerformers[0].rate}%
                                    </div>
                                    <div className="text-[10px] font-extrabold text-emerald-600/80 uppercase tracking-tight flex flex-col gap-0.5">
                                        <span>{metrics.topPerformers[0].tasks} Total Bug</span>
                                        <span>{metrics.topPerformers[0].resolved} Resolved Bug</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Worst Performer */}
                        {metrics?.lowPerformers?.[0] && (
                            <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/20 rounded-2xl p-4 shadow-sm flex items-center gap-4 transition-transform hover:-translate-y-1 h-[117px]">
                                <div className="w-12 h-12 bg-rose-500 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-rose-100">
                                    <AlertCircle size={24} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-[9px] font-bold text-rose-600 uppercase tracking-[0.1em] mb-0.5">Worst Performer</h4>
                                    <div className="text-sm font-black text-rose-900 dark:text-rose-100 truncate">
                                        {metrics.lowPerformers[0].name}
                                    </div>
                                    <div className="text-xl font-black text-rose-600">
                                        {metrics.lowPerformers[0].rate}%
                                    </div>
                                    <div className="text-[10px] font-extrabold text-rose-600/80 uppercase tracking-tight flex flex-col gap-0.5">
                                        <span>{metrics.lowPerformers[0].tasks} Total Bug</span>
                                        <span>{metrics.lowPerformers[0].resolved} Resolved Bug</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            
            {/* Project Summary */}
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-6 md:p-8 shadow-sm">
                <h3 className="text-sm font-black mb-6 uppercase tracking-wider flex items-center gap-2">
                    <Users size={18} className="text-blue-500" /> Project Summary
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest border-b border-[var(--border)]">
                                <th className="pb-4">{metrics?.columnLabels?.project || "Project"}</th>
                                {metrics?.projectSummaryColumns?.map(col => (
                                    <th key={col} className={`pb-4 text-center ${col === 'Critical' ? 'text-rose-700' : ''}`}>
                                        {col}
                                    </th>
                                ))}
                                <th className="pb-4 text-center">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                            {metrics?.projectSummary.map((ps, idx) => (
                                <tr key={`${ps.project}-${idx}`} className="group hover:bg-[var(--bg-secondary)] transition-colors">
                                    <td className="py-4 text-sm font-bold">{ps.project}</td>
                                    {metrics?.projectSummaryColumns?.map(col => {
                                        let colorClass = "text-[var(--text-primary)]";
                                        if (col === 'High') colorClass = "text-emerald-600";
                                        if (col === 'Medium') colorClass = "text-amber-600";
                                        if (col === 'Low') colorClass = "text-rose-600";
                                        if (col === 'Critical') colorClass = "text-rose-900";
                                        const lowerCol = col.toLowerCase();
                                        if (lowerCol.includes('complete')) colorClass = "text-emerald-600";
                                        if (lowerCol.includes('progress')) colorClass = "text-blue-600";
                                        if (lowerCol.includes('pending')) colorClass = "text-amber-600";
                                        
                                        return (
                                            <td key={col} className={`py-4 text-sm font-black text-center ${colorClass}`}>
                                                {ps[col] || 0}
                                            </td>
                                        );
                                    })}
                                    <td className="py-4 text-sm font-black text-center text-slate-900">{ps.Total || 0}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Performers Distribution Table */}
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-6 md:p-8 shadow-sm">
                <h3 className="text-sm font-black mb-6 uppercase tracking-wider flex items-center gap-2">
                    <Trophy size={18} className="text-emerald-500" /> Performers Distribution
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest border-b border-[var(--border)]">
                                <th className="pb-4">{metrics?.columnLabels?.assignee || "Assign"}</th>
                                <th className="pb-4 text-center">Total bug</th>
                                <th className="pb-4 text-center">Resolved bugs</th>
                                <th className="pb-4 text-center">Rate</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                            {metrics?.performersDistribution?.map(p => (
                                <tr key={p.name} className="group hover:bg-[var(--bg-secondary)] transition-colors">
                                    <td className="py-4 text-sm font-bold">{p.name}</td>
                                    <td className="py-4 text-sm font-black text-center">{p.tasks}</td>
                                    <td className="py-4 text-sm font-black text-center text-emerald-600">{p.resolved || 0}</td>
                                    <td className="py-4 text-sm font-black text-center text-blue-600">{p.rate}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Footer Navigation */}
            <div className="md:px-0 md:py-6 md:border-t md:border-gray-100 flex justify-between items-center p-4">
                <button
                    onClick={() => router.push('/analysis/Sales')}
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
