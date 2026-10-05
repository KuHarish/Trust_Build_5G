import React, { useState } from 'react';
import { cn } from '@/utils';
import { User as UserIcon } from 'lucide-react';

export interface AvatarProps {
  src?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'busy' | 'offline';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = 'User Avatar',
  size = 'md',
  status,
  className,
}) => {
  const [imgError, setImgError] = useState(false);

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };

  const statusDotSizes = {
    sm: 'w-2 h-2 -bottom-0.5 -right-0.5',
    md: 'w-2.5 h-2.5 bottom-0 right-0',
    lg: 'w-3 h-3 bottom-0 right-0',
    xl: 'w-3.5 h-3.5 bottom-0.5 right-0.5',
  };

  const statusColors = {
    online: 'bg-success ring-2 ring-slate-900',
    busy: 'bg-danger ring-2 ring-slate-900',
    offline: 'bg-slate-500 ring-2 ring-slate-900',
  };

  return (
    <div className={cn('relative inline-block shrink-0', sizeClasses[size], className)}>
      <div className="w-full h-full rounded-full overflow-hidden bg-slate-800 border border-slate-700 flex items-center justify-center">
        {src && !imgError ? (
          <img
            src={src}
            alt={alt}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <UserIcon className="w-1/2 h-1/2 text-slate-400" />
        )}
      </div>
      {status && (
        <span
          className={cn(
            'absolute rounded-full block',
            statusDotSizes[size],
            statusColors[status]
          )}
        />
      )}
    </div>
  );
};
