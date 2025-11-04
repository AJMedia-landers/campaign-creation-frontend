"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Button, TextField, Typography, Link as MuiLink, IconButton, InputAdornment } from "@mui/material";
import Link from "next/link";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message || "Login failed");
      router.replace("/"); // protected home
    } catch (e: any) {
      setErr(e.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 420, mx: "auto", mt: 10 }}>
      <Typography variant="h4" gutterBottom>
        Sign in
      </Typography>
      <Box component="form" onSubmit={onSubmit} sx={{ display: "grid", gap: 2 }}>
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required />
        <TextField
          label="Password" required
          type={showPw ? "text" : "password"}
          autoComplete="current-password"
          value={password} onChange={e=>setPassword(e.target.value)}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label={showPw ? "Hide password" : "Show password"}
                  onClick={()=>setShowPw(p=>!p)}
                  onMouseDown={e=>e.preventDefault()}
                  edge="end"
                >
                  {showPw ? <VisibilityOff/> : <Visibility/>}
                </IconButton>
              </InputAdornment>
            )
          }}
        />
        {err &&
          <Typography color="error">{err}</Typography>
        }
        <Button type="submit" variant="contained" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </Button>
      </Box>
      <Typography sx={{ mt: 2 }}>
        No account?{" "}
        <MuiLink component={Link} href="/signup">Create one</MuiLink>
      </Typography>
    </Box>
  );
}
