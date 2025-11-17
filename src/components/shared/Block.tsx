import React, { FC, PropsWithChildren, JSX, HTMLAttributes } from 'react';

import { cn } from 'src/utils/cn';

export type BlockProps = HTMLAttributes<HTMLOrSVGElement> & {
  as?: keyof JSX.IntrinsicElements;
};

const Block: FC<PropsWithChildren<BlockProps>> = ({
  as: Tag = 'div',
  children,
  className,
  ...rest
}) => {
  return (
    <Tag
      {...rest}
      className={cn('p-block container-2xl', className ? className : '')}
    >
      {children}
    </Tag>
  );
};

export default Block;
