"use client";

import { Box } from "@mui/material";
import UpdateAdsForm from "@/components/UpdateAdsForm";

export default function UpdateAdsFormPage() {
  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1200, mx: "auto" }}>
      <UpdateAdsForm />
    </Box>
  );
}