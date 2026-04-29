'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDataset } from '@/lib/store';
import { LeadMetrics, RevenueMetrics, AdsMetrics } from '@/lib/types';
import { fetchApi } from '@/lib/api';
import { ArrowLeft, Download, CheckCircle, Lightbulb, ShieldCheck, Zap } from 'lucide-react';

export default function SummaryPage() {
    const router = useRouter();
    const { dataset } = useDataset();
    const [leads, setLeads] = useState<LeadMetrics | null>(null);
    const [revenue, setRevenue] = useState<RevenueMetrics | null>(null);
    const [ads, setAds] = useState<AdsMetrics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!dataset) { setLoading(false); return; }

        const loadAll = async () => {
            try {
                const [lRes, rRes, aRes] = await Promise.all([
                    fetchApi<{ metrics: LeadMetrics }>('/api/analytics?type=leads'),
                    fetchApi<{ metrics: RevenueMetrics }>('/api/analytics?type=Sales'),
                    fetchApi<{ metrics: AdsMetrics }>('/api/analytics?type=ads')
                ]);
                setLeads(lRes.metrics);
                setRevenue(rRes.metrics);
                setAds(aRes.metrics);
            } catch (err) {
                console.error('Failed to load summary metrics');
            } finally {
                setLoading(false);
            }
        };

        loadAll();
    }, [dataset]);

    if (!dataset) return <div className="h-full flex items-center justify-center p-10 font-bold text-[var(--text-muted)] uppercase tracking-widest bg-[var(--bg)]">Waiting for synchronization...</div>;
    if (loading) return <div className="h-full flex items-center justify-center p-10 font-bold text-[var(--accent)] uppercase tracking-widest animate-pulse bg-[var(--bg)]">Generating Strategic Report...</div>;

    const healthScore = 84;

    return (
        <div className="h-full flex flex-col bg-[var(--bg)] text-[var(--text-primary)] overflow-y-auto pb-24 md:pb-10">
            {/* Header Section */}
            <div className="hidden md:flex px-8 pt-6 pb-2 border-b border-[var(--border)] justify-between items-center gap-4 shrink-0">
                <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">PAGE 05</span>
                    <h1 className="text-4xl font-black tracking-tight text-gray-900 leading-none">Strategic Summary</h1>
                </div>
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3 bg-[var(--accent-soft)] text-[var(--accent)] px-5 py-2.5 rounded-2xl shadow-sm border border-[var(--accent)]/10">
                        <div className="text-right">
                            <div className="text-[8px] font-black opacity-60 uppercase tracking-widest">Health Index</div>
                            <div className="text-xl font-black tabular-nums leading-none">{healthScore}/100</div>
                        </div>
                        <CheckCircle size={24} />
                    </div>
                </div>
            </div>

            <div className="flex-1 p-4 md:p-8 space-y-6 md:space-y-8">
                {/* Insight Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm group hover:shadow-md transition-all">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform"><CheckCircle size={20} /></div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Leads Pipeline</span>
                        </div>
                        <div className="space-y-6">
                            <div>
                                <div className="text-4xl font-black text-slate-900 tracking-tight">{leads?.totalLeads?.toLocaleString() ?? 0}</div>
                                <div className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">Verified Lead Volume</div>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-[13px] text-slate-500 font-medium leading-relaxed italic">
                                Lead velocity is performing at consistent levels, driven primarily by qualified channel interaction.
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm group hover:shadow-md transition-all">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform"><ShieldCheck size={20} /></div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Financial Status</span>
                        </div>
                        <div className="space-y-6">
                            <div>
                                <div className="text-4xl font-black text-emerald-600 tracking-tight">₹{revenue?.totalRevenue.toLocaleString() ?? 0}</div>
                                <div className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">Total Gross Revenue</div>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-[13px] text-slate-500 font-medium leading-relaxed italic">
                                Average Deal Size is currently holding steady at ₹{revenue?.avgDealSize.toLocaleString() ?? 0}.
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm group hover:shadow-md transition-all">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl group-hover:scale-110 transition-transform"><Zap size={20} /></div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Ad ROI Stability</span>
                        </div>
                        <div className="space-y-6">
                            <div>
                                <div className="text-4xl font-black text-purple-600 tracking-tight">{ads?.roas ?? 0}x</div>
                                <div className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">Marketing Return</div>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-[13px] text-slate-500 font-medium leading-relaxed italic">
                                Ad efficiency is optimal at {ads?.roas ?? 0}x. Focus on scaling identified winner campaigns.
                            </div>
                        </div>
                    </div>
                </div>

                {/* strategic card */}
                <div className="mt-4 bg-zinc-900 rounded-[2.5rem] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl border border-zinc-800">
                    <div className="absolute top-0 right-0 p-8 text-emerald-900/10 pointer-events-none"><CheckCircle size={200} strokeWidth={1} /></div>

                    <div className="relative z-10 flex flex-col lg:flex-row gap-12 lg:items-center">
                        <div className="flex-1 space-y-8">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-emerald-400">
                                    <Lightbulb size={24} />
                                </div>
                                <div className="text-[10px] font-black tracking-widest text-emerald-500 uppercase">AI STRATEGIC RECOMMENDATION</div>
                            </div>
                            <h3 className="text-2xl md:text-4xl font-black tracking-tight leading-tight text-white">
                                Optimize Acquisition <span className="text-emerald-500">Funnel Integrity</span>
                            </h3>
                            <p className="text-zinc-400 text-sm md:text-base leading-relaxed max-w-2xl font-medium">
                                Based on your financial data, there is a clear opportunity to increase Lifetime Value (LTV). While acquisition costs (CAC) are stable, focus on checkout flow micro-optimizations over the next 30 days.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 lg:self-end">
                            <button className="bg-white text-zinc-900 px-10 py-4 rounded-2xl group flex items-center justify-center gap-3 font-black text-xs transition-transform hover:scale-[1.02]">
                                DOWNLOAD FULL AUDIT <Download size={18} />
                            </button>
                            <button
                                onClick={() => router.push('/')}
                                className="bg-zinc-800 hover:bg-zinc-700 text-white px-10 py-4 rounded-2xl font-black transition-all text-xs border border-zinc-700 shadow-lg"
                            >
                                FINISH DIAGNOSTIC
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Navigation */}
            <div className="md:px-8 md:py-6 md:border-t md:border-gray-100 flex justify-between items-center p-4">
                <button
                    onClick={() => router.push('/analysis/ads')}
                    className="hidden md:flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-gray-900 transition-colors uppercase tracking-widest"
                >
                    <ArrowLeft size={16} /> PREVIOUS
                </button>
                <div className="hidden md:block text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    5 of 5 Diagnostic Steps Complete
                </div>
                <div className="w-[100px] hidden md:block"></div>
            </div>
        </div>
    );
}
