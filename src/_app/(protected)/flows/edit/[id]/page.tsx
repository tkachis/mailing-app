import { getLocale, getTranslations } from 'next-globe-gen';
import { FC, Suspense } from 'react';

import { Block } from 'src/components';

import { updateFlow } from '../../actions';
import { FlowForm } from '../../components';

import { getFlowWithPkdIds } from './actions';

type EditFlowPageProps = {
  params: {
    id: string;
  };
};

const EditFlowContent: FC<EditFlowPageProps> = async ({ params }) => {
  const flowId = (await params).id as string;
  const locale = getLocale();
  const flow = await getFlowWithPkdIds(flowId);
  const boundUpdateFlow = updateFlow.bind(null, flowId, locale);

  return (
    <FlowForm
      mode='edit'
      action={boundUpdateFlow}
      initialData={{
        id: flowId,
        name: flow.name,
        isActive: flow.isActive,
        pkdNumbers: flow.pkdNumberIds,
        accountEmailId: flow.accountEmailId || '',
        emailTemplateHtml: flow.emailTemplateHtml,
      }}
    />
  );
};

const EditFlowPage: FC<EditFlowPageProps> = async ({ params }) => {
  const t = getTranslations('pages.editCreateFlow.form');

  return (
    <Block className='mx-auto max-w-2xl'>
      <Suspense fallback={<div>{t('loading')}</div>}>
        <EditFlowContent params={params} />
      </Suspense>
    </Block>
  );
};

export default EditFlowPage;
