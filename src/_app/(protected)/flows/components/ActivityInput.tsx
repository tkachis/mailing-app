import React, { FC } from 'react';

import { Hint, Label, Switch } from 'src/components';

type ActivityInputProps = {
  name: string;
  required?: boolean;
  error?: string | null;
  defaultValue?: boolean;
  disabled?: boolean;
  label: string;
};

const ActivityInput: FC<ActivityInputProps> = ({
  name,
  required,
  error,
  defaultValue = true,
  disabled = false,
  label,
}) => {
  return (
    <div className='flex w-full flex-col gap-2'>
      <Label.Root htmlFor={name}>
        {label}
        {required && <Label.Asterisk />}
      </Label.Root>
      <Switch.Root
        id={name}
        name={name}
        required={required}
        disabled={disabled}
        defaultChecked={defaultValue}
      />

      {error && <Hint.Root hasError={true}>{error}</Hint.Root>}
    </div>
  );
};

export default ActivityInput;
