import { Link } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  BarChart3,
  Star,
  Mail,
  Users,
  ArrowRight,
  DollarSign,
  RefreshCw,
} from '@/lib/icons';
import { ProviderDirectoryCard } from '../ProviderDirectoryCard';
import { CreateServicePromotion } from '@/components/CreateServicePromotion';
import type { ProviderDashboardStats } from '@/hooks/useProviderDashboardStats';
import type { DailyVetActivity, VetSummary, ServiceBreakdown } from '@/hooks/useVetAnalytics';
import { formatCLP } from '@/lib/format';

interface BusinessTabProps {
  stats: ProviderDashboardStats;
  vetSummary: VetSummary | null;
  bookingsTimeline: DailyVetActivity[];
  serviceBreakdown: ServiceBreakdown[];
}

const SERVICE_COLORS = [
  '#9333ea',
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
];

const SERVICE_LABELS: Record<string, string> = {
  consulta: 'Consulta',
  vacuna: 'Vacunación',
  cirugia: 'Cirugía',
  dental: 'Dental',
  grooming: 'Peluquería',
  checkup: 'Control',
  emergencia: 'Emergencia',
  otro: 'Otro',
};

export function BusinessTab({
  stats,
  vetSummary,
  bookingsTimeline,
  serviceBreakdown,
}: BusinessTabProps) {
  const revenue = vetSummary?.revenue ?? stats.estimatedRevenue;
  const totalBookings = vetSummary?.totalBookings ?? stats.bookingsThisMonth;
  const avgTicket = totalBookings > 0 ? Math.round(revenue / totalBookings) : 0;
  const uniqueClients = vetSummary?.uniqueClients ?? stats.patientsThisMonth;

  // Sort breakdown by revenue descending
  const sortedBreakdown = [...serviceBreakdown]
    .sort((a, b) => b.revenue - a.revenue)
    .map((s) => ({
      ...s,
      label: SERVICE_LABELS[s.serviceType] || s.serviceType,
    }));

  const topService = sortedBreakdown[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      {/* Left: charts + revenue */}
      <div className="lg:col-span-3 space-y-4">
        {/* KPI Cards - 2 rows of 3 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {/* Ingresos */}
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <DollarSign className="h-3.5 w-3.5 text-green-600" />
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
                  Ingresos
                </span>
              </div>
              <p className="text-lg font-bold text-green-700">{formatCLP(revenue)}</p>
            </CardContent>
          </Card>

          {/* Ticket promedio */}
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingUp className="h-3.5 w-3.5 text-purple-600" />
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
                  Ticket promedio
                </span>
              </div>
              <p className="text-lg font-bold text-purple-700">
                {avgTicket > 0 ? formatCLP(avgTicket) : '—'}
              </p>
            </CardContent>
          </Card>

          {/* Clientes unicos */}
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Users className="h-3.5 w-3.5 text-blue-600" />
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
                  Clientes
                </span>
              </div>
              <p className="text-lg font-bold">{uniqueClients}</p>
            </CardContent>
          </Card>

          {/* Total reservas */}
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <BarChart3 className="h-3.5 w-3.5 text-indigo-600" />
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
                  Reservas
                </span>
              </div>
              <p className="text-lg font-bold">{totalBookings}</p>
            </CardContent>
          </Card>

          {/* Rating */}
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Star className="h-3.5 w-3.5 text-yellow-500" />
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
                  Rating
                </span>
              </div>
              <p className="text-lg font-bold">
                {stats.avgRating ? stats.avgRating.toFixed(1) : '—'}
              </p>
              {stats.totalReviews > 0 && (
                <p className="text-[10px] text-muted-foreground">{stats.totalReviews} reseñas</p>
              )}
            </CardContent>
          </Card>

          {/* Servicio top */}
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <RefreshCw className="h-3.5 w-3.5 text-teal-600" />
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
                  Servicio top
                </span>
              </div>
              {topService ? (
                <>
                  <p className="text-sm font-bold truncate">{topService.label}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {topService.count} reservas · {formatCLP(topService.revenue)}
                  </p>
                </>
              ) : (
                <p className="text-lg font-bold text-muted-foreground">—</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Bookings timeline chart */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-purple-600" />
                Reservas del periodo
              </CardTitle>
              <Link to="/panel-pro">
                <Button variant="ghost" size="sm" className="text-xs gap-1 text-purple-600">
                  Ver analytics completos
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {bookingsTimeline.length > 0 ? (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={bookingsTimeline}>
                    <defs>
                      <linearGradient id="bookingsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#9333ea" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#9333ea" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(d) => new Date(d).getDate().toString()}
                      tick={{ fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      labelFormatter={(d) =>
                        new Date(d).toLocaleDateString('es-CL', {
                          day: 'numeric',
                          month: 'short',
                        })
                      }
                      formatter={(v: number, name: string) => [
                        name === 'revenue' ? formatCLP(v) : v,
                        name === 'revenue' ? 'Ingreso' : 'Reservas',
                      ]}
                      contentStyle={{ fontSize: 12 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="bookings"
                      stroke="#9333ea"
                      strokeWidth={2}
                      fill="url(#bookingsGrad)"
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                Sin reservas en este periodo. Comparte tu perfil para recibir mas.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Service breakdown chart */}
        {sortedBreakdown.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                Ingresos por servicio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sortedBreakdown} layout="vertical" margin={{ left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                    <XAxis
                      type="number"
                      tickFormatter={(v) => formatCLP(v)}
                      tick={{ fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="label"
                      width={90}
                      tick={{ fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      formatter={(v: number) => [formatCLP(v), 'Ingreso']}
                      labelFormatter={(l) => `${l}`}
                      contentStyle={{ fontSize: 12 }}
                    />
                    <Bar dataKey="revenue" radius={[0, 4, 4, 0]} barSize={20}>
                      {sortedBreakdown.map((_, idx) => (
                        <Cell key={idx} fill={SERVICE_COLORS[idx % SERVICE_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Service promotion */}
        <CreateServicePromotion />
      </div>

      {/* Right: profile + actions */}
      <div className="lg:col-span-2 space-y-4">
        <ProviderDirectoryCard />

        {/* Resenas + invitaciones */}
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Mail className="h-3.5 w-3.5 text-pink-500" />
              <span className="text-xs font-medium">Reseñas del periodo</span>
            </div>
            <p className="text-2xl font-bold">{stats.reviewsThisMonth}</p>
            {stats.invitationsSent > 0 && (
              <p className="text-[10px] text-muted-foreground mt-1">
                {stats.invitationsConverted}/{stats.invitationsSent} invitaciones usadas
              </p>
            )}
          </CardContent>
        </Card>

        {/* Visibility tip */}
        {!stats.isDirectoryVisible && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-3">
              <p className="text-xs font-medium text-amber-800">
                Tu perfil no es visible en el directorio
              </p>
              <p className="text-[11px] text-amber-600 mt-0.5">
                Activa la visibilidad en "Editar perfil" para que los duenos te encuentren.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
