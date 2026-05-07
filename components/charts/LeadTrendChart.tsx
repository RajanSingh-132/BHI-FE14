'use client';
import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import { MonthlyLead } from '@/lib/types';

export default function LeadTrendChart({ data }: { data: MonthlyLead[] }) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const dynamicWidth = Math.max(window?.innerWidth || 0, data.length * 80);

    // Custom Tooltip component for premium feel
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xl">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 dark:border-slate-800 pb-2">{label}</p>
                    <div className="space-y-2">
                        {payload.map((entry: any, index: number) => (
                            <div key={index} className="flex items-center justify-between gap-8">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight">{entry.name}</span>
                                </div>
                                <span className="text-xs font-black text-slate-900 dark:text-white">{entry.value.toLocaleString()}</span>
                            </div>
                        ))}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 mt-2 flex items-center justify-between gap-8">
                            <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">Total Leads</span>
                            <span className="text-xs font-black text-amber-600">
                                {payload.reduce((acc: number, entry: any) => acc + entry.value, 0).toLocaleString()}
                            </span>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    if (!isMounted) {
        return <div className="w-full h-[300px] md:h-[600px] bg-slate-50/50 dark:bg-slate-900/20 rounded-2xl animate-pulse" />;
    }

    return (
        <div className="w-full relative overflow-x-auto scrollbar-hide">
            <div style={{ minWidth: `${data.length * 70}px`, width: '100%' }}>
                <ResponsiveContainer width="100%" height={350}>
                    <BarChart
                        data={data}
                        margin={{ top: 30, right: 10, left: -20, bottom: 0 }}
                        barGap={6}
                        barCategoryGap="20%"
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b820" />
                        <XAxis
                            dataKey="month"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                            domain={[0, 'dataMax + 50']}
                            tickCount={6}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                        <Bar
                            dataKey="won"
                            name="Won"
                            fill="#10b981"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={40}
                        >
                            <LabelList dataKey="won" position="top" style={{ fontSize: 9, fontWeight: 800, fill: '#10b981' }} offset={8} />
                        </Bar>
                        <Bar
                            dataKey="qualified"
                            name="Qualified"
                            fill="#3b82f6"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={40}
                        >
                            <LabelList dataKey="qualified" position="top" style={{ fontSize: 9, fontWeight: 800, fill: '#3b82f6' }} offset={8} />
                        </Bar>
                        <Bar
                            dataKey="contacted"
                            name="Contacted"
                            fill="#f59e0b"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={40}
                        >
                            <LabelList dataKey="contacted" position="top" style={{ fontSize: 9, fontWeight: 800, fill: '#f59e0b' }} offset={8} />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
