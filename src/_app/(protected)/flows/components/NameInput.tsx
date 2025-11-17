import { FC } from 'react';

import { Hint, Input, Label } from 'src/components';

type NameInputProps = {
  name: string;
  label: string;
  required?: boolean;
  disabled?: boolean;
  error?: string | null;
  defaultValue?: string;
};

const NameInput: FC<NameInputProps> = ({
  name,
  label,
  error,
  required,
  disabled,
  defaultValue,
}) => {
  return (
    <div className='flex w-full flex-col gap-2'>
      <Label.Root htmlFor={name}>
        {label}
        {required && <Label.Asterisk />}
      </Label.Root>

      <Input.Root hasError={!!error}>
        <Input.Wrapper>
          <Input.Input
            id={name}
            name={name}
            type='text'
            required={required}
            defaultValue={defaultValue}
            disabled={disabled}
          />
        </Input.Wrapper>
      </Input.Root>

      {error && <Hint.Root hasError={true}>{error}</Hint.Root>}
    </div>
  );
};

export default NameInput;
