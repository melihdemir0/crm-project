import { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  Typography,
  Stack,
} from "@mui/material";

type Props = {
  open: boolean;
  leadName?: string;
  saving?: boolean;
  error?: string | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
};

export default function ConvertLeadDialog({
  open,
  leadName,
  saving = false,
  error = null,
  onClose,
  onConfirm,
}: Props) {
  const [localErr, setLocalErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLocalErr(null);
  }, [open]);

  const err = error || localErr;

  const handleConfirm = async () => {
    setLocalErr(null);
    try {
      await onConfirm();
    } catch (e: any) {
      setLocalErr(e?.message || "Convert failed");
    }
  };

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle>Convert Lead</DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {err && <Alert severity="error">{err}</Alert>}

          <Typography>
            <b>{leadName || "This lead"}</b> customer olacak. Emin misin?
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Onaylarsan lead <b>WON</b> olur, customer kaydı oluşur ve
            Activity(CONVERTED) loglanır.
          </Typography>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleConfirm} disabled={saving}>
          {saving ? "Converting..." : "Confirm Convert"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
