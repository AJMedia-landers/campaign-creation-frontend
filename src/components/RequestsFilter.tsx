"use client";
import * as React from "react";
import {
  Box,
  Chip,
  Collapse,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  Stack,
  Tooltip,
  Button,
  SelectChangeEvent,
  TextField,
  IconButton,
  Typography,
  Autocomplete,
} from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";
import ClearAllIcon from "@mui/icons-material/ClearAll";

export type RequestsFilterValue = {
  statuses: string[];
  platforms: string[];
  devices: string[];
  requester: string;
  requestDateFrom: string | null; // "YYYY-MM-DD"
  requestDateTo: string | null;
  clientName: string;
  campaignDateFrom: string | null;
  campaignDateTo: string | null;
  country: string;
};

export const defaultRequestsFilter: RequestsFilterValue = {
  statuses: [],
  platforms: [],
  devices: [],
  requester: "",
  requestDateFrom: null,
  requestDateTo: null,
  clientName: "",
  campaignDateFrom: null,
  campaignDateTo: null,
  country: "",
};

type Props = {
  value: RequestsFilterValue;
  onChange: (v: RequestsFilterValue) => void;
  onClear?: () => void;
};

const MENU_PROPS = { PaperProps: { style: { maxHeight: 360 } } };

const setDateField =
  (key: keyof RequestsFilterValue, onChange: (v: RequestsFilterValue) => void, value: RequestsFilterValue) =>
  (e: React.ChangeEvent<HTMLInputElement>) => {
    const str = e.target.value.trim();
    onChange({ ...value, [key]: str === "" ? null : str });
  };

export default function RequestsFilter({ value, onChange, onClear }: Props) {
  const [open, setOpen] = React.useState(false);
  const [requesters, setRequesters] = React.useState<string[]>([]);
  const [clientNames, setClientNames] = React.useState<string[]>([]);
  const [countries, setCountries] = React.useState<string[]>([]);

  React.useEffect(() => {
    let cancelled = false;

    const loadOptions = async () => {
      try {
        const [reqRes, clientRes, countryRes] = await Promise.all([
          fetch("/api/requesters"),
          fetch("/api/client-names"),
          fetch("/api/country-timezones"),
        ]);

        if (cancelled) return;

        // --- Requesters (mock API you created) ---
        if (reqRes.ok) {
          const json = await reqRes.json();
          const arr = Array.isArray(json) ? json : [];
          setRequesters([...new Set(arr.filter(Boolean))]);
        }

        // --- Client names ---
        if (clientRes.ok) {
          const json = await clientRes.json();
          const list = Array.isArray(json.data) ? json.data : [];
          setClientNames(
            Array.from(
              new Set(
                list
                  .map((x: any) => x?.name || "")
                  .filter(Boolean)
              )
            ) as string[]
          );
        }

        // --- Countries ---
        if (countryRes.ok) {
          const json = await countryRes.json();
          const list = Array.isArray(json.data) ? json.data : [];
          setCountries(
            Array.from(
              new Set(
                list
                  .map((x: any) => x?.country || "")
                  .filter(Boolean)
              )
            ) as string[]
          );
        }
      } catch (err) {
        console.error("Failed to load filter options", err);
      }
    };

    loadOptions();
    return () => {
      cancelled = true;
    };
  }, []);


  const handleArray =
    (key: keyof RequestsFilterValue) =>
    (e: SelectChangeEvent<string[]>) =>
      onChange({ ...value, [key]: e.target.value as string[] });

  const handleText =
    (key: keyof RequestsFilterValue) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onChange({ ...value, [key]: e.target.value });

  const resetDisabled =
    value.statuses.length === 0 &&
    value.platforms.length === 0 &&
    value.devices.length === 0 &&
    !value.requester &&
    !value.clientName &&
    !value.requestDateFrom &&
    !value.requestDateTo &&
    !value.campaignDateFrom &&
    !value.campaignDateTo &&
    !value.country;

  return (
    <Box sx={{ borderRadius: 2, border: "1px solid", borderColor: "divider", bgcolor: "background.paper", mb: 2 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 1.5, py: 1 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <IconButton size="small" onClick={() => setOpen((v) => !v)} aria-label="Toggle filters">
            <FilterListIcon />
          </IconButton>
          <Typography variant="subtitle1">Filters</Typography>
        </Stack>

        <Tooltip title="Reset all filters">
          <span>
            <Button
              onClick={onClear}
              variant="outlined"
              size="small"
              startIcon={<ClearAllIcon />}
              disabled={resetDisabled}
            >
              Reset
            </Button>
          </span>
        </Tooltip>
      </Stack>

      <Collapse in={open} timeout="auto" unmountOnExit>
        <Divider />
        <Box sx={{ p: 1.5 }}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            alignItems="center"
            flexWrap="wrap"
            sx={{ gap: 2 }}
          >
            {/* Requester */}
            <Autocomplete
              size="small"
              sx={{ minWidth: 220 }}
              options={requesters}
              value={value.requester || ""}
              onChange={(_, newValue) =>
                onChange({ ...value, requester: newValue || "" })
              }
              freeSolo={false}
              disableClearable
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Requester"
                  placeholder="Start typing a name…"
                />
              )}
            />

            {/* ClientName */}
            <Autocomplete
              size="small"
              sx={{ minWidth: 220 }}
              options={clientNames}
              value={value.clientName || ""}
              disableClearable
              onChange={(_, newValue) =>
                onChange({ ...value, clientName: newValue || "" })
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Client Name"
                  placeholder="Start typing a client…"
                />
              )}
            />


            {/* Country */}
            <Autocomplete
              size="small"
              sx={{ minWidth: 220 }}
              options={countries}
              value={value.country || ""}
              disableClearable
              onChange={(_, newValue) =>
                onChange({ ...value, country: newValue || "" })
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Country"
                  placeholder="Start typing a country…"
                />
              )}
            />

            {/* Status */}
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel id="req-filter-statuses">Status</InputLabel>
              <Select
                multiple
                labelId="req-filter-statuses"
                label="Status"
                value={value.statuses}
                onChange={handleArray("statuses")}
                input={<OutlinedInput label="Status" />}
                renderValue={(s) =>
                  (s as string[]).map((x) => <Chip key={x} size="small" sx={{ mr: 0.5 }} label={x} />)
                }
                MenuProps={MENU_PROPS}
              >
                {["Created", "Error"].map((opt) => (
                  <MenuItem key={opt} value={opt}>
                    {opt}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Platform */}
            <FormControl size="small" sx={{ minWidth: 220 }}>
              <InputLabel id="req-filter-platforms">Platform</InputLabel>
              <Select
                multiple
                labelId="req-filter-platforms"
                label="Platform"
                value={value.platforms}
                onChange={handleArray("platforms")}
                input={<OutlinedInput label="Platform" />}
                renderValue={(s) =>
                  (s as string[]).map((x) => <Chip key={x} size="small" sx={{ mr: 0.5 }} label={x} />)
                }
                MenuProps={MENU_PROPS}
              >
                {["Taboola", "Outbrain", "RevContent"].map((opt) => (
                  <MenuItem key={opt} value={opt}>
                    {opt}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Device */}
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel id="req-filter-devices">Device</InputLabel>
              <Select
                multiple
                labelId="req-filter-devices"
                label="Device"
                value={value.devices}
                onChange={handleArray("devices")}
                input={<OutlinedInput label="Device" />}
                renderValue={(s) =>
                  (s as string[]).map((x) => <Chip key={x} size="small" sx={{ mr: 0.5 }} label={x} />)
                }
                MenuProps={MENU_PROPS}
              >
                {["Mobile", "Desktop", "Tablet"].map((opt) => (
                  <MenuItem key={opt} value={opt}>
                    {opt}
                  </MenuItem>
                ))}
              </Select>

            </FormControl>
            <Stack
              direction={{ xs: "column", md: "row" }}
              alignItems="center"
              flexWrap="wrap"
              sx={{ gap: 2 }}>

              {/* Request Date */}
              <TextField
                size="small"
                type="date"
                label="Request Date From"
                value={value.requestDateFrom ?? ""}
                onChange={setDateField("requestDateFrom", onChange, value)}
                InputLabelProps={{ shrink: true }}
                inputProps={{ pattern: "\\d{4}-\\d{2}-\\d{2}" }}
              />
              <TextField
                size="small"
                type="date"
                label="Request Date To"
                value={value.requestDateTo ?? ""}
                onChange={setDateField("requestDateTo", onChange, value)}
                InputLabelProps={{ shrink: true }}
              />
              {/* Campaign Date */}
              <TextField
                size="small"
                type="date"
                label="Campaign Date From"
                value={value.campaignDateFrom ?? ""}
                onChange={setDateField("campaignDateFrom", onChange, value)}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                size="small"
                type="date"
                label="Campaign Date To"
                value={value.campaignDateTo ?? ""}
                onChange={setDateField("campaignDateTo", onChange, value)}
                InputLabelProps={{ shrink: true }}
              />
            </Stack>
          </Stack>
        </Box>
      </Collapse>
    </Box>
  );
}
