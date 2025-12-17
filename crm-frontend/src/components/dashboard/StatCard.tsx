import { Card, CardContent, Stack, Typography } from "@mui/material";

type Props = {
  title: string;
  value: number | string;
  subtitle?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
};

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  onClick,
}: Props) {
  return (
    <Card
      onClick={onClick}
      sx={{
        borderRadius: 2,
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
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              {title}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                {subtitle}
              </Typography>
            )}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
