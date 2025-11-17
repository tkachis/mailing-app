import { Link } from 'next-globe-gen';
import { FC } from 'react';

import { Block } from 'src/components';
import { Routes } from 'src/configs';

import LanguageSwitcher from './LanguageSwitcher';
import ProfileMenu from './ProfileMenu';

const Header: FC = () => {
  return (
    <Block as='header' className='border-b border-gray-300 py-4!'>
      <div className='flex items-center justify-between'>
        <Link href={Routes.home()}>
          <h5 className='title-h5 font-serif font-bold'>Mailing App</h5>
        </Link>
        <div className='flex items-center gap-4'>
          <LanguageSwitcher />
          <ProfileMenu />
        </div>
      </div>
    </Block>
  );
};

export default Header;
