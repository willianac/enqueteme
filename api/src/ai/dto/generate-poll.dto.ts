import {
  ArrayMaxSize,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class GeneratePollDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(300)
  prompt: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  currentOptions?: string[];
}
