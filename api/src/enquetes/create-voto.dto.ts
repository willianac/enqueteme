import { Allow } from 'class-validator';

export class CreateVotoDto {
  @Allow()
  pollId?: number;

  @Allow()
  optionId?: number;

  @Allow()
  userId?: number;
}
