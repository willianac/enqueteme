import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { SessionGuard } from '../auth/session.guard';
import { AiService } from './ai.service';
import { InspectPollBiasDto } from './dto/inspect-poll-bias.dto';
import { InspectPollBiasResponse } from './interfaces/bias-inspector.interface';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('inspect-bias')
  @UseGuards(SessionGuard)
  async inspectPollBias(
    @Body() body: InspectPollBiasDto,
  ): Promise<InspectPollBiasResponse> {
    return this.aiService.inspectPollBias(body.title, body.options);
  }
}
