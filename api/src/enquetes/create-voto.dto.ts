import { IsInt, IsOptional, Min } from 'class-validator';

export class CreateVotoDto {
  @IsInt()
  @Min(1)
  pollId!: number;

  @IsInt()
  @Min(1)
  optionId!: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  userId?: number;
}
