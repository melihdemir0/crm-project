import { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Checkbox,
  FormControlLabel,
  Stack,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo256 from "../assets/crm-logo-256.png";

export default function LoginPage() {
  const nav = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);

  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      await login(email, password, remember);
      nav("/dashboard");
    } catch (e: any) {
      setErr(e?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        bgcolor: "#f6f8fb",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box sx={{ px: 3, py: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 2000, color: "#031ff7ff" }}>
          Customer Relationship Management
        </Typography>
      </Box>
      <Box sx={{ display: "grid", placeItems: "center", mb: 2 }}>
        <Box
          component="img"
          src={logo256}
          alt="CRM Logo"
          sx={{ width: 150, height: 150 }}
        />
      </Box>
      <Box sx={{ flex: 1, display: "grid", placeItems: "center", p: 2 }}>
        <Paper
          elevation={0}
          sx={{
            width: 520,
            maxWidth: "95vw",
            p: 4,
            borderRadius: 3,
            border: "1px solid #e6ebf2",
            bgcolor: "#ffffff",
          }}
        >
          <Typography
            variant="h3"
            align="center"
            sx={{ fontWeight: 800, mb: 3, color: "#0e2239" }}
          >
            Login
          </Typography>

          <Box component="form" onSubmit={onSubmit}>
            <Stack spacing={2.5}>
              <TextField
                label="Email"
                type="email"
                fullWidth
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
              <TextField
                label="Password"
                type="password"
                fullWidth
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    disabled={loading}
                  />
                }
                label="Remember me"
              />

              {err && (
                <Typography color="error" variant="body2">
                  {err}
                </Typography>
              )}

              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                sx={{
                  bgcolor: "#e97732",
                  "&:hover": { bgcolor: "#d96a28" },
                  textTransform: "none",
                  fontWeight: 700,
                }}
                fullWidth
              >
                {loading ? "Logging in..." : "Log in"}
              </Button>
            </Stack>
          </Box>

          <Typography sx={{ mt: 3 }} align="center" color="text.secondary">
            Don&apos;t have an account?{" "}
            <b style={{ cursor: "pointer" }} onClick={() => nav("/register")}>
              Register
            </b>
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
}
