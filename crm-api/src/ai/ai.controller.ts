import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AiService } from './ai.service';

type ChatMsg = { role: 'system' | 'user' | 'assistant'; content: string };
type ChatBody = { messages: ChatMsg[] };

@ApiTags('AI')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'ai', version: '1' })
export class AiController {
  constructor(private readonly ai: AiService) {}

  @Post('chat')
  async chat(@Req() req: any, @Body() body: ChatBody) {
    return this.ai.chat(body, req.user);
  }
}
