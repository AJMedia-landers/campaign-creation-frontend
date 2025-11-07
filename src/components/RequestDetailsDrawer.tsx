"use client";
import * as React from "react";
import {
  Drawer, IconButton, Box, Typography, Divider, Stack, Chip, Link as MLink
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

export type Campaign = {
  campaign_name: string;
  campaign_status?: string;
  campaign_id?: string | null;
  tracking_link?: string | null;
  built_time?: string | null;
  country?: string | null;
};

export type RequestItem = {
  id: number;
  requester?: string;
  request_date?: string;
  status?: string;
  campaign_type?: string;
  campaign_date?: string;
  client_name?: string;
  creatives_folder?: string | null;
  ad_platform?: string;
  brand_name?: string;
  hours_start?: number | string;
  hours_end?: number | string;
  timezone?: string;
  ad_account_id?: string;
  campaigns?: Campaign[];
  title?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  data?: any;
};

export default function RequestDetailsDrawer({ open, onClose, data }: Props) {
  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx:{ width:{ xs: "100%", md: 460 } }}}>
      <Box sx={{ p: 2, pb: 1, position:"sticky", top:0, bgcolor:"background.paper", zIndex:1 }}>
        <Stack direction="row" alignItems="center" gap={1}>
          <Typography variant="h6" sx={{ flex: 1 }}>
            {data?.title ?? "Request details"}
          </Typography>
          <Chip size="small" label={data?.status ?? "-"} />
          <IconButton onClick={onClose}><CloseIcon/></IconButton>
        </Stack>
      </Box>

      <Box sx={{ p: 2, pt: 0 }}>
        <Info label="Requester" value={data?.requester}/>
        <Info label="Requested" value={data?.request_date}/>
        <Info label="Campaign date" value={data?.campaign_date}/>
        <Info label="Client" value={data?.client_name}/>
        <Info label="Brand" value={data?.brand_name}/>
        <Info label="Platform" value={data?.ad_platform}/>
        <Info label="Ad Account" value={data?.ad_account_id}/>
        <Info label="Type" value={data?.campaign_type}/>
        <Info label="Hours" value={(data?.hours_start ?? "-") + " → " + (data?.hours_end ?? "-")}/>
        <Info label="Timezone" value={data?.timezone}/>
        {data?.creatives_folder &&
          <Info label="Creatives folder"
                value={<MLink href={data.creatives_folder} target="_blank" rel="noreferrer">{data.creatives_folder}</MLink>} />
        }

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle1" sx={{ mb: 1 }}>Campaigns</Typography>
        <Stack spacing={1.25}>
          {(data?.campaigns ?? []).map((c: { campaign_name: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; campaign_status: any; campaign_id: any; built_time: any; country: any; tracking_link: string | undefined; }, i: React.Key | null | undefined) => (
            <Box key={i} sx={{
              p: 1.2, borderRadius: 1.2, border: 1, borderColor: "divider", bgcolor:"background.default"
            }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: .25 }}>{c.campaign_name}</Typography>
              <Stack direction="row" flexWrap="wrap" gap={1}>
                <Chip size="small" label={c.campaign_status ?? "-"} />
                <Field label="ID" value={c.campaign_id ?? "—"} />
                <Field label="Built" value={c.built_time ?? "—"} />
                <Field label="Country" value={c.country ?? "—"} />
                {c.tracking_link &&
                  <MLink href={c.tracking_link} target="_blank" rel="noreferrer">Tracking link</MLink>
                }
              </Stack>
            </Box>
          ))}
          {(data?.campaigns?.length ?? 0) === 0 && (
            <Typography variant="body2" color="text.secondary">No campaigns found.</Typography>
          )}
        </Stack>
      </Box>
    </Drawer>
  );
}

function Info({ label, value }: { label: string; value?: React.ReactNode }) {
  if (!value) return null;
  return (
    <Stack direction="row" justifyContent="space-between" sx={{ py: .5 }}>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="body2" sx={{ ml: 2, textAlign: "right" }}>{value}</Typography>
    </Stack>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Chip size="small" variant="outlined" label={`${label}: ${value}`} />
  );
}
