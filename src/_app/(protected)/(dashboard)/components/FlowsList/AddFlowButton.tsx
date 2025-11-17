import { RiAddLine } from '@remixicon/react';
import { useTranslations, Link } from 'next-globe-gen';
import React from 'react';

import { Routes } from 'src/configs';

const AddFlowButton = () => {
  const t = useTranslations('pages.dashboard.flows');

  return (
    <Link
      href={Routes.createFlow()}
      className='flex items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gray-300 p-6 text-gray-500 transition-colors hover:border-gray-400 hover:text-gray-600'
    >
      <RiAddLine className='size-6' />
      <span className='text-sm font-medium'>{t('add_flow')}</span>
    </Link>
  );
};

export default AddFlowButton;
