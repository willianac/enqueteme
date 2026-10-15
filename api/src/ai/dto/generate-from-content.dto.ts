import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class GeneratePollFromContentDto {
  @IsEnum(['url', 'text'])
  type!: 'url' | 'text';

  @IsString()
  @IsNotEmpty()
  content!: string;
}
