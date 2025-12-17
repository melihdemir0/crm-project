import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

type Props = {
  open: boolean;
  leadName?: string;
  saving?: boolean;
  error?: string | null;
  onClose: () => void;
  onConfirm: (reason?: string) => Promise<void>;
};

export default function MarkLostDialog({
  open,
  leadName,
  saving = false,
  error = null,
  onClose,
  onConfirm,
}: Props) {
  const [reason, setReason] = useState("");
  const [localErr, setLocalErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setReason("");
    setLocalErr(null);
  }, [open]);

  const err = error || localErr;

  const payloadReason = useMemo(() => {
    const r = reason.trim();
    return r ? r : undefined;
  }, [reason]);

  const handleConfirm = async () => {
    setLocalErr(null);
    try {
      await onConfirm(payloadReason);
    } catch (e: any) {
      setLocalErr(e?.message || "Mark lost failed");
    }
  };

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle>Mark as Lost</DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {err && <Alert severity="error">{err}</Alert>}

          <Typography>
            <b>{leadName || "This lead"}</b> LOST olarak işaretlenecek. Emin
            misin?
          </Typography>

          <TextField
            label="Reason (optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={saving}
            multiline
            minRows={2}
            placeholder="Örn: Fiyat uygun değil / Cevap vermedi / Rakibe gitti..."
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleConfirm} disabled={saving}>
          {saving ? "Saving..." : "Confirm Lost"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
