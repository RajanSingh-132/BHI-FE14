export interface Dataset {
    name: string; size: number; type: string; uploadedAt: Date; data: DatasetRow[];
}
export interface DatasetRow { [key: string]: string | number | null; }

export interface LeadSource { 
    source: string; 
    count: number; 
    percentage: number; 
    revenue?: number; 
    cost?: number;
    profit?: number;
    totalRevenue?: number;
    won?: number; 
    qualified?: number; 
    contacted?: number; 
}
export interface LeadStatus { status: string; count: number; revenue?: number; }
export interface MonthlyLead { month: string; leads: number; }

export interface LeadMetrics {
    totalLeads: number;
    qualifiedLeads: number;
    convertedLeads: number;
    contactedLeads?: number;
    totalRevenue?: number;
    wonRevenue?: number;
    qualifiedRevenue?: number;
    contactedRevenue?: number;
    conversionRate: number;
    avgLeadScore: number;
    costPerLead: number;
    topSources: LeadSource[];
    sourceLabels?: { won: string; qualified: string };
    byStatus?: LeadStatus[];
    bySource: LeadSource[];
    monthlyTrend: MonthlyLead[];
    bestLead: LeadSource | null;
    worstLead: LeadSource | null;
    bestRevenueLead: LeadSource | null;
    worstRevenueLead: LeadSource | null;
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

export type AnalysisStep = 'upload' | 'leads' | 'Sales' | 'ads' | 'summary';