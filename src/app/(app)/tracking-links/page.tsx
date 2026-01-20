"use client";
import React, { useState, useEffect } from "react";
import {
    Box,
    Button,
    Card,
    CardContent,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Typography,
    Alert,
    CircularProgress,
    IconButton,
    Snackbar,
    Paper,
    Divider,
    Autocomplete,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import LinkIcon from "@mui/icons-material/Link";
import { useQuery, useMutation } from "@tanstack/react-query";

interface Platform {
    id: number;
    name: string;
    traffic_source_id: string;
    is_active: boolean;
}

interface Country {
    id: number;
    country: string;
    timezone: string;
}

interface Flow {
    id: string;
    name: string;
    deleted: boolean;
    preferred_tracking_domain: string;
}

interface GenerateTrackingLinkRequest {
    platform: string;
    country: string;
    campaign_name: string;
    flow_id: string;
    client_name: string;
    preferred_tracking_domain: string;
}

type ClientName = { id?: string; name: string } | string;

export default function TrackingLinksPage() {
    const [formData, setFormData] = useState<GenerateTrackingLinkRequest>({
        platform: "",
        country: "",
        campaign_name: "",
        flow_id: "",
        client_name: "",
        preferred_tracking_domain: ""
    });

    const [generatedLink, setGeneratedLink] = useState<string>("");
    const [showSuccess, setShowSuccess] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);

    // Fetch platforms
    const { data: platformsData, isLoading: platformsLoading } = useQuery({
        queryKey: ["platforms"],
        queryFn: async () => {
            const res = await fetch("/api/tracking-links/platforms?active_only=true");
            if (!res.ok) throw new Error("Failed to fetch platforms");
            const json = await res.json();
            return json.data as Platform[];
        },
    });

    const { data: countriesData, isLoading: countriesLoading } = useQuery({
        queryKey: ["countries"],
        queryFn: async () => {
            const res = await fetch("/api/country-timezones");
            if (!res.ok) throw new Error("Failed to fetch countries");
            const json = await res.json();
            return json.data as Country[];
        },
    });

    // Fetch flows
    const { data: flowsData, isLoading: flowsLoading } = useQuery({
        queryKey: ["flows"],
        queryFn: async () => {
            const res = await fetch("/api/tracking-links/flows");
            if (!res.ok) throw new Error("Failed to fetch flows");
            const json = await res.json();
            return json.data as Flow[];
        },
    });

    // Generate tracking link mutation
    const generateMutation = useMutation({
        mutationFn: async (data: GenerateTrackingLinkRequest) => {
            const res = await fetch("/api/tracking-links/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed to generate tracking link");
            }
            return res.json();
        },
        onSuccess: (data) => {
            setGeneratedLink(data.data.tracking_link);
            setShowSuccess(true);
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        generateMutation.mutate(formData);
    };

    const handleCopyLink = async () => {
        if (generatedLink) {
            await navigator.clipboard.writeText(generatedLink);
            setCopySuccess(true);
        }
    };

    const handleInputChange = (field: keyof GenerateTrackingLinkRequest, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const uniqueCountries = React.useMemo(() => {
        if (!countriesData) return [];
        const countrySet = new Set<string>();
        return countriesData
            .filter((item) => {
                if (countrySet.has(item.country)) return false;
                countrySet.add(item.country);
                return true;
            })
            .map((item) => item.country)
            .sort();
    }, [countriesData]);

    useEffect(() => {
        const { platform, country, client_name } = formData;

        const parts: string[] = [];
        if (platform) parts.push(platform);
        if (country) parts.push(
            country
                .split(/[^A-Za-z]+/)[0]
                .slice(0, 2)
                .toUpperCase()
        );
        if (client_name) parts.push(client_name);

        if (parts.length > 0) {
            const generatedName = parts.join(" - ");
            setFormData((prev) => ({ ...prev, campaign_name: generatedName }));
        }
    }, [formData.platform, formData.country, formData.client_name, flowsData]);

    // Client names
    const [clientNames, setClientNames] = useState<string[]>([]);
    const [clientLoading, setClientLoading] = useState(false);
    const [clientErr, setClientErr] = useState<string | null>(null);

    useEffect(() => {
        let canceled = false;
        (async () => {
            try {
                setClientLoading(true);
                setClientErr(null);
                const res = await fetch("/api/client-names/get");
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const payload = await res.json();
                const list = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];
                const normalized = (list as ClientName[])
                    .map((c) => (typeof c === "string" ? c : c?.name))
                    .filter(Boolean) as string[];
                if (!canceled) setClientNames(normalized);
            } catch {
                if (!canceled) setClientErr("Failed to load client names");
            } finally {
                if (!canceled) setClientLoading(false);
            }
        })();
        return () => {
            canceled = true;
        };
    }, []);

    return (
        <Box sx={{ p: 3, maxWidth: 1200, mx: "auto" }}>
            <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
                <LinkIcon sx={{ mr: 1, verticalAlign: "middle" }} />
                Tracking Link Generator
            </Typography>

            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Generate tracking links for manual campaign creation. This tool allows you to quickly
                create tracking links for new platforms while we work on full integrations.
            </Typography>

            <Card elevation={2}>
                <CardContent sx={{ p: 4 }}>
                    <form onSubmit={handleSubmit}>
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                            {/* Platform Selection */}
                            <FormControl fullWidth required>
                                <InputLabel>Platform / Traffic Source</InputLabel>
                                <Select
                                    value={formData.platform}
                                    label="Platform / Traffic Source"
                                    onChange={(e) => handleInputChange("platform", e.target.value)}
                                    disabled={platformsLoading}
                                >
                                    {platformsData?.map((platform) => (
                                        <MenuItem key={platform.id} value={platform.name}>
                                            {platform.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            {/* Country - Searchable Autocomplete */}
                            <Autocomplete
                                options={uniqueCountries}
                                value={formData.country || null}
                                onChange={(event, newValue) => {
                                    handleInputChange("country", newValue || "");
                                }}
                                loading={countriesLoading}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Country"
                                        required
                                        placeholder="Search country..."
                                        helperText="Select or type to search for a country"
                                        InputProps={{
                                            ...params.InputProps,
                                            endAdornment: (
                                                <>
                                                    {countriesLoading ? <CircularProgress color="inherit" size={20} /> : null}
                                                    {params.InputProps.endAdornment}
                                                </>
                                            ),
                                        }}
                                    />
                                )}
                                isOptionEqualToValue={(option, value) => option === value}
                            />

                            {/* Client Name Autocomplete */}
                            <Autocomplete
                                options={clientNames}
                                getOptionLabel={(opt) => opt}
                                value={formData.client_name || null}
                                onChange={(_, val) => handleInputChange("client_name", val || "")}
                                loading={clientLoading}
                                loadingText="Loading client names…"
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Client Name"
                                        required
                                        helperText={clientErr || "Select or type a client name"}
                                        fullWidth
                                    />
                                )}
                            />

                            {/* Preferred Tracking Domain */}
                            <TextField
                                select
                                label="Preferred tracking domain"
                                value={formData.preferred_tracking_domain}
                                onChange={(e) => handleInputChange("preferred_tracking_domain", e.target.value)}
                                fullWidth
                                required
                            >
                                <MenuItem key="rht" value="click.risinghealthtrends.com">
                                    click.risinghealthtrends.com
                                </MenuItem>
                                <MenuItem key="cdp" value="caringdipaimed.com">
                                    caringdipaimed.com
                                </MenuItem>
                                <MenuItem key="flc" value="go.forwardlinkclick.com">
                                    go.forwardlinkclick.com
                                </MenuItem>
                                <MenuItem key="shn" value="click.seekinghealthnews.com">
                                    click.seekinghealthnews.com
                                </MenuItem>
                                <MenuItem key="ttn" value="go.toptrendingnewstoday.com">
                                    go.toptrendingnewstoday.com
                                </MenuItem>
                                <MenuItem key="stp" value="go.thesmarttechpost.com">
                                    go.thesmarttechpost.com
                                </MenuItem>
                            </TextField>

                            {/* Flow Selection - Searchable Autocomplete */}
                            <Autocomplete
                                options={flowsData || []}
                                value={flowsData?.find((f) => f.id === formData.flow_id) || null}
                                onChange={(event, newValue) => {
                                    handleInputChange("flow_id", newValue?.id || "");
                                }}
                                loading={flowsLoading}
                                getOptionLabel={(option) => option.name}
                                getOptionKey={(option) => option.id}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Voluum Flow"
                                        required
                                        placeholder="Search flow..."
                                        helperText="Select or type to search for a Voluum flow"
                                        InputProps={{
                                            ...params.InputProps,
                                            endAdornment: (
                                                <>
                                                    {flowsLoading ? <CircularProgress color="inherit" size={20} /> : null}
                                                    {params.InputProps.endAdornment}
                                                </>
                                            ),
                                        }}
                                    />
                                )}
                                isOptionEqualToValue={(option, value) => option.id === value?.id}
                            />

                            {/* Campaign Name - Auto-generated based on selections */}
                            <TextField
                                label="Campaign Name"
                                value={formData.campaign_name}
                                onChange={(e) => handleInputChange("campaign_name", e.target.value)}
                                required
                                fullWidth
                                placeholder="e.g., Taboola - United States - Knife Sharpener"
                                helperText="Auto-generated from Platform, Country, and Flow selections. You can edit it if needed."
                            />

                            {/* Error Display */}
                            {generateMutation.isError && (
                                <Alert severity="error">
                                    {generateMutation.error instanceof Error
                                        ? generateMutation.error.message
                                        : "Failed to generate tracking link"}
                                </Alert>
                            )}

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                variant="contained"
                                size="large"
                                disabled={
                                    generateMutation.isPending ||
                                    !formData.platform ||
                                    !formData.country ||
                                    !formData.campaign_name ||
                                    !formData.flow_id ||
                                    !formData.client_name ||
                                    !formData.preferred_tracking_domain
                                }
                                sx={{ mt: 2 }}
                            >
                                {generateMutation.isPending ? (
                                    <>
                                        <CircularProgress size={20} sx={{ mr: 1 }} />
                                        Generating...
                                    </>
                                ) : (
                                    "Generate Tracking Link"
                                )}
                            </Button>
                        </Box>
                    </form>
                </CardContent>
            </Card>

            {/* Generated Link Display */}
            {generatedLink && (
                <Paper elevation={3} sx={{ mt: 4, p: 3, bgcolor: "success.light", color: "success.contrastText" }}>
                    <Typography variant="h6" gutterBottom>
                        ✓ Tracking Link Generated Successfully
                    </Typography>
                    <Divider sx={{ my: 2, bgcolor: "success.dark" }} />
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            bgcolor: "white",
                            p: 2,
                            borderRadius: 1,
                            color: "text.primary",
                        }}
                    >
                        <TextField
                            value={generatedLink}
                            fullWidth
                            multiline
                            maxRows={3}
                            InputProps={{
                                readOnly: true,
                                sx: { fontSize: "0.9rem", fontFamily: "monospace" },
                            }}
                            variant="standard"
                        />
                        <IconButton onClick={handleCopyLink} color="primary" sx={{ ml: 1 }}>
                            <ContentCopyIcon />
                        </IconButton>
                    </Box>
                </Paper>
            )}

            {/* Success Snackbar */}
            <Snackbar
                open={showSuccess}
                autoHideDuration={6000}
                onClose={() => setShowSuccess(false)}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <Alert onClose={() => setShowSuccess(false)} severity="success" sx={{ width: "100%" }}>
                    Tracking link generated successfully!
                </Alert>
            </Snackbar>

            {/* Copy Success Snackbar */}
            <Snackbar
                open={copySuccess}
                autoHideDuration={2000}
                onClose={() => setCopySuccess(false)}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            >
                <Alert onClose={() => setCopySuccess(false)} severity="info" sx={{ width: "100%" }}>
                    Link copied to clipboard!
                </Alert>
            </Snackbar>
        </Box>
    );
}