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
        'py-[56px] md:py-[80px] px-5 md:px-8',
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
    <div className={cn('mb-10 md:mb-14', center && 'text-center', className)}>
      <h2 className="text-[32px] md:text-[44px] font-extrabold leading-[1.2] text-text-primary">
        {children}
      </h2>
      {sub && (
        <p className="mt-4 text-[17px] md:text-[19px] text-text-secondary leading-relaxed whitespace-pre-line">
          {sub}
        </p>
      )}
    </div>
  );
}

