import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import {
  normalizeTag,
  POLL_CATEGORIES,
  POLL_SORT_OPTIONS,
  PollCategory,
  PollSortOption,
} from './poll-categories';

export class FindEnquetesQueryDto {
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return 1;
    }
    const parsed =
      typeof value === 'number' ? value : parseInt(String(value), 10);
    return Number.isNaN(parsed) ? 1 : Math.max(1, parsed);
  })
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return 10;
    }
    const parsed =
      typeof value === 'number' ? value : parseInt(String(value), 10);
    return Number.isNaN(parsed) ? 10 : Math.min(50, Math.max(1, parsed));
  })
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' && value.trim() === '' ? undefined : value,
  )
  @IsString()
  @IsIn(POLL_CATEGORIES)
  category?: PollCategory;

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value !== 'string') {
      return value;
    }
    const normalized = normalizeTag(value);
    return normalized || undefined;
  })
  @IsString()
  tag?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value !== 'string') {
      return value;
    }
    const trimmed = value.trim();
    return trimmed || undefined;
  })
  @IsString()
  search?: string;

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' && value.trim() === '' ? undefined : value,
  )
  @IsString()
  @IsIn(POLL_SORT_OPTIONS)
  sort?: PollSortOption;

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' && value.trim() === '' ? undefined : value,
  )
  @IsString()
  @IsIn(['all', 'active', 'expired'])
  status?: 'all' | 'active' | 'expired';
}
