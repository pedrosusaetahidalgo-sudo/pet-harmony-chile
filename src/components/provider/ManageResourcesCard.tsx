import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Building2 } from '@/lib/icons';
import {
  useProviderResources,
  useCreateResource,
  useDeleteResource,
  RESOURCE_TYPE_LABELS,
  type ResourceType,
} from '@/hooks/useProviderResources';

interface ManageResourcesCardProps {
  providerId: string;
}

const RESOURCE_COLORS = ['#9333ea', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];

export function ManageResourcesCard({ providerId }: ManageResourcesCardProps) {
  const { data: resources = [], isLoading } = useProviderResources(providerId);
  const createMutation = useCreateResource();
  const deleteMutation = useDeleteResource();

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<ResourceType>('room');

  const handleCreate = async () => {
    if (!name.trim()) return;
    const color = RESOURCE_COLORS[resources.length % RESOURCE_COLORS.length];
    await createMutation.mutateAsync({ providerId, name: name.trim(), type, color });
    setName('');
    setShowForm(false);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Building2 className="h-4 w-4 text-purple-600" />
            Salas y recursos
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs gap-1"
            onClick={() => setShowForm(!showForm)}
          >
            <Plus className="h-3.5 w-3.5" />
            Agregar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {showForm && (
          <div className="flex items-end gap-2 p-2 rounded bg-muted/30 border">
            <div className="flex-1">
              <Input
                placeholder="Nombre (ej: Sala 1, Quirófano)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <Select value={type} onValueChange={(v) => setType(v as ResourceType)}>
              <SelectTrigger className="w-32 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(RESOURCE_TYPE_LABELS) as ResourceType[]).map((t) => (
                  <SelectItem key={t} value={t}>
                    {RESOURCE_TYPE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              className="h-8 text-xs"
              onClick={handleCreate}
              disabled={!name.trim()}
            >
              Crear
            </Button>
          </div>
        )}

        {resources.length === 0 && !isLoading ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            Sin salas configuradas. Agrega salas para organizar tu agenda.
          </p>
        ) : (
          <div className="space-y-1">
            {resources.map((r) => (
              <div key={r.id} className="flex items-center gap-2 p-2 rounded hover:bg-muted/20">
                <div
                  className="h-3 w-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: r.color }}
                />
                <span className="text-sm flex-1">{r.name}</span>
                <Badge variant="secondary" className="text-[9px]">
                  {RESOURCE_TYPE_LABELS[r.type as ResourceType]}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-destructive"
                  onClick={() => deleteMutation.mutate({ resourceId: r.id, providerId })}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
