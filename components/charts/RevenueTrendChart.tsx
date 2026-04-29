'use client';
import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';

interface RevenueData {
    month: string;
    revenue: number;
    wonRevenue: number;
}

export default function RevenueTrendChart({ data }: { data: RevenueData[] }) {
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

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xl">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 dark:border-slate-800 pb-2">{label}</p>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between gap-8">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight">Won Revenue</span>
                            </div>
                            <span className="text-xs font-black text-emerald-600">₹{payload.find((p: any) => p.dataKey === 'wonRevenue')?.value.toLocaleString() || 0}</span>
                        </div>
                        <div className="flex items-center justify-between gap-8">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-amber-500" />
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight">Total Revenue</span>
                            </div>
                            <span className="text-xs font-black text-amber-600">₹{payload.find((p: any) => p.dataKey === 'revenue')?.value.toLocaleString() || 0}</span>
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
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f59e0b10' }} />
                        <Bar
                            dataKey="wonRevenue"
                            name="Won Revenue"
                            fill="#10b981"
                            radius={[4, 4, 0, 0]}
                            barSize={24}
                        >
                            <LabelList
                                dataKey="wonRevenue"
                                position="top"
                                formatter={(val: any) => `₹${Math.round(Number(val) || 0).toLocaleString()}`}
                                style={{ fontSize: 7, fontWeight: 900, fill: '#10b981' }}
                            />
                        </Bar>
                        <Bar
                            dataKey="revenue"
                            name="Total Revenue"
                            fill="#f59e0b"
                            radius={[4, 4, 0, 0]}
                            barSize={24}
                        >
                            <LabelList
                                dataKey="revenue"
                                position="top"
                                formatter={(val: any) => `₹${Math.round(Number(val) || 0).toLocaleString()}`}
                                style={{ fontSize: 7, fontWeight: 900, fill: '#f59e0b' }}
                            />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
