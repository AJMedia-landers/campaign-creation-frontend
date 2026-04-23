"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Box, Button, TextField, Typography, Link as MuiLink, Alert, Snackbar } from "@mui/material";
import { useSocket } from "@/providers/SocketProvider";
import Link from "next/link";

function VerifyInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setSocketToken } = useSocket();

  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [okOpen, setOkOpen] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setInfo(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message || "Verification failed");
      setSocketToken(json.data.token);
      setOkOpen(true);
      setTimeout(() => router.replace("/"), 700);
    } catch (e: any) {
      setErr(e.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    if (!email) {
      setErr("Enter your email first");
      return;
    }
    setErr(null);
    setInfo(null);
    setResending(true);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Failed to resend code");
      setInfo(json?.message || "A new code has been sent if the account exists.");
    } catch (e: any) {
      setErr(e.message || "Failed to resend code");
    } finally {
      setResending(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 420, mx: "auto", mt: 10 }}>
      <Typography variant="h4" gutterBottom>
        Verify your email
      </Typography>
      <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
        We sent a 6-digit code to your email. Enter it below to finish signing in.
      </Typography>

      <Box component="form" onSubmit={onSubmit} sx={{ display: "grid", gap: 2 }}>
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <TextField
          label="Verification code"
          value={code}
          onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          inputProps={{ inputMode: "numeric", maxLength: 6, pattern: "[0-9]{6}" }}
          required
          autoFocus
        />
        {err && <Typography color="error">{err}</Typography>}
        {info && <Typography color="success.main">{info}</Typography>}
        <Button type="submit" variant="contained" disabled={loading || code.length !== 6}>
          {loading ? "Verifying..." : "Verify email"}
        </Button>
        <Button type="button" variant="text" onClick={onResend} disabled={resending}>
          {resending ? "Sending..." : "Resend code"}
        </Button>
      </Box>

      <Typography sx={{ mt: 2 }}>
        <MuiLink component={Link} href="/signin">Back to sign in</MuiLink>
      </Typography>

      <Snackbar open={okOpen} autoHideDuration={1200} onClose={() => setOkOpen(false)}>
        <Alert severity="success" variant="filled" onClose={() => setOkOpen(false)}>
          Email verified
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={null}>
      <VerifyInner />
    </Suspense>
  );
}
