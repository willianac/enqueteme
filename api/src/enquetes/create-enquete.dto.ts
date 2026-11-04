import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import {
  normalizeTags,
  POLL_CATEGORIES,
  PollCategory,
} from './poll-categories';

export class CreateEnqueteDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  title!: string;

  @Transform(({ value }) =>
    Array.isArray(value)
      ? value.map((option) =>
          typeof option === 'string' ? option.trim() : option,
        )
      : value,
  )
  @IsArray()
  @ArrayMinSize(2)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  options!: string[];

  @IsOptional()
  @IsBoolean()
  voteRequireLogin?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  pollExpirationInDays?: number;

  @IsOptional()
  @IsBoolean()
  allowMultiple?: boolean;

  @IsOptional()
  @IsInt()
  @Min(2)
  maxChoices?: number;

  @IsOptional()
  @IsString()
  @IsIn(POLL_CATEGORIES)
  category?: PollCategory;

  @IsOptional()
  @Transform(({ value }) =>
    Array.isArray(value) && value.every((item) => typeof item === 'string')
      ? normalizeTags(value)
      : value,
  )
  @IsArray()
  @ArrayMaxSize(5)
  @IsString({ each: true })
  @MinLength(2, { each: true })
  @MaxLength(24, { each: true })
  tags?: string[];
}
