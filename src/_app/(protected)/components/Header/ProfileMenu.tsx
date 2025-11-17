'use client';

import { RiUserLine, RiLogoutBoxRLine } from '@remixicon/react';
import { Link, useTranslations } from 'next-globe-gen';
import React from 'react';

import { Dropdown } from 'src/components';
import { Routes } from 'src/configs';

import { logout } from '../../actions';

const ProfileMenu = () => {
  const t = useTranslations('components.header.menu');

  return (
    <nav className='flex flex-row items-center gap-4'>
      <Dropdown.Root>
        <Dropdown.Trigger asChild>
          <div className='flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-gray-200 text-gray-700 transition-colors hover:bg-gray-300 focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:outline-none'>
            <RiUserLine className='h-5 w-5' />
          </div>
        </Dropdown.Trigger>

        <Dropdown.Content align='end' className='w-[200px]'>
          <Dropdown.Item className='cursor-pointer' asChild>
            <Link href={Routes.profile()}>
              <Dropdown.ItemIcon as={RiUserLine} />
              <span>{t('profile')}</span>
            </Link>
          </Dropdown.Item>

          <Dropdown.Separator className='my-1 h-px bg-gray-200' />

          <Dropdown.Item className='cursor-pointer' onClick={logout}>
            <Dropdown.ItemIcon as={RiLogoutBoxRLine} />
            <span>{t('logout')}</span>
          </Dropdown.Item>
        </Dropdown.Content>
      </Dropdown.Root>
    </nav>
  );
};

export default ProfileMenu;
