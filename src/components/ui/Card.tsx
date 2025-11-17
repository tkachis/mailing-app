import React, { FC, HTMLAttributes, PropsWithChildren, ReactNode } from 'react';

import { cn } from 'src/utils/cn';

type CardProps = HTMLAttributes<HTMLDivElement> & {
  header?: ReactNode;
  subheader?: ReactNode;
  icon?: ReactNode;
  iconBgColor?: string;
};

const Card: FC<PropsWithChildren<CardProps>> = ({
  header,
  subheader,
  icon,
  iconBgColor = 'bg-blue-50',
  children,
  className,
  ...rest
}) => {
  return (
    <div
      {...rest}
      className={cn(
        'rounded-xl border border-gray-200 bg-white p-6 shadow-sm',
        className,
      )}
    >
      {(header || icon) && (
        <div className='mb-4'>
          {icon && (
            <div className='mb-4 flex items-center gap-2'>
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-lg',
                  iconBgColor,
                )}
              >
                {icon}
              </div>
              {header && (
                <h2 className='text-xl font-semibold text-gray-900'>
                  {header}
                </h2>
              )}
            </div>
          )}
          {!icon && header && (
            <h2 className='text-xl font-semibold text-gray-900'>{header}</h2>
          )}
        </div>
      )}

      {subheader && (
        <div className='mb-6'>
          {typeof subheader === 'string' ? (
            <p className='text-sm text-gray-600'>{subheader}</p>
          ) : (
            subheader
          )}
        </div>
      )}

      {children}
    </div>
  );
};

export { Card, type CardProps };
