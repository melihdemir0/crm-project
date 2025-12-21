import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type ChatMsg = { role: 'system' | 'user' | 'assistant'; content: string };
type ChatBody = { messages: ChatMsg[] };

@Injectable()
export class AiService {
  constructor(private readonly config: ConfigService) {}

  async chat(body: ChatBody, user: any) {
    const messages = body?.messages ?? [];
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');

    if (!lastUser?.content?.trim()) {
      throw new BadRequestException('messages içinde user mesajı gerekli');
    }

    const webhookUrl = this.config.get<string>('N8N_WEBHOOK_URL');
    if (!webhookUrl) {
      throw new InternalServerErrorException('N8N_WEBHOOK_URL missing');
    }

    const payload = {
      question: lastUser.content,
      messages: messages.slice(-20),
      user: {
        id: user?.sub ?? user?.id,
        email: user?.email,
        role: user?.role,
      },
      now: new Date().toISOString(),
    };

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new InternalServerErrorException(
        text || `n8n error: ${res.status}`,
      );
    }

    const data = await res.json().catch(() => ({}));
    return { reply: data?.reply ?? 'n8n reply missing' };
  }
}
