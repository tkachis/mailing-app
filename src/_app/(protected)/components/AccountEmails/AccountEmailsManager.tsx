import { getTranslations } from 'next-globe-gen';
import { FC } from 'react';

import AccountEmailItem from './AccountEmailItem';
import AccountEmailsConnectButton from './AccountEmailsConnectButton';
import { getAccountEmails } from './actions';

const GmailAccountsManager: FC = async () => {
  const t = getTranslations('components.accountEmails');
  const emails = await getAccountEmails();

  return (
    <div className='flex flex-col gap-4'>
      {emails.length === 0 ? (
        <div className='flex flex-col items-center justify-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-8 text-center'>
          <p className='text-gray-600'>{t('no_email_accounts_connected')}</p>
          <AccountEmailsConnectButton />
        </div>
      ) : (
        <div className='flex flex-col gap-3'>
          {emails.map((email) => (
            <AccountEmailItem key={email.id} email={email} />
          ))}
          <AccountEmailsConnectButton />
        </div>
      )}

      <div className='mt-2 rounded-lg bg-blue-50 p-4'>
        <p className='text-sm text-blue-800'>{t('tip')}</p>
      </div>
    </div>
  );
};

export default GmailAccountsManager;
