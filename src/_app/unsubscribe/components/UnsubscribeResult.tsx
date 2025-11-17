import { tv, type VariantProps } from 'src/utils/tv';

const unsubscribeResultVariants = tv({
  slots: {
    container: 'mx-4 w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl',
    icon: 'mb-6 text-center text-6xl',
    title: 'mb-4 text-center text-2xl font-bold',
    message: 'text-center leading-relaxed text-gray-600',
    footer: 'mt-6 text-center text-sm text-gray-500',
  },
  variants: {
    status: {
      success: {
        title: 'text-green-600',
      },
      error: {
        title: 'text-red-600',
      },
      invalid: {
        title: 'text-amber-600',
      },
      missing: {
        title: 'text-red-600',
      },
    },
  },
});

type UnsubscribeResultProps = VariantProps<typeof unsubscribeResultVariants> & {
  title: string;
  message: string;
  icon: string;
};

export default function UnsubscribeResult({
  status,
  title,
  message,
  icon,
}: UnsubscribeResultProps) {
  const {
    container,
    icon: iconClass,
    title: titleClass,
    message: messageClass,
    footer,
  } = unsubscribeResultVariants({ status });

  return (
    <div className={container()}>
      <div className={iconClass()}>{icon}</div>
      <h1 className={titleClass()}>{title}</h1>
      <p className={messageClass()}>{message}</p>
      {status === 'success' && (
        <p className={footer()}>
          Если вы передумаете, вы можете снова подписаться, связавшись с
          отправителем письма.
        </p>
      )}
    </div>
  );
}
