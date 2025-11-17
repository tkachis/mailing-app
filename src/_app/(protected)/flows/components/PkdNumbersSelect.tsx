import { RiInformationFill } from '@remixicon/react';
import { useTranslations } from 'next-globe-gen';
import React, { FC, useEffect, useState, useTransition } from 'react';

import { Hint, Label, MultiSelect } from 'src/components';

import { getPkdNumberOptions } from '../actions';

type PkdNumbersSelectProps = {
  name: string;
  required?: boolean;
  error?: string | null;
  defaultValue?: string[];
  disabled?: boolean;
  label: string;
};

const PkdNumbersSelect: FC<PkdNumbersSelectProps> = ({
  name,
  label,
  required,
  error,
  defaultValue = [],
  disabled = false,
}) => {
  const [pkdOptions, setPkdOptions] = useState<
    MultiSelect.OptionType<string>[]
  >([]);
  const [isPending, startTransition] = useTransition();
  const t = useTranslations('pages.editCreateFlow.form.pkd_codes');
  useEffect(() => {
    startTransition(async () => {
      const options = await getPkdNumberOptions();

      setPkdOptions(options);
    });
  }, []);

  return (
    <div className='flex w-full flex-col gap-2'>
      <Label.Root htmlFor={name}>
        {label}
        {required && <Label.Asterisk />}
      </Label.Root>

      <MultiSelect.Root<string>
        name={name}
        options={pkdOptions}
        defaultValue={defaultValue}
        placeholder={isPending ? t('loading') : t('placeholder')}
        searchPlaceholder={t('search_placeholder')}
        hasError={!!error}
        disabled={isPending || disabled}
        size='medium'
        variant='default'
      />

      <Hint.Root hasError={!!error}>
        {error ? (
          error
        ) : (
          <>
            <Hint.Icon as={RiInformationFill} />
            {t('hint')}
          </>
        )}
      </Hint.Root>
    </div>
  );
};

export default PkdNumbersSelect;
