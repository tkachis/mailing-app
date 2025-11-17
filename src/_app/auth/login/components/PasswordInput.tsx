'use client';

import { RiEyeLine, RiEyeOffLine, RiLock2Line } from '@remixicon/react';
import { FC, useState } from 'react';

import { Hint, Input, Label } from 'src/components';

type PasswordInputProps = {
  error?: string | null;
  required?: boolean;
  defaultValue?: string;
  label: string;
};

const PasswordInput: FC<PasswordInputProps> = ({
  error,
  required,
  defaultValue,
  label,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className='flex w-full max-w-[300px] flex-col gap-6'>
      <div className='flex flex-col gap-1'>
        <Label.Root htmlFor='password'>
          {label}
          {required && <Label.Asterisk />}
        </Label.Root>

        <Input.Root hasError={!!error}>
          <Input.Wrapper>
            <Input.Icon as={RiLock2Line} />
            <Input.Input
              id='password'
              name='password'
              required={required}
              type={showPassword ? 'text' : 'password'}
              placeholder='••••••••••'
              defaultValue={defaultValue}
            />
            <button type='button' onClick={() => setShowPassword((s) => !s)}>
              {showPassword ? (
                <RiEyeOffLine className='text-text-soft-400 group-has-[disabled]:text-text-disabled-300 size-5' />
              ) : (
                <RiEyeLine className='text-text-soft-400 group-has-[disabled]:text-text-disabled-300 size-5' />
              )}
            </button>
          </Input.Wrapper>
        </Input.Root>

        <Hint.Root hasError={!!error}>{error}</Hint.Root>
      </div>
    </div>
  );
};

export default PasswordInput;
