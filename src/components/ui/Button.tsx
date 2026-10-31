'use client';

import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', fullWidth, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-2xl font-bold transition-all duration-200',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-billy-yellow',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'active:scale-[0.98]',
          // Variants
          variant === 'primary' &&
            'bg-billy-yellow text-text-primary hover:bg-billy-yellow-dark shadow-lg shadow-billy-yellow/25 hover:shadow-xl hover:shadow-billy-yellow/30',
          variant === 'secondary' &&
            'bg-billy-blue text-white hover:bg-billy-blue/90 shadow-lg shadow-billy-blue/25',
          variant === 'ghost' &&
            'bg-transparent text-text-primary hover:bg-billy-yellow-light',
          variant === 'outline' &&
            'bg-transparent border-2 border-billy-yellow text-text-primary hover:bg-billy-yellow-light',
          // Sizes
          size === 'sm' && 'px-5 py-2.5 text-[15px]',
          size === 'md' && 'px-7 py-3.5 text-[17px]',
          size === 'lg' && 'px-9 py-4.5 text-[19px]',
          // Width
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
export { Button };

