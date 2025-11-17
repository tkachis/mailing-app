export type ServerActionFormField<T = string> = {
  error?: string | null;
  value?: T;
};

export type ServerActionForm<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T extends Record<string, ServerActionFormField<any>>,
> = {
  form: T;
  success: boolean;
  error?: { message: string } | null;
};
