import { type ElementType } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface AdminEmptyStateProps {
  icon: ElementType;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export default function AdminEmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: AdminEmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 text-center', className)}>
      <div className="mb-4">
        <Icon className="h-16 w-16 text-slate-400 opacity-30" />
      </div>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-400">{description}</p>
      {action && (
        <Button
          onClick={action.onClick}
          className="mt-4 bg-indigo-600 text-white hover:bg-indigo-500"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}
