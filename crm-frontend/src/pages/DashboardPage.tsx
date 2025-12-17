// src/pages/DashboardPage.tsx
import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Container,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Toolbar,
  Typography,
  Button,
  Paper,
  CircularProgress,
  Stack,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import Grid from "@mui/material/Grid"; // v6 Grid (size prop destekli)
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd";
import ScheduleIcon from "@mui/icons-material/Schedule";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { useNavigate } from "react-router-dom";

import { Activities, Customers, Leads, Users } from "../lib/api";
import type { Paginated } from "../lib/api";
import type { Activity } from "../types/activity";

// ⬇️ Recharts - Leads vs Customers (Totals)
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

// --- küçük stat kartı
function StatCard({
  title,
  value,
  subtitle,
  icon,
  onClick,
}: {
  title: string;
  value: number | string;
  subtitle?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <Card
      onClick={onClick}
      sx={{
        borderRadius: 3,
        cursor: onClick ? "pointer" : "default",
        "&:hover": onClick
          ? { boxShadow: 6, transform: "translateY(-1px)" }
          : undefined,
        transition: "all .15s ease",
      }}
      elevation={3}
    >
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={2}>
          {icon && <div>{icon}</div>}
          <Stack spacing={0.5}>
            <Typography variant="subtitle2" color="text.secondary">
              {title}
            </Typography>
            <Typography
              variant="h4"
              sx={{ mt: 1, fontWeight: 800, color: "#0e2239" }}
            >
              {value}
            </Typography>
            {subtitle && (
              <Typography
                variant="body2"
                sx={{ mt: 0.5 }}
                color="text.secondary"
              >
                {subtitle}
              </Typography>
            )}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

// --- helpers ---
type Meta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  sort: string;
  order: "ASC" | "DESC";
};

function buildQuery(params: Partial<Meta> & { q?: string }) {
  const p = new URLSearchParams();
  p.set("page", String(params.page ?? 1));
  p.set("limit", String(params.limit ?? 5));
  p.set("sort", String(params.sort ?? "createdAt"));
  p.set("order", String(params.order ?? "DESC"));
  if (params.q?.trim()) p.set("q", params.q.trim());
  return `?${p.toString()}`;
}

function isPaginated<T = any>(resp: any): resp is Paginated<T> {
  return resp && typeof resp === "object" && "data" in resp && "meta" in resp;
}

function formatDateTR(iso?: string | null) {
  if (!iso) return "-";
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

// isim alanını akıllı seç
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

type LeadLite = { id: number; name: string | null; createdAt?: string };
type CustomerLite = { id: number; name: string | null; createdAt?: string };
type ActivityRow = Activity & { relatedText?: string };

export default function DashboardPage() {
  const nav = useNavigate();

  // totals
  const [totalLeads, setTotalLeads] = useState<number>(0);
  const [totalCustomers, setTotalCustomers] = useState<number>(0);
  const [totalActivities, setTotalActivities] = useState<number>(0);
  const [totalUsers, setTotalUsers] = useState<number>(0);

  // recents
  const [recentLeads, setRecentLeads] = useState<LeadLite[]>([]);
  const [recentCustomers, setRecentCustomers] = useState<CustomerLite[]>([]);
  const [recentActivities, setRecentActivities] = useState<ActivityRow[]>([]);

  const [loading, setLoading] = useState(false);

  // 1 kayıt çekip total meta.total okumak için
  const totalsQuery = useMemo(
    () => buildQuery({ page: 1, limit: 1, sort: "createdAt", order: "DESC" }),
    []
  );

  // recents için 5 kayıt
  const recentsQuery = useMemo(
    () => buildQuery({ page: 1, limit: 5, sort: "createdAt", order: "DESC" }),
    []
  );

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // ✅ list fonksiyonlarına artık TEK parametre gönderiyoruz (query string)
        const [leadResp, custResp, actResp, userResp] = await Promise.all([
          Leads.list(totalsQuery),
          Customers.list(totalsQuery),
          Activities.list({
            page: 1,
            limit: 1,
            sort: "createdAt",
            order: "DESC",
          }),
          Users?.list ? Users.list(totalsQuery) : Promise.resolve<any[]>([]),
        ]);

        const leadTotal = isPaginated(leadResp)
          ? Number(leadResp.meta?.total ?? 0)
          : Array.isArray(leadResp)
          ? leadResp.length
          : 0;

        const custTotal = isPaginated(custResp)
          ? Number(custResp.meta?.total ?? 0)
          : Array.isArray(custResp)
          ? custResp.length
          : 0;

        const actTotal = isPaginated(actResp)
          ? Number(actResp.meta?.total ?? 0)
          : Array.isArray(actResp)
          ? (actResp as any[]).length
          : 0;

        const userTotal = isPaginated(userResp)
          ? Number(userResp.meta?.total ?? 0)
          : Array.isArray(userResp)
          ? userResp.length
          : 0;

        setTotalLeads(leadTotal);
        setTotalCustomers(custTotal);
        setTotalActivities(actTotal);
        setTotalUsers(userTotal);

        // --- recents
        const [leadList, custList, actList] = await Promise.all([
          Leads.list(recentsQuery),
          Customers.list(recentsQuery),
          Activities.list({
            page: 1,
            limit: 5,
            sort: "createdAt",
            order: "DESC",
          }),
        ]);

        const leadsArr = isPaginated<any>(leadList)
          ? leadList.data
          : Array.isArray(leadList)
          ? leadList
          : [];
        const customersArr = isPaginated<any>(custList)
          ? custList.data
          : Array.isArray(custList)
          ? custList
          : [];
        const activitiesArr = isPaginated<any>(actList)
          ? actList.data
          : Array.isArray(actList)
          ? actList
          : [];

        setRecentLeads(
          (leadsArr as any[]).map((l) => ({
            id: l.id,
            name: pickName(l),
            createdAt: l.createdAt,
          }))
        );

        setRecentCustomers(
          (customersArr as any[]).map((c) => ({
            id: c.id,
            name: pickName(c),
            createdAt: c.createdAt,
          }))
        );

        setRecentActivities(
          (activitiesArr as any[]).map((a) => {
            const leadId = a.leadId ?? a.lead_id ?? a.lead?.id ?? null;
            const customerId =
              a.customerId ?? a.customer_id ?? a.customer?.id ?? null;
            const relText = leadId
              ? `Lead #${leadId}`
              : customerId
              ? `Customer #${customerId}`
              : "-";
            const typeUi = String(a.type || "call").toLowerCase();
            return {
              id: a.id,
              type: typeUi,
              note: a.note ?? null,
              when: a.when ?? null,
              leadId,
              customerId,
              createdAt: a.createdAt,
              updatedAt: a.updatedAt,
              relatedText: relText,
            } as ActivityRow;
          })
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [totalsQuery, recentsQuery]);

  // ⬇️ Leads vs Customers (Totals) grafiği için veri
  const totalsChartData = useMemo(
    () => [
      { label: "Leads", count: totalLeads },
      { label: "Customers", count: totalCustomers },
    ],
    [totalLeads, totalCustomers]
  );

  return (
    <Container maxWidth="xl" sx={{ py: 3, position: "relative" }}>
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

      {/* Üst başlık + quick actions */}
      <Toolbar disableGutters sx={{ mb: 2, gap: 1.5, flexWrap: "wrap" }}>
        <Typography variant="h5" sx={{ fontWeight: 800, flex: "1 1 auto" }}>
          Dashboard
        </Typography>
        <Button
          variant="outlined"
          onClick={() => nav("/leads")}
          endIcon={<ArrowForwardIcon />}
        >
          Go to Leads
        </Button>
        <Button
          variant="outlined"
          onClick={() => nav("/customers")}
          endIcon={<ArrowForwardIcon />}
        >
          Go to Customers
        </Button>
        <Button
          variant="outlined"
          onClick={() => nav("/activities")}
          endIcon={<ArrowForwardIcon />}
        >
          Go to Activities
        </Button>
      </Toolbar>

      {/* Üst metrik kartları */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 3 }}>
          <StatCard
            title="Total Leads"
            value={totalLeads}
            subtitle="All time"
            icon={<AssignmentIndIcon />}
            onClick={() => nav("/leads")}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <StatCard
            title="Total Customers"
            value={totalCustomers}
            subtitle="All time"
            icon={<PeopleAltIcon />}
            onClick={() => nav("/customers")}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <StatCard
            title="Activities Logged"
            value={totalActivities}
            subtitle="All time"
            icon={<ScheduleIcon />}
            onClick={() => nav("/activities")}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <StatCard
            title="Users"
            value={totalUsers}
            subtitle="Team size"
            icon={<AdminPanelSettingsIcon />}
            onClick={() => nav("/users")}
          />
        </Grid>
      </Grid>

      {/* Chart + Recent Activities */}
      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardHeader
              title="Sales Pipeline Overview"
              subheader="Leads vs Customers (total count)"
            />
            <CardContent>
              <Box sx={{ width: "100%", height: 260 }}>
                <ResponsiveContainer>
                  <BarChart
                    data={totalsChartData}
                    margin={{ top: 16, right: 24, left: 0, bottom: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#0e2239" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardHeader title="Recent Activities" />
            <CardContent sx={{ pt: 0 }}>
              <List dense>
                {recentActivities.slice(0, 5).map((a) => (
                  <Box key={a.id}>
                    <ListItem>
                      <ListItemIcon>
                        <ScheduleIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary={a.note || "-"}
                        secondary={`${a.type} • ${a.relatedText || "-"}`}
                      />
                    </ListItem>
                    <Divider />
                  </Box>
                ))}
                {recentActivities.length === 0 && (
                  <ListItem>
                    <ListItemText primary="No activities" />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Altta son eklenen tablolar (3 sütun) */}
      <Grid container spacing={2} sx={{ mt: 1 }}>
        {/* Recent Leads */}
        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardHeader
              title="Recent Leads"
              action={
                <Button onClick={() => nav("/leads")} size="small">
                  View
                </Button>
              }
            />
            <CardContent sx={{ pt: 0 }}>
              <TableContainer
                component={Paper}
                variant="outlined"
                sx={{ borderRadius: 2 }}
              >
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell width={64}>ID</TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell>Created</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentLeads.map((l) => (
                      <TableRow key={l.id} hover>
                        <TableCell>#{l.id}</TableCell>
                        <TableCell>{l.name || "-"}</TableCell>
                        <TableCell>{formatDateTR(l.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                    {recentLeads.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={3}
                          align="center"
                          sx={{ color: "text.secondary" }}
                        >
                          No leads
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Customers */}
        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardHeader
              title="Recent Customers"
              action={
                <Button onClick={() => nav("/customers")} size="small">
                  View
                </Button>
              }
            />
            <CardContent sx={{ pt: 0 }}>
              <TableContainer
                component={Paper}
                variant="outlined"
                sx={{ borderRadius: 2 }}
              >
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell width={64}>ID</TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell>Created</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentCustomers.map((c) => (
                      <TableRow key={c.id} hover>
                        <TableCell>#{c.id}</TableCell>
                        <TableCell>{c.name || "-"}</TableCell>
                        <TableCell>{formatDateTR(c.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                    {recentCustomers.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={3}
                          align="center"
                          sx={{ color: "text.secondary" }}
                        >
                          No customers
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activities (tablo halinde) */}
        <Grid size={{ xs: 12, md: 12, lg: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardHeader
              title="Recent Activities (Table)"
              action={
                <Button onClick={() => nav("/activities")} size="small">
                  View
                </Button>
              }
            />
            <CardContent sx={{ pt: 0 }}>
              <TableContainer
                component={Paper}
                variant="outlined"
                sx={{ borderRadius: 2 }}
              >
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell width={64}>ID</TableCell>
                      <TableCell>Subject</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Related</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentActivities.map((a) => (
                      <TableRow key={a.id} hover>
                        <TableCell>#{a.id}</TableCell>
                        <TableCell>
                          <Box
                            sx={{
                              maxWidth: 220,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                            title={a.note || ""}
                          >
                            {a.note || "-"}
                          </Box>
                        </TableCell>
                        <TableCell sx={{ textTransform: "capitalize" }}>
                          {a.type}
                        </TableCell>
                        <TableCell>{a.relatedText || "-"}</TableCell>
                      </TableRow>
                    ))}
                    {recentActivities.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          align="center"
                          sx={{ color: "text.secondary" }}
                        >
                          No activities
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}
