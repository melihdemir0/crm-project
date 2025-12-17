import { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  TextField,
  MenuItem,
  Alert,
  Typography,
} from "@mui/material";

type LeadStatus = "new" | "contacted" | "qualified" | "won" | "lost";

const options: { value: LeadStatus; label: string }[] = [
  { value: "new", label: "NEW" },
  { value: "contacted", label: "CONTACTED" },
  { value: "qualified", label: "QUALIFIED" },
  { value: "won", label: "WON" },
  { value: "lost", label: "LOST" },
];

type Props = {
  open: boolean;
  leadName?: string;
  currentStatus?: string;
  saving?: boolean;
  onClose: () => void;
  onConfirm: (status: LeadStatus, note?: string) => Promise<void>;
};

export default function ChangeStatusDialog({
  open,
  leadName,
  currentStatus,
  saving = false,
  onClose,
  onConfirm,
}: Props) {
  const [status, setStatus] = useState<LeadStatus>("new");
  const [note, setNote] = useState("");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setErr(null);
    setNote("");
    const s = (currentStatus || "new") as LeadStatus;
    setStatus(s);
  }, [open, currentStatus]);

  const handle = async () => {
    setErr(null);
    try {
      await onConfirm(status, note.trim() || undefined);
    } catch (e: any) {
      setErr(e?.message || "Status change failed");
    }
  };

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      fullWidth
      maxWidth="xs"
    >
      <DialogTitle>Change Status</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {err && <Alert severity="error">{err}</Alert>}

          <Typography variant="body2" color="text.secondary">
            {leadName ? <b>{leadName}</b> : "Lead"} için durum değişecek ve
            Activity loglanacak.
          </Typography>

          <TextField
            select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as LeadStatus)}
            disabled={saving}
          >
            {options.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={saving}
            multiline
            minRows={2}
            placeholder="Örn: Görüşme sonrası qualified oldu..."
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handle} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
