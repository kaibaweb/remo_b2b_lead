'use client';

import { cn } from '@/lib/utils';
import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id || label.replace(/\s/g, '-').toLowerCase();
    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={inputId} className="text-[15px] font-semibold text-text-secondary">
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={cn(
            'w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3.5',
            'text-[16px] text-text-primary placeholder:text-text-muted',
            'transition-all duration-200',
            'focus:border-billy-yellow focus:ring-2 focus:ring-billy-yellow/20 focus:outline-none',
            error && 'border-accent-red focus:border-accent-red focus:ring-accent-red/20',
            className
          )}
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} role="alert" className="text-[13px] text-accent-red font-medium">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id || label.replace(/\s/g, '-').toLowerCase();
    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={inputId} className="text-[15px] font-semibold text-text-secondary">
          {label}
        </label>
        <textarea
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={cn(
            'w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3.5',
            'text-[16px] text-text-primary placeholder:text-text-muted',
            'transition-all duration-200 resize-none',
            'focus:border-billy-yellow focus:ring-2 focus:ring-billy-yellow/20 focus:outline-none',
            error && 'border-accent-red focus:border-accent-red focus:ring-accent-red/20',
            className
          )}
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} role="alert" className="text-[13px] text-accent-red font-medium">{error}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export { Input, Textarea };

