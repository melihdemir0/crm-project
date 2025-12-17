import { useEffect, useMemo, useState } from "react";
import {
  Paper,
  Typography,
  TextField,
  Button,
  Stack,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Snackbar,
  Alert,
  Chip,
  Tooltip,
  Box,
  Pagination,
} from "@mui/material";
import { Leads } from "../lib/api";
import LeadCreateDialog from "../components/leads/LeadCreateDialog";
import ConvertLeadDialog from "../components/leads/ConvertLeadDialog";
import MarkLostDialog from "../components/leads/MarkLostDialog";
import ChangeStatusDialog from "../components/leads/ChangeStatusDialog";

type LeadStatus = "new" | "contacted" | "qualified" | "won" | "lost" | string;

interface Lead {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;

  status: LeadStatus;
  convertedAt?: string | null;
  customerId?: number | null;

  createdAt: string;
}

type Meta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  sort: string;
  order: "ASC" | "DESC";
};

function statusChip(status: string) {
  const s = (status || "").toLowerCase();
  if (s === "new") return <Chip size="small" label="NEW" />;
  if (s === "contacted") return <Chip size="small" label="CONTACTED" />;
  if (s === "qualified") return <Chip size="small" label="QUALIFIED" />;
  if (s === "won") return <Chip size="small" label="WON" />;
  if (s === "lost") return <Chip size="small" label="LOST" />;
  return <Chip size="small" label={status || "-"} />;
}

export default function LeadsPage() {
  const [search, setSearch] = useState("");
  const [list, setList] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ pagination meta (backend 1-based)
  const [meta, setMeta] = useState<Meta>({
    page: 1,
    limit: 5,
    total: 0,
    totalPages: 1,
    sort: "createdAt",
    order: "DESC",
  });

  const [openCreate, setOpenCreate] = useState(false);

  // dialogs
  const [selected, setSelected] = useState<Lead | null>(null);
  const [openConvert, setOpenConvert] = useState(false);
  const [openLost, setOpenLost] = useState(false);
  const [openStatus, setOpenStatus] = useState(false);

  const [actionLoading, setActionLoading] = useState(false);

  const [toast, setToast] = useState<{
    open: boolean;
    msg: string;
    severity: "success" | "error";
  }>({ open: false, msg: "", severity: "success" });

  // ✅ query params (backend q ile arayacak)
  const params = useMemo(() => {
    return {
      page: meta.page,
      limit: meta.limit,
      sort: meta.sort,
      order: meta.order,
      q: search.trim() || undefined,
    };
  }, [meta.page, meta.limit, meta.sort, meta.order, search]);

  async function load() {
    setLoading(true);
    try {
      const res: any = await Leads.list(params); // ✅ Paginated bekliyoruz
      const data = Array.isArray(res) ? res : res.data;
      const m = Array.isArray(res) ? null : (res.meta as Meta | undefined);

      setList(data || []);
      if (m) setMeta((prev) => ({ ...prev, ...m })); // meta backend’den gelsin
    } catch (e: any) {
      console.error("Lead fetch error:", e.message);
      setList([]);
      setToast({
        open: true,
        msg: e?.message || "Load error",
        severity: "error",
      });
    }
    setLoading(false);
  }

  // ✅ param değişince reload
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  // search değişince page 1’e dön (UI bozulmadan)
  useEffect(() => {
    setMeta((m) => ({ ...m, page: 1 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const openConvertFor = (lead: Lead) => {
    setSelected(lead);
    setOpenConvert(true);
  };

  const openLostFor = (lead: Lead) => {
    setSelected(lead);
    setOpenLost(true);
  };

  const openStatusFor = (lead: Lead) => {
    setSelected(lead);
    setOpenStatus(true);
  };

  const closeDialogs = () => {
    if (actionLoading) return;
    setOpenConvert(false);
    setOpenLost(false);
    setOpenStatus(false);
    setSelected(null);
  };

  const handleConvert = async () => {
    if (!selected) return;
    setActionLoading(true);
    try {
      await Leads.convert(selected.id);
      setToast({
        open: true,
        msg: "Converted to customer ✅",
        severity: "success",
      });
      closeDialogs();
      await load();
    } catch (e: any) {
      setToast({
        open: true,
        msg: e?.message || "Convert failed",
        severity: "error",
      });
      throw e;
    } finally {
      setActionLoading(false);
    }
  };

  const handleLost = async (reason?: string) => {
    if (!selected) return;
    setActionLoading(true);
    try {
      await Leads.lost(selected.id, reason);
      setToast({ open: true, msg: "Marked as LOST ✅", severity: "success" });
      closeDialogs();
      await load();
    } catch (e: any) {
      setToast({
        open: true,
        msg: e?.message || "Mark lost failed",
        severity: "error",
      });
      throw e;
    } finally {
      setActionLoading(false);
    }
  };

  const handleChangeStatus = async (status: any, note?: string) => {
    if (!selected) return;
    setActionLoading(true);
    try {
      await Leads.changeStatus(selected.id, status, note);
      setToast({ open: true, msg: "Status updated ✅", severity: "success" });
      closeDialogs();
      await load();
    } catch (e: any) {
      setToast({
        open: true,
        msg: e?.message || "Status update failed",
        severity: "error",
      });
      throw e;
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Stack spacing={3}>
      <Typography variant="h5" sx={{ fontWeight: 800, color: "#0e2239" }}>
        Leads
      </Typography>

      <Stack
        direction="row"
        spacing={2}
        sx={{ alignItems: "center", flexWrap: "wrap" }}
      >
        <TextField
          placeholder="Search"
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ width: 300, bgcolor: "#fff" }}
        />

        <Button
          variant="outlined"
          sx={{
            textTransform: "none",
            borderColor: "#d0d7e2",
            color: "#0e2239",
          }}
        >
          Filter
        </Button>

        <Button
          variant="contained"
          onClick={() => setOpenCreate(true)}
          sx={{
            bgcolor: "#e97732",
            "&:hover": { bgcolor: "#d96a28" },
            textTransform: "none",
            fontWeight: 700,
            borderRadius: 2,
          }}
        >
          Add New Lead
        </Button>
      </Stack>

      <Paper elevation={0} sx={{ borderRadius: 3 }}>
        <TableContainer>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: "#f8f9fc" }}>
                <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Email / Phone</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Created Date</TableCell>
                <TableCell sx={{ fontWeight: 700, width: 320 }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5}>Loading...</TableCell>
                </TableRow>
              ) : list.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>No leads found.</TableCell>
                </TableRow>
              ) : (
                list.map((lead) => {
                  const alreadyCustomer = lead.customerId != null;

                  const convertDisabled =
                    lead.status === "lost" || alreadyCustomer || actionLoading;
                  const lostDisabled =
                    lead.status === "lost" || alreadyCustomer || actionLoading;

                  // status change: converted lead kapalı (policy)
                  const statusDisabled = alreadyCustomer || actionLoading;

                  return (
                    <TableRow
                      key={lead.id}
                      sx={{
                        "&:hover": { bgcolor: "#f2f4f7" },
                        cursor: "default",
                      }}
                    >
                      <TableCell>{lead.name}</TableCell>

                      <TableCell>{lead.email || lead.phone || "-"}</TableCell>

                      <TableCell sx={{ fontWeight: 600 }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          {statusChip(lead.status)}
                          {alreadyCustomer ? (
                            <Chip size="small" label="CUSTOMER" />
                          ) : null}
                        </Stack>
                      </TableCell>

                      <TableCell>
                        {lead.createdAt
                          ? new Date(lead.createdAt).toLocaleDateString()
                          : "-"}
                      </TableCell>

                      <TableCell>
                        <Stack direction="row" spacing={1} flexWrap="wrap">
                          <Tooltip
                            title={
                              lead.status === "lost"
                                ? "LOST lead convert edilemez"
                                : alreadyCustomer
                                ? "Zaten customer’a dönüştürülmüş"
                                : ""
                            }
                          >
                            <span>
                              <Button
                                size="small"
                                variant="contained"
                                onClick={() => openConvertFor(lead)}
                                disabled={convertDisabled}
                              >
                                Convert
                              </Button>
                            </span>
                          </Tooltip>

                          <Tooltip
                            title={
                              lead.status === "lost"
                                ? "Zaten LOST"
                                : alreadyCustomer
                                ? "Zaten customer’a dönüştürülmüş"
                                : ""
                            }
                          >
                            <span>
                              <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                onClick={() => openLostFor(lead)}
                                disabled={lostDisabled}
                              >
                                Mark Lost
                              </Button>
                            </span>
                          </Tooltip>

                          <Tooltip
                            title={
                              alreadyCustomer
                                ? "Converted lead status değiştirilemez"
                                : ""
                            }
                          >
                            <span>
                              <Button
                                size="small"
                                variant="text"
                                onClick={() => openStatusFor(lead)}
                                disabled={statusDisabled}
                              >
                                Change Status
                              </Button>
                            </span>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* ✅ UI BOZMADAN: Pagination bar (Activities gibi) */}
        <Box sx={{ p: 2, display: "flex", justifyContent: "center" }}>
          <Pagination
            page={meta.page || 1}
            count={meta.totalPages || 1}
            onChange={(_, p) => setMeta((m) => ({ ...m, page: p }))}
            showFirstButton
            showLastButton
          />
        </Box>
      </Paper>

      {/* ✅ Create dialog */}
      <LeadCreateDialog
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        onSubmit={async (payload) => {
          await Leads.create(payload);
          setToast({ open: true, msg: "Lead created", severity: "success" });
          setOpenCreate(false);
          setMeta((m) => ({ ...m, page: 1 }));
          await load();
        }}
      />

      {/* ✅ Convert dialog */}
      <ConvertLeadDialog
        open={openConvert}
        leadName={selected?.name}
        saving={actionLoading}
        onClose={closeDialogs}
        onConfirm={handleConvert}
      />

      {/* ✅ Lost dialog */}
      <MarkLostDialog
        open={openLost}
        leadName={selected?.name}
        saving={actionLoading}
        onClose={closeDialogs}
        onConfirm={handleLost}
      />

      {/* ✅ Change Status dialog */}
      <ChangeStatusDialog
        open={openStatus}
        leadName={selected?.name}
        currentStatus={selected?.status}
        saving={actionLoading}
        onClose={closeDialogs}
        onConfirm={handleChangeStatus}
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
    </Stack>
  );
}
