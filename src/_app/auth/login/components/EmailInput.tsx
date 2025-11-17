'use client';

import { RiMailLine } from '@remixicon/react';
import { FC } from 'react';

import { Hint, Input, Label } from 'src/components';

type EmailInputProps = {
  error?: string | null;
  required?: boolean;
  defaultValue?: string;
  label: string;
};

const EmailInput: FC<EmailInputProps> = ({
  error,
  required,
  defaultValue,
  label,
}) => {
  return (
    <div className='flex w-full max-w-[300px] flex-col gap-6'>
      <div className='flex flex-col gap-1'>
        <Label.Root htmlFor='email'>
          {label}
          {required && <Label.Asterisk />}
        </Label.Root>

        <Input.Root hasError={!!error}>
          <Input.Wrapper>
            <Input.Icon as={RiMailLine} />
            <Input.Input
              id='email'
              name='email'
              type='email'
              required={required}
              placeholder='hello@alignui.com'
              defaultValue={defaultValue}
            />
          </Input.Wrapper>
        </Input.Root>

        <Hint.Root hasError={!!error}>{error}</Hint.Root>
      </div>
    </div>
  );
};

export default EmailInput;
