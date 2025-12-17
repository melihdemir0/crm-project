import { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Stack,
  CircularProgress,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { Auth } from "../lib/api";

export default function RegisterPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    try {
      await Auth.register(email, password);
      nav("/login"); // Register'dan sonra login ekranına
    } catch (e: any) {
      setErr(e.message || "Register failed");
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
        <Typography variant="h6" sx={{ fontWeight: 800, color: "#0e2239" }}>
          Customer Relationship Management
        </Typography>
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
            bgcolor: "#fff",
          }}
        >
          <Typography
            variant="h3"
            align="center"
            sx={{ fontWeight: 800, mb: 3, color: "#0e2239" }}
          >
            Register
          </Typography>

          <Box component="form" onSubmit={onSubmit}>
            <Stack spacing={2.5}>
              <TextField
                label="Email"
                type="email"
                fullWidth
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <TextField
                label="Password"
                type="password"
                fullWidth
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
                disabled={loading || !email || !password}
                sx={{
                  bgcolor: "#e97732",
                  "&:hover": { bgcolor: "#d96a28" },
                  textTransform: "none",
                  fontWeight: 700,
                }}
                fullWidth
              >
                {loading ? (
                  <CircularProgress size={22} sx={{ color: "#fff" }} />
                ) : (
                  "Register"
                )}
              </Button>
            </Stack>
          </Box>

          <Typography sx={{ mt: 3 }} align="center" color="text.secondary">
            Already have an account?{" "}
            <b style={{ cursor: "pointer" }} onClick={() => nav("/login")}>
              Login
            </b>
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
}
