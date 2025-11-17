import { Nullable } from './common.types';

export type User = Nullable<{
  id: string;
  email: string;
  name: string;
}>;
