import {
  AppBar,
  Toolbar,
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Avatar,
  Chip,
  Badge,
  Menu,
  MenuItem,
  ListItemText,
  Divider,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import ChatIcon from "@mui/icons-material/Chat";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { drawerWidth } from "./Sidebar";
import BrandLogo from "./BrandLogo";
import { useNotifications } from "../context/NotificationsContext";
import ChatDrawer from "./chat/ChatDrawer";

export default function Topbar() {
  const { email, role, logout } = useAuth();
  const { items, unread, markAllRead, clear } = useNotifications();
  const navigate = useNavigate();

  // user menu
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const userMenuOpen = Boolean(anchorEl);

  // notifications menu
  const [notifAnchor, setNotifAnchor] = useState<null | HTMLElement>(null);
  const notifOpen = Boolean(notifAnchor);

  const handleUserOpen = (e: React.MouseEvent<HTMLElement>) =>
    setAnchorEl(e.currentTarget);
  const handleUserClose = () => setAnchorEl(null);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const canSeeNotifs = role === "admin";
  const topNotifs = useMemo(() => items.slice(0, 10), [items]);

  const [chatOpen, setChatOpen] = useState(false);

  // ✅ bildirime tıklayınca Lead sayfasına git + action'a göre dialog açtır
  const handleNotifClick = (n: any) => {
    setNotifAnchor(null);

    if (n?.entity === "lead" && n?.entityId) {
      const t = String(n?.type || "").toUpperCase();
      const action =
        t === "LEAD_CONVERTED"
          ? "convert"
          : t === "LEAD_LOST"
          ? "lost"
          : t === "LEAD_STATUS_CHANGED"
          ? "status"
          : "status"; // default

      navigate(`/leads?id=${n.entityId}&action=${action}`);
      return;
    }

    navigate("/leads");
  };

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        left: drawerWidth,
        width: `calc(100% - ${drawerWidth}px)`,
        backgroundColor: "#fff",
        color: "#0e2239",
        borderBottom: "1px solid #eef2f6",
        zIndex: (t) => t.zIndex.drawer + 1,
      }}
    >
      <Toolbar sx={{ gap: 2, minHeight: 64 }}>
        <Box sx={{ flex: 1 }}>
          <TextField
            size="small"
            fullWidth
            placeholder="Search"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <BrandLogo size={100} showText={false} />

        {/* 🔔 Notifications */}
        <IconButton
          onClick={(e) => {
            setNotifAnchor(e.currentTarget);
            if (canSeeNotifs) markAllRead();
          }}
          disabled={!canSeeNotifs}
          aria-label="notifications"
        >
          <Badge
            color="error"
            badgeContent={canSeeNotifs ? unread : 0}
            invisible={!canSeeNotifs || unread <= 0}
          >
            <NotificationsNoneIcon />
          </Badge>
        </IconButton>

        <IconButton onClick={() => setChatOpen(true)}>
          <ChatIcon />
        </IconButton>
        <ChatDrawer open={chatOpen} onClose={() => setChatOpen(false)} />
        <Menu
          open={notifOpen}
          anchorEl={notifAnchor}
          onClose={() => setNotifAnchor(null)}
          PaperProps={{ sx: { width: 360, maxWidth: "90vw" } }}
        >
          <Box sx={{ px: 2, py: 1.25 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography sx={{ fontWeight: 700 }}>Notifications</Typography>
              <Box sx={{ flex: 1 }} />
              <Typography
                sx={{
                  cursor: "pointer",
                  fontSize: 12,
                  color: "#0e2239",
                  opacity: 0.8,
                  "&:hover": { opacity: 1 },
                }}
                onClick={() => clear()}
              >
                Clear
              </Typography>
            </Box>
            <Typography
              sx={{ fontSize: 12, color: "text.secondary", mt: 0.25 }}
            >
              Admin-only realtime events
            </Typography>
          </Box>

          <Divider />

          {topNotifs.length === 0 ? (
            <MenuItem disabled>No notifications yet</MenuItem>
          ) : (
            topNotifs.map((n, i) => (
              <MenuItem
                key={`${n.at}-${i}`}
                sx={{ whiteSpace: "normal" }}
                onClick={() => handleNotifClick(n)}
              >
                <ListItemText
                  primary={n.message ?? n.type}
                  secondary={`${n.actor.email} • ${new Date(
                    n.at
                  ).toLocaleString()}`}
                />
              </MenuItem>
            ))
          )}
        </Menu>

        {/* User chip */}
        <Chip
          onClick={handleUserOpen}
          avatar={
            <Avatar sx={{ bgcolor: "#0e2239", color: "#fff" }}>
              {(email?.[0] || "U").toUpperCase()}
            </Avatar>
          }
          label={role ? role.toUpperCase() : "USER"}
          sx={{ fontWeight: 600, cursor: "pointer" }}
          variant="outlined"
        />

        <Menu open={userMenuOpen} anchorEl={anchorEl} onClose={handleUserClose}>
          <MenuItem disabled>{email || "Unknown User"}</MenuItem>
          <MenuItem onClick={handleLogout}>Logout</MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
