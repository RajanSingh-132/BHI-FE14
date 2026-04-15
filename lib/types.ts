export interface Dataset {
    name: string; size: number; type: string; uploadedAt: Date; data: DatasetRow[];
}
export interface DatasetRow { [key: string]: string | number | null; }

export interface LeadSource { source: string; count: number; percentage: number; }
export interface LeadStatus { status: string; count: number; }
export interface MonthlyLead { month: string; leads: number; }

export interface LeadMetrics {
    totalLeads: number;
    qualifiedLeads: number;
    convertedLeads: number;
    conversionRate: number;
    avgLeadScore: number;
    costPerLead: number;
    topSources: LeadSource[];
    byStatus: LeadStatus[];
    monthlyTrend: MonthlyLead[];
    bestLead: LeadSource | null;
    worstLead: LeadSource | null;
}

export interface RegionRevenue { region: string; revenue: number; }
export interface MonthlyRevenue { month: string; revenue: number; }

export interface RevenueMetrics {
    totalRevenue: number;
    avgDealSize: number;
    closedDeals: number;
    pipelineValue: number;
    growthRate: number;
    totalSpend: number;
    roi: number;
    byRegion: RegionRevenue[];
    monthlyRevenue: MonthlyRevenue[];
    bestRevenue: { name: string; value: number } | null;
    worstRevenue: { name: string; value: number } | null;
}

export interface CampaignData {
    campaign: string;
    spend: number;
    clicks: number;
    conversions: number;
}
export interface ChannelData { channel: string; spend: number; roas: number; }

export interface AdsMetrics {
    totalSpend: number;
    totalImpressions: number;
    totalClicks: number;
    totalConversions: number;
    avgCTR: number;
    avgCPC: number;
    roas: number;
    costPerConversion: number;
    byCampaign: CampaignData[];
    byChannel: ChannelData[];
    bestCampaign: CampaignData | null;
    worstCampaign: CampaignData | null;
}

export type AnalysisStep = 'upload' | 'leads' | 'revenue' | 'ads' | 'summary';