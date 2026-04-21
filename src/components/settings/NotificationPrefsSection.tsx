import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell, Mail, Smartphone, MessageCircle } from '@/lib/icons';
import {
  useNotificationPrefs,
  useSetNotificationPref,
  type NotificationPrefs,
} from '@/hooks/useNotificationPrefs';

/**
 * Sección de Settings (usada en Profile) con toggles granulares de
 * notificaciones. Epica D.4 auditoría top-tier 2026-04-21.
 *
 * Agrupado por categoría para UX clara. Cada fila es un switch.
 */

interface ToggleRow {
  key: keyof NotificationPrefs;
  label: string;
  icon?: React.ElementType;
}

interface Category {
  title: string;
  description: string;
  rows: ToggleRow[];
}

const CATEGORIES: Category[] = [
  {
    title: 'Cuentas y mascotas',
    description:
      'Reservas, pagos, invitaciones de co-dueños y cambios en la ficha. Recomendamos dejarlas activas.',
    rows: [
      { key: 'transactional_push', label: 'Push al celular', icon: Smartphone },
      { key: 'transactional_email', label: 'Email', icon: Mail },
    ],
  },
  {
    title: 'Recordatorios de salud',
    description: 'Vacunas, controles y medicación que vence pronto.',
    rows: [
      { key: 'pet_reminders_push', label: 'Push al celular', icon: Smartphone },
      { key: 'pet_reminders_email', label: 'Email', icon: Mail },
    ],
  },
  {
    title: 'Resumen diario (8 AM)',
    description: 'Un resumen cada mañana de lo que vence en las próximas 48 h.',
    rows: [
      { key: 'daily_digest_in_app', label: 'Notificación dentro de la app', icon: Bell },
      { key: 'daily_digest_push', label: 'Push al celular', icon: Smartphone },
      { key: 'daily_digest_email', label: 'Email', icon: Mail },
    ],
  },
  {
    title: 'Reporte semanal (domingo)',
    description: 'Tendencias de salud, recordatorios cumplidos e insights por mascota.',
    rows: [
      { key: 'weekly_digest_email', label: 'Email', icon: Mail },
      { key: 'weekly_digest_push', label: 'Push al celular', icon: Smartphone },
    ],
  },
  {
    title: 'Social (feed, followers, likes)',
    description: 'Cuando alguien sigue tu cuenta, comenta o reacciona.',
    rows: [
      { key: 'social_in_app', label: 'Dentro de la app', icon: Bell },
      { key: 'social_push', label: 'Push al celular', icon: Smartphone },
    ],
  },
  {
    title: 'Gamificación (Paw Points, misiones)',
    description: 'Logros, nuevos niveles, Paw Cards desbloqueadas.',
    rows: [
      { key: 'gamification_in_app', label: 'Dentro de la app', icon: Bell },
      { key: 'gamification_push', label: 'Push al celular', icon: Smartphone },
    ],
  },
  {
    title: 'Novedades Paw Friend',
    description: 'Nuevas features, tips y encuestas puntuales. Bajo volumen (< 1 al mes).',
    rows: [
      { key: 'marketing_email', label: 'Email', icon: Mail },
      { key: 'marketing_push', label: 'Push al celular', icon: Smartphone },
    ],
  },
];

export function NotificationPrefsSection() {
  const { data: prefs, isLoading } = useNotificationPrefs();
  const setPref = useSetNotificationPref();

  if (isLoading || !prefs) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            Notificaciones
          </CardTitle>
          <CardDescription>Elegí cómo querés que te avisemos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" />
          Notificaciones
        </CardTitle>
        <CardDescription>
          Elegí cómo querés que te avisemos. Podes cambiar esto cuando quieras.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {CATEGORIES.map((cat) => (
          <div key={cat.title} className="space-y-3">
            <div>
              <h3 className="font-semibold text-sm">{cat.title}</h3>
              <p className="text-xs text-muted-foreground">{cat.description}</p>
            </div>
            <div className="space-y-2 pl-1">
              {cat.rows.map((row) => {
                const Icon = row.icon ?? MessageCircle;
                const value = prefs[row.key];
                return (
                  <div key={row.key} className="flex items-center justify-between gap-3">
                    <Label
                      htmlFor={`pref-${row.key}`}
                      className="flex items-center gap-2 text-sm font-normal cursor-pointer"
                    >
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                      {row.label}
                    </Label>
                    <Switch
                      id={`pref-${row.key}`}
                      checked={value}
                      disabled={setPref.isPending}
                      onCheckedChange={(checked) =>
                        setPref.mutate({ key: row.key, value: checked })
                      }
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
