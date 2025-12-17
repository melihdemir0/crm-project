// src/components/customers/CustomerFormDialog.tsx
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Stack,
} from "@mui/material";
import type { Customer } from "../../types/customer";

type Props = {
  open: boolean;
  initial?: Partial<Customer> | null;
  onClose: () => void;
  onSubmit: (payload: Partial<Customer>) => Promise<void>;
};

export default function CustomerFormDialog({
  open,
  initial,
  onClose,
  onSubmit,
}: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const isEdit = !!initial?.id;

  useEffect(() => {
    setName(initial?.name ?? "");
    setEmail(initial?.email ?? "");
    setPhone(initial?.phone ?? "");
  }, [initial, open]);

  const handleSubmit = async () => {
    // Sadece backend’in kabul ettiği alanları gönderiyoruz
    await onSubmit({
      id: initial?.id,
      name,
      email: email || undefined,
      phone: phone || undefined,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{isEdit ? "Edit Customer" : "Add Customer"}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
          <TextField
            label="Email"
            type="email"
            value={email ?? ""}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            label="Phone"
            value={phone ?? ""}
            onChange={(e) => setPhone(e.target.value)}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained">
          {isEdit ? "Save" : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
