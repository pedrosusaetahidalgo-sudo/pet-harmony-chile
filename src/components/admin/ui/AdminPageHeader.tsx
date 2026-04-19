import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  breadcrumbs?: Array<{ label: string }>;
  className?: string;
}

export default function AdminPageHeader({
  title,
  description,
  actions,
  breadcrumbs,
  className,
}: AdminPageHeaderProps) {
  const crumbs = [{ label: 'Centro de Control' }, ...(breadcrumbs ?? [])];

  return (
    <div className={cn('space-y-2', className)}>
      <Breadcrumb>
        <BreadcrumbList>
          {crumbs.map((crumb, idx) => {
            const isLast = idx === crumbs.length - 1;
            return (
              <BreadcrumbItem key={idx}>
                <BreadcrumbPage className={cn(isLast ? 'text-slate-200' : 'text-slate-500')}>
                  {crumb.label}
                </BreadcrumbPage>
                {!isLast && <BreadcrumbSeparator className="text-slate-600" />}
              </BreadcrumbItem>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display font-semibold text-3xl md:text-4xl tracking-tight text-white">
            {title}
          </h1>
          {description && <p className="mt-1 text-sm text-slate-400">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
