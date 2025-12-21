import { useEffect, useMemo, useRef, useState } from "react";
import {
  Drawer,
  Box,
  Stack,
  Typography,
  IconButton,
  TextField,
  Button,
  Divider,
  Paper,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SendIcon from "@mui/icons-material/Send";
import { Ai } from "../../lib/api";

type ChatMsg = { role: "user" | "assistant"; content: string };

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function ChatDrawer({ open, onClose }: Props) {
  const [items, setItems] = useState<ChatMsg[]>([
    {
      role: "assistant",
      content: "Moruk selam! CRM bot online. Ne soruyorsun?",
    },
  ]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  const canSend = useMemo(
    () => text.trim().length > 0 && !loading,
    [text, loading]
  );

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [items, open]);

  async function send() {
    if (!canSend) return;

    const content = text.trim();
    setText("");
    setLoading(true);

    // 1) UI’ya user mesajını bas
    setItems((prev) => [...prev, { role: "user", content }]);

    try {
      // 2) Backend’e gönder (backend shape: messages[] role user/assistant)
      const messagesForApi = [
        // istersen system mesajı burada eklersin
        ...(items.map((m) => ({ role: m.role, content: m.content })) as any),
        { role: "user" as const, content },
      ];

      const res = await Ai.chat(messagesForApi);

      // 3) Bot cevabını bas
      setItems((prev) => [...prev, { role: "assistant", content: res.reply }]);
    } catch (e: any) {
      setItems((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Hata: ${e?.message ?? "Bilinmeyen hata"}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box
        sx={{
          width: { xs: 340, sm: 420 },
          height: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ px: 2, py: 1.5 }}
        >
          <Stack>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              CRM Chatbot
            </Typography>
            <Typography variant="caption" color="text.secondary">
              /ai/chat (v1)
            </Typography>
          </Stack>

          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Stack>

        <Divider />

        {/* Messages */}
        <Box sx={{ flex: 1, overflow: "auto", p: 2 }}>
          <Stack spacing={1.25}>
            {items.map((m, idx) => (
              <Stack
                key={idx}
                direction="row"
                justifyContent={m.role === "user" ? "flex-end" : "flex-start"}
              >
                <Paper
                  variant="outlined"
                  sx={{
                    maxWidth: "85%",
                    p: 1.25,
                    borderRadius: 2,
                  }}
                >
                  <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                    {m.content}
                  </Typography>
                </Paper>
              </Stack>
            ))}

            {loading && (
              <Stack direction="row" spacing={1} alignItems="center">
                <CircularProgress size={16} />
                <Typography variant="caption" color="text.secondary">
                  Bot yazıyor...
                </Typography>
              </Stack>
            )}

            <div ref={endRef} />
          </Stack>
        </Box>

        <Divider />

        {/* Input */}
        <Box sx={{ p: 2 }}>
          <Stack direction="row" spacing={1}>
            <TextField
              fullWidth
              size="small"
              placeholder="Mesaj yaz..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              multiline
              maxRows={3}
            />
            <Button
              variant="contained"
              disabled={!canSend}
              onClick={send}
              endIcon={<SendIcon />}
              sx={{ borderRadius: 2 }}
            >
              Gönder
            </Button>
          </Stack>
        </Box>
      </Box>
    </Drawer>
  );
}
