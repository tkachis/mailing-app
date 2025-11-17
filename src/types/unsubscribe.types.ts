export type UnsubscribePayload = {
  accountEmailId: string;
  companyId: string;
};

export type UnsubscribeStatus = 'success' | 'error' | 'invalid' | 'missing';
