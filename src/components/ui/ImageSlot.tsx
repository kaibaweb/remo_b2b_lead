import { cn } from '@/lib/utils';
import Image from 'next/image';

interface ImageSlotProps {
  src?: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  placeholder?: string;
  priority?: boolean;
  fill?: boolean;
}

/**
 * Reusable image slot: shows an actual image if `src` exists,
 * otherwise shows a branded placeholder for future replacement.
 */
export function ImageSlot({
  src,
  alt,
  width,
  height,
  className,
  placeholder = '이미지 준비 중',
  priority = false,
  fill = false,
}: ImageSlotProps) {
  if (src && !src.includes('placeholder')) {
    return (
      <Image
        src={src}
        alt={alt}
        width={fill ? undefined : (width || 400)}
        height={fill ? undefined : (height || 300)}
        fill={fill}
        priority={priority}
        className={cn('object-cover', className)}
      />
    );
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-2xl bg-billy-yellow-light border-2 border-dashed border-billy-yellow/30',
        'text-text-muted text-[15px] font-medium',
        className
      )}
      style={{
        width: fill ? '100%' : width || 400,
        height: fill ? '100%' : height || 300,
        minHeight: 200,
      }}
      role="img"
      aria-label={alt}
    >
      <div className="text-center p-4">
        <span className="text-3xl block mb-2">📷</span>
        {placeholder}
      </div>
    </div>
  );
}

