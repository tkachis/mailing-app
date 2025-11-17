import { RiFlowChart } from '@remixicon/react';
import { getTranslations } from 'next-globe-gen';
import React from 'react';

import { Accordion, Card } from 'src/components';

import { getUserFlows } from './actions';
import AddFlowButton from './AddFlowButton';
import FlowItem from './FlowItem';

const FlowsList = async () => {
  const t = getTranslations('pages.dashboard.flows');
  const { flows, error } = await getUserFlows();

  if (error) {
    return (
      <div className='space-y-2'>
        <p className='text-paragraph-md text-red-500'>{t('error')}</p>
        <p className='text-paragraph-sm text-red-500'>{error}</p>
      </div>
    );
  }

  if (flows.length === 0) {
    return (
      <div className='space-y-6'>
        <div className='space-y-2'>
          <p className='text-paragraph-md text-gray-500'>{t('no_flows')}</p>
        </div>

        <AddFlowButton />
      </div>
    );
  }

  return (
    <Card
      header={t('header')}
      subheader={t('subheader')}
      icon={<RiFlowChart className='h-5 w-5 text-indigo-600' />}
      iconBgColor='bg-indigo-50'
    >
      <div className='space-y-6'>
        <Accordion.Root type='multiple' className='space-y-6'>
          {flows.map((flow) => (
            <FlowItem key={flow.id} data={flow} />
          ))}
        </Accordion.Root>

        <AddFlowButton />
      </div>
    </Card>
  );
};

export default FlowsList;
