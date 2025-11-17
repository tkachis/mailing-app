'use client';

import * as Sentry from '@sentry/nextjs';
import React, { FC, useEffect, useState } from 'react';

import { Label, Switch, toast } from 'src/components';
import { cn } from 'src/utils';

import { toggleFlowActivation } from './actions';

export type ToggleFlowActivitySwitchProps = {
  defaultIsActive: boolean;
  flowId: string;
};

const ToggleFlowActivitySwitch: FC<ToggleFlowActivitySwitchProps> = ({
  defaultIsActive,
  flowId,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [value, setValue] = useState<boolean>(defaultIsActive);
  const [error, setError] = useState<string | null>(null);

  const handleToggleFlowActivity = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await toggleFlowActivation(flowId, !value);

      if (response.success) {
        setValue((value) => !value);
      } else {
        setError(response.error || 'Unknown error occurred');
      }
    } catch (err) {
      // Логируем в Sentry
      Sentry.captureException(err, {
        tags: {
          feature: 'flows',
          component: 'ToggleFlowActivitySwitch',
        },
        extra: {
          flowId,
          targetIsActive: !value,
        },
      });

      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  return (
    <div
      className='flex items-center gap-2'
      onClick={(e) => e.stopPropagation()}
    >
      <Label.Root
        className={cn(
          'text-paragraph-sm',
          value ? 'text-green-500' : 'text-red-500',
        )}
        htmlFor={`${flowId}-toggle-flow-activity-switch`}
      >
        {value ? 'Active' : 'Inactive'}
      </Label.Root>
      <Switch.Root
        checked={value}
        disabled={isLoading}
        id={`${flowId}-toggle-flow-activity-switch`}
        onCheckedChange={handleToggleFlowActivity}
      />
    </div>
  );
};

export default ToggleFlowActivitySwitch;
