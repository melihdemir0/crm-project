import {
  Box,
  Paper,
  Stack,
  Toolbar,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Pagination,
  IconButton,
  Tooltip,
  Chip,
} from "@mui/material";
import { Edit, Trash2 } from "lucide-react";
import type { Activity } from "../../types/activity";

type Meta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  sort: string;
  order: "ASC" | "DESC";
};

export type ActivityRow = Activity & { relatedName?: string };

type Props = {
  rows: ActivityRow[];
  meta: Meta;
  q: string;
  onChangeQ: (v: string) => void;
  onPageChange: (p: number) => void;
  onAdd: () => void;
  onEdit: (a: ActivityRow) => void;
  onDelete: (a: ActivityRow) => void;
};

function fmtDateTime(iso?: string | null) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  // date + time (local)
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

function labelType(t?: string | null) {
  if (!t) return "note";
  return t.replaceAll("_", " ").toLowerCase();
}

export default function ActivityTable({
  rows,
  meta,
  q,
  onChangeQ,
  onPageChange,
  onAdd,
  onEdit,
  onDelete,
}: Props) {
  return (
    <Stack spacing={2}>
      <Typography variant="h5" sx={{ fontWeight: 700 }}>
        Activities
      </Typography>

      <Toolbar
        disableGutters
        sx={{ p: 0, gap: 1.5, flexWrap: "wrap", alignItems: "center" }}
      >
        <TextField
          label="Search"
          value={q}
          onChange={(e) => onChangeQ(e.target.value)}
          placeholder="Search in note..."
          size="small"
          sx={{
            flex: "1 1 420px",
            "& .MuiOutlinedInput-root": { borderRadius: 2 },
          }}
        />

        <Button
          variant="contained"
          onClick={onAdd}
          sx={{ borderRadius: 2, fontWeight: 600, whiteSpace: "nowrap" }}
        >
          Log Activity
        </Button>
      </Toolbar>

      <Paper
        sx={{
          overflow: "hidden",
          borderRadius: 2,
          boxShadow: "0 2px 6px rgba(0,0,0,0.06), 0 10px 20px rgba(0,0,0,0.05)",
        }}
      >
        <TableContainer sx={{ maxHeight: 560 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow
                sx={{
                  "& th": {
                    bgcolor: "grey.100",
                    color: "text.secondary",
                    fontWeight: 600,
                    fontSize: 13,
                  },
                }}
              >
                <TableCell width={56}>ID</TableCell>
                <TableCell>Note</TableCell>
                <TableCell width={160}>Type</TableCell>
                <TableCell width={160}>Related</TableCell>
                <TableCell width={220}>Related Name</TableCell>
                <TableCell width={170}>When</TableCell>
                <TableCell width={170}>Created</TableCell>
                <TableCell width={220}>Owner</TableCell>
                <TableCell align="right" width={140}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {rows.map((a) => {
                const isLead = !!a.leadId;
                const isCustomer = !!a.customerId;

                const relatedLabel = isLead
                  ? `Lead #${a.leadId}`
                  : isCustomer
                  ? `Customer #${a.customerId}`
                  : "-";

                return (
                  <TableRow hover key={a.id}>
                    <TableCell>{a.id}</TableCell>

                    <TableCell sx={{ maxWidth: 360 }}>
                      <Box
                        component="span"
                        sx={{
                          display: "inline-block",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          maxWidth: 360,
                        }}
                        title={a.note || ""}
                      >
                        {a.note || "-"}
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Chip
                        size="small"
                        label={labelType(a.type)}
                        sx={{ textTransform: "capitalize" }}
                      />
                    </TableCell>

                    <TableCell>{relatedLabel}</TableCell>

                    <TableCell>
                      <Box
                        component="span"
                        sx={{
                          display: "inline-block",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          maxWidth: 200,
                        }}
                        title={a.relatedName || ""}
                      >
                        {a.relatedName || "-"}
                      </Box>
                    </TableCell>

                    <TableCell>{fmtDateTime(a.when)}</TableCell>
                    <TableCell>{fmtDateTime(a.createdAt)}</TableCell>

                    <TableCell>
                      {a.owner?.email ? (
                        <Box
                          component="span"
                          sx={{
                            display: "inline-block",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            maxWidth: 200,
                          }}
                          title={a.owner.email}
                        >
                          {a.owner.email}
                        </Box>
                      ) : a.ownerId ? (
                        <Box
                          component="span"
                          sx={{
                            display: "inline-block",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            maxWidth: 200,
                          }}
                          title={`User #${a.ownerId}`}
                        >
                          {`User #${a.ownerId}`}
                        </Box>
                      ) : (
                        "-"
                      )}
                    </TableCell>

                    <TableCell align="right">
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => onEdit(a)}>
                          <Edit size={18} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => onDelete(a)}
                        >
                          <Trash2 size={18} />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}

              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9}>
                    <Box
                      sx={{
                        p: 4,
                        textAlign: "center",
                        color: "text.secondary",
                      }}
                    >
                      No activities
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ p: 2, display: "flex", justifyContent: "center" }}>
          <Pagination
            page={meta.page || 1}
            count={meta.totalPages || 1}
            onChange={(_, p) => onPageChange(p)}
            showFirstButton
            showLastButton
          />
        </Box>
      </Paper>
    </Stack>
  );
}
