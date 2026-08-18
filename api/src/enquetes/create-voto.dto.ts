import { IsInt, Max, Min } from 'class-validator';

export class CreateVotoDto {
  @IsInt()
  @Min(1)
  @Max(Number.MAX_SAFE_INTEGER)
  pollId!: number;

  @IsInt()
  @Min(1)
  @Max(Number.MAX_SAFE_INTEGER)
  optionId!: number;
}
