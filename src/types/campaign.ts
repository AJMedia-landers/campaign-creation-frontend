export interface CampaignRequestInput {
  campaign_type: string;
  campaign_date?: string;
  client_name?: string;
  creatives_folder: string;
  ad_platform: string[];
  ad_account_id?: string;
  brand_name?: string;
  hours_start?: number;
  hours_end?: number;
  timezone: string;
  country: string;
  device: string[];
  daily_budget?: number;
  cta_button?: string;
  creative_description?: string;
  headline1?: string; headline2?: string; headline3?: string; headline4?: string; headline5?: string;
  headline6?: string; headline7?: string; headline8?: string; headline9?: string; headline10?: string;
}

/** UI-only */
export type UIExtras = {
  campaign_nickname?: string;
  status?: "Ready" | "Paused" | "Draft";
};

export type CampaignCreateResponse = {
  success: boolean;
  message: string;
  data?: { id: string; input: CampaignRequestInput };
};
