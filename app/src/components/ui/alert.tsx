import * as React from 'react';

type AlertVariant = 'default' | 'destructive';

type AlertProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: AlertVariant;
};

const cn = (...classes: Array<string | undefined | false>) =>
  classes.filter(Boolean).join(' ');

const variantClass: Record<AlertVariant, string> = {
  default: 'border-slate-700 bg-slate-900/60 text-slate-200',
  destructive: 'border-red-700 bg-red-900/40 text-red-200'
};

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'default', ...props }, ref) => (
    <div
      ref={ref}
      role="alert"
      className={cn('relative w-full rounded-lg border p-4', variantClass[variant], className)}
      {...props}
    />
  )
);

Alert.displayName = 'Alert';

export const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-sm leading-relaxed', className)} {...props} />
));

AlertDescription.displayName = 'AlertDescription';
