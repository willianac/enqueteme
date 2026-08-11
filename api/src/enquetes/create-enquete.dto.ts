import { Transform } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

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

  @IsInt()
  @Min(1)
  userId!: number;
}
