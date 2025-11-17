import { getLocale, getTranslations } from 'next-globe-gen';
import { FC, Suspense } from 'react';

import { Block } from 'src/components';

import { createFlow } from '../actions';
import { FlowForm } from '../components';

const CreateFlowPage: FC = () => {
  const locale = getLocale();
  const t = getTranslations('pages.editCreateFlow.form');
  const boundCreateFlow = createFlow.bind(null, locale);

  return (
    <Block className='mx-auto max-w-2xl'>
      <Suspense fallback={<div>{t('loading')}</div>}>
        <FlowForm mode='create' action={boundCreateFlow} />
      </Suspense>
    </Block>
  );
};

export default CreateFlowPage;
