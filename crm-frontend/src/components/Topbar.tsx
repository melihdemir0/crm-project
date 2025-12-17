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
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { drawerWidth } from "./Sidebar";
import BrandLogo from "./BrandLogo";

export default function Topbar() {
  const { email, role, logout } = useAuth();
  const navigate = useNavigate();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleOpen = (e: React.MouseEvent<HTMLElement>) =>
    setAnchorEl(e.currentTarget);

  const handleClose = () => setAnchorEl(null);

  const handleLogout = () => {
    logout();
    navigate("/login");
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
        <IconButton>
          <Badge color="error" variant="dot">
            <NotificationsNoneIcon />
          </Badge>
        </IconButton>

        <Chip
          onClick={handleOpen}
          avatar={
            <Avatar sx={{ bgcolor: "#0e2239", color: "#fff" }}>
              {(email?.[0] || "U").toUpperCase()}
            </Avatar>
          }
          label={role ? role.toUpperCase() : "USER"}
          sx={{ fontWeight: 600, cursor: "pointer" }}
          variant="outlined"
        />

        <Menu open={open} anchorEl={anchorEl} onClose={handleClose}>
          <MenuItem disabled>{email || "Unknown User"}</MenuItem>
          <MenuItem onClick={handleLogout}>Logout</MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
