export interface CampaignRequestInput {
  campaign_name_post_fix: string;
  campaign_date?: string;
  client_name?: string;
  creatives_folder: string;
  ad_platform: string[];
  folder_ids?: string[];
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
  review_flag?: boolean;
  language?: string;
  pacing?: string,
  bid_amount?: number,
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

export type Campaign = {
  id: number;
  request_id: number | null;
  campaign_name: string | null;
  campaign_id: string | null;
  tracking_link: string | null;
  campaign_status: string | null;
  campaign_name_post_fix: string | null;
  campaign_date: string | null;
  client_name: string | null;
  creatives_folder: string | null;
  creative_sub_folder: string | null;
  sub_folder_type?: string | null;
  ad_platform: string | null;
  ad_account_id: string | null;
  brand_name: string | null;
  hours_start: number | null;
  hours_end: number | null;
  timezone: string | null;
  country: string | null;
  device: string | null;
  daily_budget?: string | null;
  cta_button?: string | null;
  creative_description?: string | null;
  headline1: string | null;
  headline2?: string | null;
  headline3?: string | null;
  headline4?: string | null;
  headline5?: string | null;
  headline6?: string | null;
  headline7?: string | null;
  headline8?: string | null;
  headline9?: string | null;
  headline10?: string | null;
  error_message: string | null;
  fallback_folder: string | null;
  created_at: string | null;
  updated_at: string | null;
  [key: string]: unknown;
}


export type RequestItem = {
  id: number;
  requester_id: number | null;
  request_date: string | null;
  status: string | null;
  campaign_name_post_fix: string | null;
  campaign_date: string | null;
  client_name: string | null;
  creatives_folder: string | null;
  ad_platform: string[] | null;
  ad_account_id: string | null;
  brand_name: string | null;
  hours_start: number | null;
  hours_end: number | null;
  timezone: string | null;
  country: string | null;
  device: string[] | null;
  daily_budget: string | null;
  cta_button: string | null;
  creative_description: string | null;
  headline1: string | null;
  headline2: string | null;
  headline3: string | null;
  headline4: string | null;
  headline5: string | null;
  headline6: string | null;
  headline7: string | null;
  headline8: string | null;
  headline9: string | null;
  headline10: string | null;
  error_message: string | null;
  created_at: string | null;
  updated_at: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  folder_ids?: string[];
  campaigns?: Campaign[];
  review_flag?: boolean;
  language?: string;
  pacing?: string,
  bid_amount?: number,
};