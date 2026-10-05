import { ArrayMinSize, IsArray, IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class ExplainPollDebateDto {
  @IsInt()
  @Min(1)
  pollId!: number;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsArray()
  @ArrayMinSize(2)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  options!: string[];
}
