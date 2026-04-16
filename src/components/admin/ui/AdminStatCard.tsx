import { type ElementType } from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

interface AdminStatCardProps {
  label: string;
  value: string | number;
  icon: ElementType;
  color?: string;
  className?: string;
}

export default function AdminStatCard({
  label,
  value,
  icon: Icon,
  color = 'text-indigo-400',
  className,
}: AdminStatCardProps) {
  return (
    <Card className={cn('flex items-center gap-3 border-slate-800 bg-slate-900 p-4', className)}>
      <div
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-800',
          color
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="font-mono text-xl font-bold text-white">{value}</p>
        <p className="truncate text-xs text-slate-400">{label}</p>
      </div>
    </Card>
  );
}
