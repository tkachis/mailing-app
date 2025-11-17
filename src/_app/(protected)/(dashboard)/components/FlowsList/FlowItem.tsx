import { RiEditLine } from '@remixicon/react';
import { Link, getTranslations } from 'next-globe-gen';
import React, { FC } from 'react';

import { Accordion, Button, Tag } from 'src/components';
import { Routes } from 'src/configs';

import { UserFlow } from './actions';

export type FlowItemProps = {
  data: UserFlow;
};

const FlowItem: FC<FlowItemProps> = ({ data }) => {
  const t = getTranslations('pages.dashboard.flows.item');

  return (
    <Accordion.Item key={data.id} value={data.id}>
      <Accordion.Trigger>
        <Accordion.Arrow />
        <div className='flex w-full items-center justify-between'>
          <p className='label-sm'>{data.name}</p>
          <Tag.Root
            variant='filled'
            className={
              data.isActive
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }
          >
            {data.isActive ? t('active') : t('inactive')}
          </Tag.Root>
        </div>
      </Accordion.Trigger>
      <Accordion.Content>
        <div className='space-y-4'>
          <div>
            <p className='label-sm mb-2'>{t('email_template')}</p>
            <div
              className='max-h-32 overflow-y-auto rounded border bg-gray-50 p-3 text-sm text-gray-600'
              dangerouslySetInnerHTML={{ __html: data.emailTemplateHtml }}
            />
          </div>

          {data.pkdNumbers && data.pkdNumbers.length > 0 && (
            <div>
              <p className='label-sm'>{t('pkd_codes')}</p>
              <div className='flex flex-wrap gap-2'>
                {data.pkdNumbers.map((pkdRelation) => (
                  <span
                    key={pkdRelation.pkdId}
                    className='rounded border bg-blue-50 px-2 py-1 text-xs text-blue-700'
                  >
                    {pkdRelation.pkdNumber?.pkdNumber} -{' '}
                    {pkdRelation.pkdNumber?.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className='flex justify-end'>
            <Button.Root asChild size='small' variant='neutral'>
              <Link
                href={{
                  pathname: Routes.editFlowTemp(),
                  params: { id: data.id },
                }}
              >
                <RiEditLine className='mr-1 size-4' />
                {t('edit_flow')}
              </Link>
            </Button.Root>
          </div>
        </div>
      </Accordion.Content>
    </Accordion.Item>
  );
};

export default FlowItem;
