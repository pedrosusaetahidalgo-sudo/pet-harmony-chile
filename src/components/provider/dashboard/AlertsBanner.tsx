import { AlertTriangle, Clock, FileText, Link2 } from '@/lib/icons';
import { Badge } from '@/components/ui/badge';

interface AlertsBannerProps {
  followupsPending: number;
  sharedFichasThisWeek: number;
  pendingLinksCount: number;
  onClickFollowups?: () => void;
  onClickFichas?: () => void;
  onClickLinks?: () => void;
}

export function AlertsBanner({
  followupsPending,
  sharedFichasThisWeek,
  pendingLinksCount,
  onClickFollowups,
  onClickFichas,
  onClickLinks,
}: AlertsBannerProps) {
  const items = [
    {
      count: pendingLinksCount,
      label: 'solicitudes pendientes',
      icon: Link2,
      color: 'bg-red-50 text-red-700 border-red-200',
      onClick: onClickLinks,
    },
    {
      count: followupsPending,
      label: 'seguimientos esta semana',
      icon: Clock,
      color: 'bg-amber-50 text-amber-700 border-amber-200',
      onClick: onClickFollowups,
    },
    {
      count: sharedFichasThisWeek,
      label: 'fichas nuevas',
      icon: FileText,
      color: 'bg-blue-50 text-blue-700 border-blue-200',
      onClick: onClickFichas,
    },
  ].filter((i) => i.count > 0);

  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Badge
            key={item.label}
            variant="outline"
            className={`${item.color} gap-1.5 px-2.5 py-1 text-xs font-medium ${item.onClick ? 'cursor-pointer hover:opacity-80' : ''}`}
            onClick={item.onClick}
          >
            <Icon className="h-3 w-3" />
            {item.count} {item.label}
          </Badge>
        );
      })}
    </div>
  );
}
