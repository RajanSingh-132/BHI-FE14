'use client';
import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import { MonthlyLead } from '@/lib/types';

export default function LeadTrendChart({ data }: { data: MonthlyLead[] }) {
    const [isMounted, setIsMounted] = useState(false);
    const [chartHeight, setChartHeight] = useState(300);

    useEffect(() => {
        setIsMounted(true);
        setChartHeight(window.innerWidth > 768 ? 600 : 300);
        
        const handleResize = () => {
            setChartHeight(window.innerWidth > 768 ? 600 : 300);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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
        <div className="w-full relative overflow-x-auto pb-4 scrollbar-hide">
            <div style={{ minWidth: window.innerWidth < 768 ? '800px' : '100%' }}>
                <ResponsiveContainer width={window.innerWidth < 768 ? 800 : '100%'} height={chartHeight} minWidth={0}>
                    <BarChart
                        data={data}
                        margin={{ top: 30, right: 10, left: -20, bottom: 0 }}
                        barGap={2}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b820" />
                        <XAxis
                            dataKey="month"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#94a3b810' }} />
                        <Bar
                            dataKey="won"
                            name="Won"
                            fill="#10b981"
                            radius={[2, 2, 0, 0]}
                            barSize={10}
                        >
                            <LabelList dataKey="won" position="top" style={{ fontSize: 8, fontWeight: 900, fill: '#10b981' }} />
                        </Bar>
                        <Bar
                            dataKey="qualified"
                            name="Qualified"
                            fill="#3b82f6"
                            radius={[2, 2, 0, 0]}
                            barSize={10}
                        >
                            <LabelList dataKey="qualified" position="top" style={{ fontSize: 8, fontWeight: 900, fill: '#3b82f6' }} />
                        </Bar>
                        <Bar
                            dataKey="contacted"
                            name="Contacted"
                            fill="#f59e0b"
                            radius={[2, 2, 0, 0]}
                            barSize={10}
                        >
                            <LabelList dataKey="contacted" position="top" style={{ fontSize: 8, fontWeight: 900, fill: '#f59e0b' }} />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
