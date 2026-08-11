import { Allow } from 'class-validator';

export class CreateUsuarioDto {
  @Allow()
  name?: string;
}
