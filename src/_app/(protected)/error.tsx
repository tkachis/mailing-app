'use client';

import { Block, Button } from 'src/components';

export default function Error({
  //   error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Block>
      <div className='flex flex-col items-center justify-center space-y-2'>
        <h2 className='text-paragraph-lg text-red-600'>
          Something went wrong!
        </h2>
        <p className='text-paragraph-md text-gray-600'>
          Failed to load the page. Please try again.
        </p>
        <Button.Root onClick={reset} variant='neutral'>
          Try again
        </Button.Root>
      </div>
    </Block>
  );
}
