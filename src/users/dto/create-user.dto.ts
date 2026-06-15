import { UserRole } from '../schemas/user.schema';

export class CreateUserDto {
  readonly name: string;
  readonly lastName: string;
  readonly rut: string;
  readonly email: string;
  readonly password: string;
  readonly phone: string;
  readonly rol?: UserRole;
  readonly empresa?: string;
  readonly signature?: string;
}
