import type { UnsubscribeStatus } from 'src/types';

class Routes {
  // Protected
  static readonly home = () => '/';
  static readonly profile = () => '/profile';
  static readonly createFlow = () => '/flows/create';
  static readonly editFlow = (id: string) => `/flows/edit/${id}`;
  static readonly editFlowTemp = () => '/flows/edit/[id]';
  static readonly paymentSuccess = (path: string, sessionId?: string) =>
    `${path}?paymentStatus=success${sessionId ? `&session_id=${sessionId}` : ''}`;
  static readonly paymentCancel = (path: string) =>
    `${path}?paymentStatus=cancel`;

  // Auth (Public)
  static readonly auth = () => '/auth';
  static readonly error = () => '/error';
  static readonly login = () => `${this.auth()}/login`;

  // Unsubscribe (Public)
  static readonly unsubscribe = (status?: UnsubscribeStatus) =>
    `/unsubscribe${status ? `?status=${status}` : ''}`;

  static readonly unsubscribeApi = (token: string) =>
    `/api/unsubscribe?token=${token}`;
}

export default Routes;
