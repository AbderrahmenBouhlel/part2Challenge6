import * as React from 'react';

type ButtonVariant = 'default' | 'outline' | 'destructive' | 'ghost';
type ButtonSize = 'default' | 'sm' | 'lg';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const baseClass =
  'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';

const variantClass: Record<ButtonVariant, string> = {
  default: 'bg-slate-900 text-white hover:bg-slate-800',
  outline: 'border border-slate-600 text-slate-200 hover:bg-slate-800/60',
  destructive: 'bg-red-600 text-white hover:bg-red-700',
  ghost: 'text-slate-200 hover:bg-slate-800/60'
};

const sizeClass: Record<ButtonSize, string> = {
  default: 'h-10 px-4',
  sm: 'h-8 px-3 text-sm',
  lg: 'h-12 px-6 text-base'
};

const cn = (...classes: Array<string | undefined | false>) =>
  classes.filter(Boolean).join(' ');

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => (
    <button
      ref={ref}
      className={cn(baseClass, variantClass[variant], sizeClass[size], className)}
      {...props}
    />
  )
);

Button.displayName = 'Button';
