import { ArrayMinSize, IsArray, IsInt, Max, Min } from 'class-validator';

export class CreateVotoDto {
  @IsInt()
  @Min(1)
  @Max(Number.MAX_SAFE_INTEGER)
  pollId!: number;

  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Max(Number.MAX_SAFE_INTEGER, { each: true })
  optionIds!: number[];
}
