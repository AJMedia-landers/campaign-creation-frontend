"use client";

import * as React from "react";
import { Box, Stack, Typography } from "@mui/material";
import InboxIcon from "@mui/icons-material/Inbox";

type Props = {
  title?: string;
  subtitle?: string;
};

export default function EmptyState({
  title = "No results",
  subtitle = "Try changing your search or filters.",
}: Props) {
  return (
    <Box sx={{ py: 8 }}>
      <Stack spacing={2} alignItems="center" textAlign="center">
        <InboxIcon sx={{ fontSize: 64, opacity: 0.35 }} />
        <Typography variant="h6">{title}</Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", maxWidth: 520 }}>
          {subtitle}
        </Typography>
      </Stack>
    </Box>
  );
}
