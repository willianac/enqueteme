import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CheckDuplicateQueryDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  title!: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return undefined;
    if (Array.isArray(value)) {
      const arr = value
        .map((option) => (typeof option === 'string' ? option.trim() : String(option).trim()))
        .filter(Boolean);
      return arr.length > 0 ? arr : undefined;
    }
    if (typeof value === 'string') {
      const arr = value
        .split(',')
        .map((option) => option.trim())
        .filter(Boolean);
      return arr.length > 0 ? arr : undefined;
    }
    return undefined;
  })
  options?: string[];
}
