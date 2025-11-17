// AlignUI Toast v0.0.0

import {
  toast as sonnerToast,
  Toaster,
  type ToasterProps,
  type ExternalToast,
} from 'sonner';

import { AlertToast } from './AlertToast';

const defaultOptions: ToasterProps = {
  className: 'group/toast',
  position: 'bottom-center',
};

const customToast = (
  renderFunc: (t: string | number) => React.ReactElement,
  options: ExternalToast = {},
) => {
  const mergedOptions = { ...defaultOptions, ...options };
  return sonnerToast.custom(renderFunc, mergedOptions);
};

const toast = {
  ...sonnerToast,
  error: (message: string, options?: ExternalToast) =>
    customToast(
      (t) => (
        <AlertToast
          t={t}
          status='error'
          variant='filled'
          message={message}
          dismissable={true}
        />
      ),
      options,
    ),
  success: (message: string, options?: ExternalToast) =>
    customToast(
      (t) => (
        <AlertToast
          t={t}
          status='success'
          variant='filled'
          message={message}
          dismissable={true}
        />
      ),
      options,
    ),
  warning: (message: string, options?: ExternalToast) =>
    customToast(
      (t) => (
        <AlertToast
          t={t}
          status='warning'
          variant='filled'
          message={message}
          dismissable={true}
        />
      ),
      options,
    ),
  info: (message: string, options?: ExternalToast) =>
    customToast(
      (t) => (
        <AlertToast
          t={t}
          status='information'
          variant='filled'
          message={message}
          dismissable={true}
        />
      ),
      options,
    ),
  custom: customToast,
};

export { toast, Toaster };
