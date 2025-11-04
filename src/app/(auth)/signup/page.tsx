"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Button, TextField, Typography, Link as MuiLink, IconButton, InputAdornment } from "@mui/material";
import Link from "next/link";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

export default function SignUpPage() {
  const router = useRouter();
  const [first_name, setFirst] = useState("");
  const [last_name, setLast] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ first_name, last_name, email, password }),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message || "Sign up failed");
      // after successful signup, you’re logged in (cookie set) -> go home
      router.replace("/");
    } catch (e: any) {
      setErr(e.message || "Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 480, mx: "auto", mt: 10 }}>
      <Typography variant="h4" gutterBottom>
        Create account(Not working)
      </Typography>
      <Box component="form" onSubmit={onSubmit} sx={{ display: "grid", gap: 2 }}>
        <TextField
          label="First name"
          value={first_name}
          onChange={e=>setFirst(e.target.value)}
          required
        />
        <TextField
          label="Last name"
          value={last_name}
          onChange={e=>setLast(e.target.value)}
          required
        />
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={e=>setEmail(e.target.value)}
          required
        />
        <TextField
          label="Password" required
          type={showPw ? "text" : "password"}
          autoComplete="new-password"
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
          <Typography color="error">
            {err}
          </Typography>
        }
        <Button type="submit" variant="contained" disabled={loading}>
          {loading ? "Creating..." : "Sign up"}
        </Button>
      </Box>
      <Typography sx={{ mt: 2 }}>
        Already have an account?{" "}
        <MuiLink component={Link} href="/signin">Sign in</MuiLink>
      </Typography>
    </Box>
  );
}
