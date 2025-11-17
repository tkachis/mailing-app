'use client';

import { FC } from 'react';

import AccountEmailDeleteButton from './AccountEmailDeleteButton';
import AccountEmailsReconnectButton from './AccountEmailsReconnectButton';
import AccountEmailToggle from './AccountEmailToggle';

import type { AccountEmail } from 'src/db/schema';

type AccountEmailItemProps = {
  email: AccountEmail;
};

const AccountEmailItem: FC<AccountEmailItemProps> = ({ email }) => {
  const needsReconnect = !email.googleRefreshToken;

  return (
    <div className='flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm'>
      <div className='flex flex-col gap-2'>
        <div className='flex items-center gap-4'>
          <span className='text-base font-medium text-gray-900'>
            📧 {email.email}
          </span>
          {!needsReconnect && <AccountEmailToggle email={email} />}
        </div>
      </div>

      <div className='flex items-center gap-2'>
        {needsReconnect && <AccountEmailsReconnectButton />}
        <AccountEmailDeleteButton email={email} />
      </div>
    </div>
  );
};

export default AccountEmailItem;
