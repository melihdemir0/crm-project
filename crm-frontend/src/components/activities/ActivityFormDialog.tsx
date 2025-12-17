import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
} from "@mui/material";
import type { Activity, ActivityTypeUi } from "../../types/activity";
import { Leads, Customers } from "../../lib/api";

type Props = {
  open: boolean;
  initial?: Partial<Activity> | null;
  onClose: () => void;
  onSubmit: (payload: Partial<Activity>) => Promise<void>;
};

// ✅ lifecycle tipleri eklendi
const TYPES: ActivityTypeUi[] = [
  "call",
  "email",
  "meeting",
  "note",
  "converted",
  "lost",
  "status_changed",
];

type RelOpt = "" | "lead" | "customer";

// datetime-local input için ISO -> local string
function isoToLocalInput(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export default function ActivityFormDialog({
  open,
  initial,
  onClose,
  onSubmit,
}: Props) {
  const isEdit = !!initial?.id;

  const [type, setType] = useState<ActivityTypeUi>(initial?.type ?? "call");
  const [note, setNote] = useState(initial?.note ?? "");

  // datetime-local value (YYYY-MM-DDTHH:mm)
  const [when, setWhen] = useState<string>(
    isoToLocalInput(initial?.when ?? "")
  );

  const [rel, setRel] = useState<RelOpt>(() =>
    initial?.leadId ? "lead" : initial?.customerId ? "customer" : ""
  );
  const [relId, setRelId] = useState<number | "">(
    () => (initial?.leadId as number) ?? (initial?.customerId as number) ?? ""
  );

  const [relName, setRelName] = useState<string>("");
  const [relValid, setRelValid] = useState<boolean>(true);

  useEffect(() => {
    setType((initial?.type as ActivityTypeUi) ?? "call");
    setNote(initial?.note ?? "");
    setWhen(isoToLocalInput(initial?.when ?? ""));

    const r = initial?.leadId ? "lead" : initial?.customerId ? "customer" : "";
    setRel(r as RelOpt);
    setRelId(
      (initial?.leadId as number) ?? (initial?.customerId as number) ?? ""
    );

    setRelName("");
    setRelValid(true);
  }, [initial, open]);

  // ---- ID değişince adı getir (debounce)
  const debounceKey = useMemo(() => `${rel}:${relId}`, [rel, relId]);
  useEffect(() => {
    let alive = true;
    setRelName("");
    setRelValid(true);

    if (!rel || relId === "") return;

    const t = setTimeout(async () => {
      try {
        const data =
          rel === "lead"
            ? await Leads.getById(Number(relId))
            : await Customers.getById(Number(relId));
        if (!alive) return;

        const name = data?.name || data?.title || data?.email || `#${relId}`;
        setRelName(String(name));
        setRelValid(true);
      } catch {
        if (!alive) return;
        setRelName("Not found");
        setRelValid(false);
      }
    }, 400);

    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [debounceKey]);

  const handleSubmit = async () => {
    if (rel && relId !== "" && !relValid) return;

    // datetime-local -> ISO (UTC)
    const whenIso = when ? new Date(when).toISOString() : undefined;

    const payload: Partial<Activity> = {
      id: initial?.id,
      type,
      note: note || undefined,
      leadId: rel === "lead" && relId !== "" ? Number(relId) : undefined,
      customerId:
        rel === "customer" && relId !== "" ? Number(relId) : undefined,
    };

    // ✅ only include when if user selected it
    if (whenIso) payload.when = whenIso;

    await onSubmit(payload);
  };

  const saveDisabled = !!(rel && relId !== "" && !relValid);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{isEdit ? "Edit Activity" : "Log Activity"}</DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <FormControl>
            <InputLabel>Type</InputLabel>
            <Select
              label="Type"
              value={type}
              onChange={(e) => setType(e.target.value as ActivityTypeUi)}
            >
              {TYPES.map((t) => (
                <MenuItem key={t} value={t}>
                  {t}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            multiline
            minRows={3}
          />

          <TextField
            label="When"
            type="datetime-local"
            value={when}
            onChange={(e) => setWhen(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />

          <Stack direction="row" spacing={2}>
            <FormControl fullWidth>
              <InputLabel>Related</InputLabel>
              <Select
                label="Related"
                value={rel}
                onChange={(e) => {
                  const v = e.target.value as RelOpt;
                  setRel(v);
                  setRelId("");
                  setRelName("");
                  setRelValid(true);
                }}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                <MenuItem value="lead">Lead</MenuItem>
                <MenuItem value="customer">Customer</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="ID"
              type="number"
              value={relId}
              onChange={(e) =>
                setRelId(e.target.value === "" ? "" : Number(e.target.value))
              }
              disabled={!rel}
              error={!!(rel && relId !== "" && !relValid)}
              fullWidth
              helperText={
                rel
                  ? relId === ""
                    ? "Enter ID"
                    : relValid
                    ? relName || ""
                    : "Not found"
                  : " "
              }
            />
          </Stack>

          {rel && relId !== "" && relValid && relName && (
            <FormHelperText sx={{ ml: 0.5 }}>Name: {relName}</FormHelperText>
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={saveDisabled}
        >
          {isEdit ? "Save" : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
