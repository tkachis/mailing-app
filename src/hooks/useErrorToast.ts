import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { toast } from 'src/components';

type ToastType = 'error' | 'success' | 'info';

type ToastMessage = { message: string; type: ToastType };

export function useErrorToast(
  paramName: string,
  messages: Record<string, ToastMessage>,
) {
  const searchParams = useSearchParams();
  const paramValue = searchParams.get(paramName);
  const [wasShown, setWasShown] = useState(false);

  useEffect(() => {
    if (paramValue && messages[paramValue] && !wasShown) {
      const messageConfig = messages[paramValue];
      const toastFn = toast[messageConfig.type];

      toastFn(messageConfig.message, {
        onAutoClose: () => setWasShown(true),
        onDismiss: () => setWasShown(true),
      });
    }
  }, [paramName, paramValue, messages, wasShown]);
}
