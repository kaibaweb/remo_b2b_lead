'use client';

import { cn } from '@/lib/utils';

interface ChipProps {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md';
}

export function Chip({ label, selected, onClick, size = 'md' }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border-2 font-semibold transition-all duration-200',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-billy-yellow',
        'active:scale-[0.96]',
        size === 'sm' && 'px-4 py-2 text-[14px]',
        size === 'md' && 'px-5 py-2.5 text-[15px]',
        selected
          ? 'border-billy-yellow bg-billy-yellow text-text-primary shadow-md shadow-billy-yellow/20'
          : 'border-gray-200 bg-white text-text-secondary hover:border-billy-yellow/50 hover:bg-billy-yellow-light'
      )}
    >
      {label}
    </button>
  );
}

