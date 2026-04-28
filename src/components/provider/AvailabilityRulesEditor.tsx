import { useState } from 'react';
import { Plus, Trash2, Clock, CalendarOff } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useProviderAvailabilityRules } from '@/hooks/useProviderAvailabilityRules';
import { AvailabilityPreview } from './AvailabilityPreview';

interface AvailabilityRulesEditorProps {
  providerId: string | undefined;
}

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
const DAY_SHORT = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];

const DURATION_OPTIONS = [
  { value: '15', label: '15 min' },
  { value: '20', label: '20 min' },
  { value: '30', label: '30 min' },
  { value: '45', label: '45 min' },
  { value: '60', label: '1 hora' },
  { value: '90', label: '1.5 horas' },
  { value: '120', label: '2 horas' },
];

export function AvailabilityRulesEditor({ providerId }: AvailabilityRulesEditorProps) {
  const {
    rules,
    exceptions,
    isLoadingRules,
    upsertRule,
    deleteRule,
    addException,
    deleteException,
  } = useProviderAvailabilityRules(providerId);

  // New rule form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDay, setNewDay] = useState('1'); // Monday
  const [newStart, setNewStart] = useState('09:00');
  const [newEnd, setNewEnd] = useState('13:00');
  const [newDuration, setNewDuration] = useState('30');
  const [newBuffer, setNewBuffer] = useState('0');

  // Exception form
  const [showExceptionForm, setShowExceptionForm] = useState(false);
  const [exDate, setExDate] = useState('');
  const [exReason, setExReason] = useState('');

  const handleAddRule = () => {
    if (!providerId) return;
    upsertRule.mutate({
      provider_id: providerId,
      day_of_week: parseInt(newDay),
      start_time: newStart + ':00',
      end_time: newEnd + ':00',
      slot_duration_minutes: parseInt(newDuration),
      buffer_minutes: parseInt(newBuffer),
      capacity: 1,
      is_active: true,
    });
    setShowAddForm(false);
  };

  const handleAddException = () => {
    if (!providerId || !exDate) return;
    addException.mutate({
      provider_id: providerId,
      exception_date: exDate,
      exception_type: 'block',
      reason: exReason || null,
    });
    setShowExceptionForm(false);
    setExDate('');
    setExReason('');
  };

  // Group rules by day
  const rulesByDay = new Map<number, typeof rules>();
  for (const rule of rules) {
    const existing = rulesByDay.get(rule.day_of_week) ?? [];
    existing.push(rule);
    rulesByDay.set(rule.day_of_week, existing);
  }

  if (isLoadingRules) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Horarios de atencion</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <AvailabilityPreview rules={rules} />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Horarios de atencion semanal
          </CardTitle>
          <CardDescription>
            Define tus horarios recurrentes. Los duenos veran estos horarios al reservar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Existing rules grouped by day */}
          {[1, 2, 3, 4, 5, 6, 0].map((day) => {
            const dayRules = rulesByDay.get(day) ?? [];
            if (dayRules.length === 0) return null;

            return (
              <div key={day} className="flex items-start gap-3 py-2 border-b last:border-0">
                <span className="text-sm font-medium w-20 pt-0.5">{DAY_SHORT[day]}</span>
                <div className="flex-1 space-y-1">
                  {dayRules.map((rule) => (
                    <div key={rule.id} className="flex items-center gap-2 text-sm">
                      <span>
                        {rule.start_time.substring(0, 5)} - {rule.end_time.substring(0, 5)}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {rule.slot_duration_minutes} min
                      </Badge>
                      {rule.buffer_minutes > 0 && (
                        <Badge variant="outline" className="text-xs">
                          +{rule.buffer_minutes} min buffer
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive"
                        onClick={() => deleteRule.mutate(rule.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {rules.length === 0 && !showAddForm && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No tienes horarios configurados. Agrega uno para que los duenos puedan reservar.
            </p>
          )}

          {/* Add rule form */}
          {showAddForm ? (
            <div className="border rounded-lg p-3 space-y-3 bg-muted/30">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Dia</Label>
                  <Select value={newDay} onValueChange={setNewDay}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                        <SelectItem key={d} value={d.toString()}>
                          {DAY_NAMES[d]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Duracion por cita</Label>
                  <Select value={newDuration} onValueChange={setNewDuration}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DURATION_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Desde</Label>
                  <Input
                    type="time"
                    value={newStart}
                    onChange={(e) => setNewStart(e.target.value)}
                    className="h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs">Hasta</Label>
                  <Input
                    type="time"
                    value={newEnd}
                    onChange={(e) => setNewEnd(e.target.value)}
                    className="h-9"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAddRule} disabled={upsertRule.isPending}>
                  Guardar
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowAddForm(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setShowAddForm(true)}
            >
              <Plus className="h-4 w-4 mr-1" /> Agregar horario
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Exceptions / Blocks */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarOff className="h-4 w-4" />
            Bloqueos y dias libres
          </CardTitle>
          <CardDescription>
            Marca dias especificos donde no atiendes (vacaciones, feriados, etc.)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {exceptions.map((ex) => (
            <div
              key={ex.id}
              className="flex items-center justify-between py-1.5 border-b last:border-0"
            >
              <div className="text-sm">
                <span className="font-medium">
                  {format(new Date(ex.exception_date + 'T12:00:00'), "EEEE d 'de' MMMM", {
                    locale: es,
                  })}
                </span>
                {ex.reason && <span className="text-muted-foreground ml-2">— {ex.reason}</span>}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-destructive"
                onClick={() => deleteException.mutate(ex.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}

          {showExceptionForm ? (
            <div className="border rounded-lg p-3 space-y-3 bg-muted/30">
              <div>
                <Label className="text-xs">Fecha</Label>
                <Input
                  type="date"
                  value={exDate}
                  onChange={(e) => setExDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="h-9"
                />
              </div>
              <div>
                <Label className="text-xs">Motivo (opcional)</Label>
                <Input
                  value={exReason}
                  onChange={(e) => setExReason(e.target.value)}
                  placeholder="Ej: Vacaciones, Feriado..."
                  className="h-9"
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAddException} disabled={addException.isPending}>
                  Guardar
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowExceptionForm(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setShowExceptionForm(true)}
            >
              <Plus className="h-4 w-4 mr-1" /> Bloquear dia
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
