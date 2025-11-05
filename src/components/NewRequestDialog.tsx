"use client";

import * as React from "react";
import { Dialog, DialogTitle, DialogContent, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import NewRequestForm from "@/components/NewRequestForm";
import type { CampaignCreateResponse } from "@/types/campaign";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated?: (res: CampaignCreateResponse) => void;
  title?: string;
};

export default function NewRequestDialog({ open, onClose, onCreated, title = "campaignRequests Form" }: Props) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pr: 6 }}>
        {title}
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: "absolute", right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <NewRequestForm
          submitLabel="Save"
          title=""
          onSubmitted={(res) => {
            onCreated?.(res);
            onClose();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
