import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, FileText, Link2, Calendar, Star, ChevronDown } from '@/lib/icons';
import { useProviderActivityFeed, type ActivityItem } from '@/hooks/useProviderActivityFeed';

const TYPE_CONFIG: Record<ActivityItem['type'], { icon: React.ElementType; color: string }> = {
  shared_ficha: { icon: FileText, color: 'text-blue-600 bg-blue-50' },
  link_request: { icon: Link2, color: 'text-purple-600 bg-purple-50' },
  booking: { icon: Calendar, color: 'text-green-600 bg-green-50' },
  review: { icon: Star, color: 'text-yellow-600 bg-yellow-50' },
};

export function ActivityFeed() {
  const { data: items, isLoading } = useProviderActivityFeed();
  const [expanded, setExpanded] = useState(false);

  const displayItems = expanded ? items : items?.slice(0, 5);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4 text-purple-600" />
            Actividad reciente
          </CardTitle>
          {(items?.length ?? 0) > 5 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="text-xs gap-1"
            >
              {expanded ? 'Ver menos' : 'Ver todo'}
              <ChevronDown
                className={`h-3 w-3 transition-transform ${expanded ? 'rotate-180' : ''}`}
              />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : !displayItems || displayItems.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            Sin actividad en los ultimos 7 dias. Comparte tu perfil para empezar a recibir
            pacientes.
          </p>
        ) : (
          <div className="space-y-1">
            {displayItems.map((item) => {
              const config = TYPE_CONFIG[item.type];
              const Icon = config.icon;
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className={`p-1.5 rounded-md flex-shrink-0 ${config.color}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs leading-tight truncate">{item.description}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground flex-shrink-0 whitespace-nowrap">
                    {item.relativeTime}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
