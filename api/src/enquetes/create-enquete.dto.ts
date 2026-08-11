import { Allow } from 'class-validator';

export class CreateEnqueteDto {
  @Allow()
  title?: string;

  @Allow()
  options?: string[];

  @Allow()
  voteRequireLogin?: boolean;

  @Allow()
  pollExpirationInDays?: number;

  @Allow()
  userId?: number;
}
