import { Suspense } from 'react';

import { UnsubscribeResult } from './components';

import type { UnsubscribeStatus } from 'src/types';

type SearchParams = Promise<{
  status?: UnsubscribeStatus;
}>;

type UnsubscribePageProps = {
  searchParams: SearchParams;
};

async function UnsubscribeContent({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { status = 'missing' } = await searchParams;

  const contentMap = {
    success: {
      icon: '✅',
      title: 'Отписка успешна',
      message:
        'Вы больше не будете получать письма от наших клиентов. Спасибо за ваше время!',
    },
    invalid: {
      icon: '⚠️',
      title: 'Токен недействителен',
      message:
        'Ссылка для отписки недействительна или истекла. Если вы продолжаете получать письма, пожалуйста, свяжитесь с нами.',
    },
    error: {
      icon: '❌',
      title: 'Произошла ошибка',
      message:
        'Не удалось обработать вашу отписку. Пожалуйста, попробуйте позже или свяжитесь с нами.',
    },
    missing: {
      icon: '❌',
      title: 'Ошибка',
      message:
        'Отсутствует токен отписки. Пожалуйста, используйте ссылку из письма.',
    },
  };

  const content = contentMap[status];

  return (
    <UnsubscribeResult
      status={status}
      title={content.title}
      message={content.message}
      icon={content.icon}
    />
  );
}

export default function UnsubscribePage({
  searchParams,
}: UnsubscribePageProps) {
  return (
    <Suspense
      fallback={
        <div className='mx-4 w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl'>
          <div className='text-center'>Загрузка...</div>
        </div>
      }
    >
      <UnsubscribeContent searchParams={searchParams} />
    </Suspense>
  );
}
