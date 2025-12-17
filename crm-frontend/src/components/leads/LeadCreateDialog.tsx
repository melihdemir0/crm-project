import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  TextField,
  Alert,
  Typography,
  MenuItem,
} from "@mui/material";

type LeadStatus = "new" | "contacted" | "qualified" | "won" | "lost";

type Payload = {
  name: string;
  email?: string;
  phone?: string;
  notes?: string;
  status?: LeadStatus; // backend kabul ediyorsa gönderilecek
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: Payload) => Promise<void>;
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeError(e: any) {
  const msg = e?.message;
  if (Array.isArray(msg)) return msg.join(" • ");
  return msg || "Lead oluşturulamadı";
}

const statusOptions: { value: LeadStatus; label: string }[] = [
  { value: "new", label: "NEW" },
  { value: "contacted", label: "CONTACTED" },
  { value: "qualified", label: "QUALIFIED" },
  { value: "won", label: "WON" },
  { value: "lost", label: "LOST" },
];

export default function LeadCreateDialog({ open, onClose, onSubmit }: Props) {
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<LeadStatus>("new");

  useEffect(() => {
    if (!open) return;

    setErr(null);
    setSaving(false);

    setName("");
    setEmail("");
    setPhone("");
    setNotes("");
    setStatus("new");
  }, [open]);

  const isValid = useMemo(() => {
    if (!name.trim()) return false;
    if (email.trim() && !emailRegex.test(email.trim())) return false;
    return true;
  }, [name, email]);

  const handleSubmit = async () => {
    setErr(null);

    if (!isValid) {
      setErr("İsim zorunlu. Email girildiyse formatı doğru olmalı.");
      return;
    }

    // Not: status'u her zaman gönderiyoruz.
    // Eğer backend status kabul etmiyorsa, aşağıdaki `status` satırını kaldırırız.
    const payload: Payload = {
      name: name.trim(),
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      notes: notes.trim() || undefined,
      status,
    };

    try {
      setSaving(true);
      await onSubmit(payload);
      onClose();
    } catch (e: any) {
      setErr(normalizeError(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle sx={{ pb: 1 }}>
        Add New Lead
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Durumu başlangıçta seçebilirsin (default: NEW).
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {err && <Alert severity="error">{err}</Alert>}

          <TextField
            label="Name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            disabled={saving}
          />

          <TextField
            select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as LeadStatus)}
            disabled={saving}
          >
            {statusOptions.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={saving}
            error={!!email.trim() && !emailRegex.test(email.trim())}
            helperText={
              email.trim() && !emailRegex.test(email.trim())
                ? "Email formatı hatalı"
                : " "
            }
          />

          <TextField
            label="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={saving}
          />

          <TextField
            label="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={saving}
            multiline
            minRows={3}
            placeholder="İlk temas notları, ihtiyaç, bütçe, vs."
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!isValid || saving}
        >
          {saving ? "Saving..." : "Create Lead"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
