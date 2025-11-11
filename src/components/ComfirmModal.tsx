"use client";
import * as React from "react";
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from "@mui/material";

export default  function ConfirmBeforeSubmit({
  open,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle>Review Your Campaign Details</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ whiteSpace: "pre-wrap" }}>
          Before submitting, please double-check all fields to make sure your
          information is complete and accurate. Once submitted, changes may be
          limited.

          {"\n\n"}Do you want to proceed?
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} variant="outlined">Cancel</Button>
        <Button onClick={onConfirm} color="primary" variant="contained">
          Forced Create
        </Button>
      </DialogActions>
    </Dialog>
  );
}
