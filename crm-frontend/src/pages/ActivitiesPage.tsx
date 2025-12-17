import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Container,
  Snackbar,
  Alert,
  CircularProgress,
  Paper,
  Stack,
  TextField,
  MenuItem,
  Button,
} from "@mui/material";
import ActivityTable, {
  type ActivityRow,
} from "../components/activities/ActivityTable";
import ActivityFormDialog from "../components/activities/ActivityFormDialog";
import { Activities, Leads, Customers } from "../lib/api";
import type { Paginated } from "../lib/api";
import type { Activity, ActivityDTO, ActivityType } from "../types/activity";
import { toUiType, toBackendType } from "../types/activity";

type Meta = Paginated<ActivityDTO>["meta"];

// --- Filters (UI)
type EntityFilter = "ALL" | "LEAD" | "CUSTOMER";

// ISO helpers
function dtLocalToIso(v: string): string | undefined {
  if (!v) return undefined;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

function parsePositiveInt(s: string): number | undefined {
  if (!s) return undefined;
  const n = Number(s);
  if (!Number.isInteger(n) || n <= 0) return undefined;
  return n;
}

// İsim çıkarma helper: hangi alan varsa onu kullan
function pickName(obj: any): string | null {
  if (!obj || typeof obj !== "object") return null;
  const candidates = [
    obj.name,
    obj.fullName,
    obj.companyName,
    obj.title,
    obj.firstName && obj.lastName ? `${obj.firstName} ${obj.lastName}` : null,
    obj.email,
  ].filter(Boolean) as string[];
  return candidates[0] || null;
}

// Basit ad cache'i
const nameCache = new Map<string, string>();
async function resolveName(
  kind: "lead" | "customer",
  id: number
): Promise<string | null> {
  const key = `${kind}:${id}`;
  if (nameCache.has(key)) return nameCache.get(key)!;
  try {
    const data =
      kind === "lead" ? await Leads.getById(id) : await Customers.getById(id);
    const name = pickName(data);
    if (name) {
      nameCache.set(key, name);
      return name;
    }
    return null;
  } catch {
    return null;
  }
}

export default function ActivitiesPage() {
  const [rows, setRows] = useState<ActivityRow[]>([]);
  const [meta, setMeta] = useState<Meta>({
    page: 1,
    limit: 5,
    total: 0,
    totalPages: 1,
    sort: "createdAt",
    order: "DESC",
  });

  const [q, setQ] = useState("");

  // ✅ NEW: Filters state
  const [typeFilter, setTypeFilter] = useState<ActivityType | "ALL">("ALL");
  const [entityFilter, setEntityFilter] = useState<EntityFilter>("ALL");
  const [entityIdText, setEntityIdText] = useState(""); // only digits
  const [fromText, setFromText] = useState(""); // datetime-local
  const [toText, setToText] = useState(""); // datetime-local

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{
    open: boolean;
    msg: string;
    severity: "success" | "error";
  }>({ open: false, msg: "", severity: "success" });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Activity | null>(null);

  const entityId = useMemo(
    () => parsePositiveInt(entityIdText),
    [entityIdText]
  );

  const params = useMemo(() => {
    const p: any = {
      page: meta.page || 1,
      limit: meta.limit || 10,
      sort: meta.sort || "createdAt",
      order: meta.order || "DESC",
      q: q.trim() || undefined,
    };

    // ✅ NEW: Type filter
    if (typeFilter !== "ALL") p.type = typeFilter;

    // ✅ NEW: Entity XOR filter (leadId/customerId)
    if (entityFilter === "LEAD" && entityId) p.leadId = entityId;
    if (entityFilter === "CUSTOMER" && entityId) p.customerId = entityId;

    // ✅ NEW: Date range
    const fromIso = dtLocalToIso(fromText);
    const toIso = dtLocalToIso(toText);
    if (fromIso) p.from = fromIso;
    if (toIso) p.to = toIso;

    return p;
  }, [
    meta.page,
    meta.limit,
    meta.sort,
    meta.order,
    q,
    typeFilter,
    entityFilter,
    entityId,
    fromText,
    toText,
  ]);

  const load = async () => {
    setLoading(true);
    try {
      const resp = await Activities.list(params); // Paginated<ActivityDTO>

      // 1) DTO -> UI Activity map (type küçük harf)
      const base: ActivityRow[] = (resp.data ?? []).map((raw: ActivityDTO) => {
        const backendType = (raw.type ?? "NOTE") as ActivityType;

        const ui: Activity = {
          id: raw.id,
          type: toUiType(backendType),
          note: raw.note ?? null,
          when: raw.when ?? null,
          leadId: raw.leadId ?? raw.lead?.id ?? null,
          customerId: raw.customerId ?? raw.customer?.id ?? null,
          createdAt: raw.createdAt ?? null,
          updatedAt: raw.updatedAt ?? null,
          ownerId: raw.ownerId ?? raw.owner?.id ?? null,
          owner: raw.owner ?? null,
        };

        return ui;
      });

      // 2) İsim gerektiren benzersiz pair'leri çöz
      const need: Array<{ kind: "lead" | "customer"; id: number }> = [];
      for (const a of base) {
        if (a.leadId) need.push({ kind: "lead", id: a.leadId });
        if (a.customerId) need.push({ kind: "customer", id: a.customerId });
      }
      const uniq = Array.from(
        new Map(need.map((p) => [`${p.kind}:${p.id}`, p])).values()
      );
      await Promise.all(uniq.map(({ kind, id }) => resolveName(kind, id)));

      // 3) Satırlara relatedName ekle
      const withNames: ActivityRow[] = base.map((a) => {
        const key = a.leadId
          ? `lead:${a.leadId}`
          : a.customerId
          ? `customer:${a.customerId}`
          : "";
        const relatedName = key ? nameCache.get(key) : undefined;
        return { ...a, relatedName };
      });

      setRows(withNames);
      setMeta(resp.meta);
    } catch (e: any) {
      setToast({
        open: true,
        msg: e?.message || "Load error",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const handleAdd = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const handleEdit = (a: ActivityRow) => {
    // Dialog Activity bekliyor (relatedName'i atabiliriz)
    const { relatedName, ...rest } = a;
    setEditing(rest);
    setDialogOpen(true);
  };

  const handleDelete = async (a: ActivityRow) => {
    try {
      await Activities.remove(a.id);
      setToast({ open: true, msg: "Activity deleted", severity: "success" });
      await load();
    } catch (e: any) {
      setToast({
        open: true,
        msg: e?.message || "Delete error",
        severity: "error",
      });
    }
  };

  const handleSubmit = async (payload: Partial<Activity>) => {
    try {
      const body: any = {
        type: payload.type ? toBackendType(payload.type) : undefined,
        note: payload.note ?? undefined,
        when: payload.when ?? undefined, // ISO
      };

      if (payload.leadId) body.leadId = payload.leadId;
      if (payload.customerId) body.customerId = payload.customerId;

      if (payload.id) {
        await Activities.update(payload.id, body);
        setToast({ open: true, msg: "Activity updated", severity: "success" });
      } else {
        await Activities.create(body);
        setToast({ open: true, msg: "Activity created", severity: "success" });
      }

      if (payload.leadId) await resolveName("lead", payload.leadId);
      if (payload.customerId) await resolveName("customer", payload.customerId);

      setDialogOpen(false);
      await load();
    } catch (e: any) {
      setToast({
        open: true,
        msg: e?.message || "Save error",
        severity: "error",
      });
    }
  };

  const clearFilters = () => {
    setTypeFilter("ALL");
    setEntityFilter("ALL");
    setEntityIdText("");
    setFromText("");
    setToText("");
    setMeta((m) => ({ ...m, page: 1 }));
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3, position: "relative" }}>
      {loading && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            pointerEvents: "none",
          }}
        >
          <CircularProgress />
        </Box>
      )}

      {/* ✅ NEW: Filters bar */}
      <Paper sx={{ p: 2, mb: 2, borderRadius: 3 }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems={{ xs: "stretch", md: "center" }}
        >
          {/* Type */}
          <TextField
            select
            label="Type"
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value as ActivityType | "ALL");
              setMeta((m) => ({ ...m, page: 1 }));
            }}
            sx={{ minWidth: 190 }}
          >
            <MenuItem value="ALL">All</MenuItem>
            {(
              [
                "CALL",
                "EMAIL",
                "MEETING",
                "NOTE",
                "CONVERTED",
                "LOST",
                "STATUS_CHANGED",
              ] as const
            ).map((t) => (
              <MenuItem key={t} value={t}>
                {t}
              </MenuItem>
            ))}
          </TextField>

          {/* Entity */}
          <TextField
            select
            label="Entity"
            value={entityFilter}
            onChange={(e) => {
              const v = e.target.value as EntityFilter;
              setEntityFilter(v);
              if (v === "ALL") setEntityIdText("");
              setMeta((m) => ({ ...m, page: 1 }));
            }}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="ALL">All</MenuItem>
            <MenuItem value="LEAD">Lead</MenuItem>
            <MenuItem value="CUSTOMER">Customer</MenuItem>
          </TextField>

          {/* Entity ID */}
          <TextField
            label={
              entityFilter === "LEAD"
                ? "Lead ID"
                : entityFilter === "CUSTOMER"
                ? "Customer ID"
                : "Entity ID"
            }
            value={entityIdText}
            onChange={(e) => {
              // only digits
              setEntityIdText(e.target.value.replace(/[^\d]/g, ""));
              setMeta((m) => ({ ...m, page: 1 }));
            }}
            disabled={entityFilter === "ALL"}
            sx={{ width: 170 }}
            inputProps={{ inputMode: "numeric" }}
            helperText={
              entityFilter === "ALL"
                ? "Pick Lead/Customer"
                : "Enter positive number"
            }
          />

          {/* Date From */}
          <TextField
            label="From"
            type="datetime-local"
            value={fromText}
            onChange={(e) => {
              setFromText(e.target.value);
              setMeta((m) => ({ ...m, page: 1 }));
            }}
            InputLabelProps={{ shrink: true }}
            sx={{ width: 230 }}
          />

          {/* Date To */}
          <TextField
            label="To"
            type="datetime-local"
            value={toText}
            onChange={(e) => {
              setToText(e.target.value);
              setMeta((m) => ({ ...m, page: 1 }));
            }}
            InputLabelProps={{ shrink: true }}
            sx={{ width: 230 }}
          />

          <Button
            variant="outlined"
            onClick={clearFilters}
            sx={{ whiteSpace: "nowrap" }}
          >
            Clear
          </Button>
        </Stack>
      </Paper>

      <ActivityTable
        rows={rows}
        meta={meta}
        q={q}
        onChangeQ={(val) => {
          setQ(val);
          setMeta((m) => ({ ...m, page: 1 }));
        }}
        onPageChange={(p) => setMeta((m) => ({ ...m, page: p }))}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <ActivityFormDialog
        open={dialogOpen}
        initial={editing || undefined}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
      />

      <Snackbar
        open={toast.open}
        autoHideDuration={2500}
        onClose={() => setToast((s) => ({ ...s, open: false }))}
      >
        <Alert severity={toast.severity} variant="filled">
          {toast.msg}
        </Alert>
      </Snackbar>
    </Container>
  );
}
