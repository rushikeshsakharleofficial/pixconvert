import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'relative inline-flex items-center justify-center whitespace-nowrap overflow-hidden rounded-full border-2 border-[var(--cartoon-btn-border)] text-sm font-bold text-[var(--cartoon-btn-text)] transition-all duration-150 outline-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 before:absolute before:top-1/2 before:left-[-100%] before:h-20 before:w-12 before:-translate-y-1/2 before:rotate-12 before:bg-white/50 before:transition-all before:duration-500 before:content-[""] hover:-translate-y-1 hover:before:left-[200%] active:translate-y-0',
  {
    variants: {
      variant: {
        default: 'bg-[var(--cartoon-btn-primary)] shadow-[0_4px_0_0_var(--cartoon-btn-shadow)]',
        destructive: 'bg-[var(--cartoon-btn-danger)] shadow-[0_4px_0_0_var(--cartoon-btn-shadow)]',
        outline: 'bg-[var(--cartoon-btn-outline)] shadow-[0_4px_0_0_var(--cartoon-btn-shadow)]',
        secondary: 'bg-[var(--cartoon-btn-secondary)] shadow-[0_4px_0_0_var(--cartoon-btn-shadow)]',
        ghost: 'border-transparent bg-transparent text-foreground before:hidden shadow-none hover:bg-accent hover:shadow-none',
        link: 'border-transparent bg-transparent text-primary underline-offset-4 before:hidden shadow-none hover:underline hover:shadow-none',
      },
      size: {
        default: 'h-12 px-6 text-base',
        sm: 'h-10 px-4 text-sm',
        lg: 'h-14 px-8 text-lg',
        icon: 'h-11 w-11 rounded-full px-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

const Button = React.forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
