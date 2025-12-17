import { Box, Typography } from "@mui/material";
import logo256 from "../assets/crm-logo-256.png";

type Props = {
  size?: number; // px
  showText?: boolean;
  text?: string;
};

export default function BrandLogo({
  size = 60,
  showText = true,
  text = "CRM",
}: Props) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, minWidth: 0 }}>
      <Box
        component="img"
        src={logo256}
        alt="CRM Logo"
        sx={{ width: size, height: size, objectFit: "contain" }}
      />
      {showText && (
        <Typography
          sx={{
            fontWeight: 900,
            color: "#0e2239",
            letterSpacing: 0.2,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {text}
        </Typography>
      )}
    </Box>
  );
}
