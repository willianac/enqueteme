import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { SessionGuard } from '../auth/session.guard';
import { AiService } from './ai.service';
import { InspectPollBiasDto } from './dto/inspect-poll-bias.dto';
import { InspectPollBiasResponse } from './interfaces/bias-inspector.interface';
import { GeneratePollDto } from './dto/generate-poll.dto';
import { GeneratePollResponse } from './interfaces/generate-poll.interface';

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

  @Post('generate-poll')
  @UseGuards(SessionGuard)
  async generatePoll(
    @Body() body: GeneratePollDto,
  ): Promise<GeneratePollResponse> {
    return this.aiService.generatePoll(body.prompt, body.currentOptions);
  }
}

