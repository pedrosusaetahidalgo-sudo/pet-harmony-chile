import { type ElementType } from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Link } from 'react-router-dom';

interface AdminStatCardProps {
  label: string;
  value: string | number;
  icon: ElementType;
  color?: string;
  className?: string;
  to?: string;
  onClick?: () => void;
}

export default function AdminStatCard({
  label,
  value,
  icon: Icon,
  color = 'text-indigo-400',
  className,
  to,
  onClick,
}: AdminStatCardProps) {
  const interactive = Boolean(to || onClick);
  const card = (
    <Card
      className={cn(
        'flex items-center gap-3 border-slate-800 bg-slate-900 p-4 transition-colors',
        interactive &&
          'cursor-pointer hover:border-indigo-500/40 hover:bg-slate-900/80 focus-within:ring-2 focus-within:ring-indigo-500/40',
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
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

  if (to) {
    return (
      <Link to={to} className="block focus:outline-none">
        {card}
      </Link>
    );
  }
  return card;
}
