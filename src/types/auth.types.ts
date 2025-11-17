import { Nullable } from './common.types';
import { User } from './user.types';

export type AuthTokens = Nullable<{
  accessToken: string;
  refreshToken: string;
}>;

export type AuthResponse = Nullable<{
  user: User;
  tokens: AuthTokens;
}>;

export type SignInCredentials = Nullable<{
  email: string;
  password: string;
}>;
