import { Role } from '../enums/roles.enum';

export type JwtUser = {
  userId: string;
  email: string;
  role: Role;
};
