export interface Dataset {
    name: string; size: number; type: string; uploadedAt: Date; data: DatasetRow[];
}
export interface DatasetRow { [key: string]: string | number | null; }

export interface LeadMetrics {
    totalLeads: number; qualifiedLeads: number; conversionRate: number; avgLeadScore: number;
    topSources: { source: string; count: number; percentage: number }[];
    byStatus: { status: string; count: number }[];
    monthlyTrend: { month: string; leads: number }[];
}
export interface RevenueMetrics {
    totalRevenue: number; avgDealSize: number; closedDeals: number; pipelineValue: number; growthRate: number;
    byRegion: { region: string; revenue: number }[];
    monthlyRevenue: { month: string; revenue: number }[];
}
export interface AdsMetrics {
    totalSpend: number; totalImpressions: number; totalClicks: number;
    avgCTR: number; avgCPC: number; roas: number;
    byCampaign: { campaign: string; spend: number; clicks: number; conversions: number }[];
    byChannel: { channel: string; spend: number; roas: number }[];
}
export type AnalysisStep = 'upload' | 'leads' | 'revenue' | 'ads' | 'summary';