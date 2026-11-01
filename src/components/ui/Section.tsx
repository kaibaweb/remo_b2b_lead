import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface SectionProps {
  children: ReactNode;
  className?: string;
  id?: string;
  bg?: 'warm' | 'white' | 'yellow' | 'blue';
}

export function Section({ children, className, id, bg = 'warm' }: SectionProps) {
  return (
    <section
      id={id}
      className={cn(
        'py-12 sm:py-16 lg:py-24 px-5 sm:px-8',
        bg === 'warm' && 'bg-bg-warm',
        bg === 'white' && 'bg-white',
        bg === 'yellow' && 'bg-bg-section',
        bg === 'blue' && 'bg-billy-blue-light',
        className
      )}
    >
      <div className="mx-auto max-w-[1200px]">{children}</div>
    </section>
  );
}

interface SectionHeadlineProps {
  children: ReactNode;
  sub?: string;
  className?: string;
  center?: boolean;
}

export function SectionHeadline({ children, sub, className, center = true }: SectionHeadlineProps) {
  return (
    <div className={cn('mb-8 lg:mb-14', center && 'text-center', className)}>
      <h2 className="text-[28px] sm:text-[36px] lg:text-[44px] font-extrabold leading-[1.2] text-text-primary">
        {children}
      </h2>
      {sub && (
        <p className="mt-4 text-base sm:text-[17px] lg:text-[19px] text-text-secondary leading-relaxed whitespace-pre-line">
          {sub}
        </p>
      )}
    </div>
  );
}

