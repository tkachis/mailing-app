import {
  RiBarChartBoxLine,
  RiMailSendLine,
  RiFlowChart,
  RiCheckboxCircleLine,
} from '@remixicon/react';
import { getTranslations } from 'next-globe-gen';
import { FC, ReactNode } from 'react';

import { Card } from 'src/components';
import { cn } from 'src/utils/cn';

import { getUserStatistics } from './actions';

type ColorScheme = 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'indigo';

type StatItemProps = {
  label: string;
  value: number | string;
  icon: ReactNode;
  colorScheme?: ColorScheme;
};

const colorClasses: Record<
  ColorScheme,
  {
    gradient: string;
    iconBg: string;
    labelText: string;
    valueText: string;
  }
> = {
  blue: {
    gradient: 'from-blue-50 to-blue-100',
    iconBg: 'bg-blue-500',
    labelText: 'text-blue-700',
    valueText: 'text-blue-900',
  },
  green: {
    gradient: 'from-green-50 to-green-100',
    iconBg: 'bg-green-500',
    labelText: 'text-green-700',
    valueText: 'text-green-900',
  },
  purple: {
    gradient: 'from-purple-50 to-purple-100',
    iconBg: 'bg-purple-500',
    labelText: 'text-purple-700',
    valueText: 'text-purple-900',
  },
  orange: {
    gradient: 'from-orange-50 to-orange-100',
    iconBg: 'bg-orange-500',
    labelText: 'text-orange-700',
    valueText: 'text-orange-900',
  },
  red: {
    gradient: 'from-red-50 to-red-100',
    iconBg: 'bg-red-500',
    labelText: 'text-red-700',
    valueText: 'text-red-900',
  },
  indigo: {
    gradient: 'from-indigo-50 to-indigo-100',
    iconBg: 'bg-indigo-500',
    labelText: 'text-indigo-700',
    valueText: 'text-indigo-900',
  },
};

const StatItem: FC<StatItemProps> = ({
  label,
  value,
  icon,
  colorScheme = 'blue',
}) => {
  const colors = colorClasses[colorScheme];

  return (
    <div className={cn('rounded-lg bg-linear-to-br p-4', colors.gradient)}>
      <div className='flex items-center gap-3'>
        <div
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-lg',
            colors.iconBg,
          )}
        >
          {icon}
        </div>
        <div>
          <p className={cn('text-sm font-medium', colors.labelText)}>{label}</p>
          <p className={cn('text-2xl font-bold', colors.valueText)}>{value}</p>
        </div>
      </div>
    </div>
  );
};

const StatisticsCard: FC = async () => {
  const t = getTranslations('pages.dashboard.statistics');
  const statistics = await getUserStatistics();

  if (!statistics) {
    return null;
  }

  return (
    <Card
      header={t('header')}
      subheader={t('subheader')}
      icon={<RiBarChartBoxLine className='h-5 w-5 text-indigo-600' />}
      iconBgColor='bg-indigo-50'
    >
      <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
        <StatItem
          label={t('total_flows')}
          value={statistics.totalFlows}
          icon={<RiFlowChart className='h-6 w-6 text-white' />}
          colorScheme='blue'
        />

        <StatItem
          label={t('active_flows')}
          value={statistics.activeFlows}
          icon={<RiCheckboxCircleLine className='h-6 w-6 text-white' />}
          colorScheme='green'
        />

        <StatItem
          label={t('emails_sent')}
          value={statistics.totalEmailsSent}
          icon={<RiMailSendLine className='h-6 w-6 text-white' />}
          colorScheme='purple'
        />
      </div>
    </Card>
  );
};

export default StatisticsCard;
