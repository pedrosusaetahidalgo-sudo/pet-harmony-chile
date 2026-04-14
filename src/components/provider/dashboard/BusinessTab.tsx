import { Link } from 'react-router-dom';
import { Area, AreaChart, CartesianGrid, XAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, BarChart3, Star, Mail, Users, ArrowRight } from '@/lib/icons';
import { ProviderDirectoryCard } from '../ProviderDirectoryCard';
import { CreateServicePromotion } from '@/components/CreateServicePromotion';
import type { ProviderDashboardStats } from '@/hooks/useProviderDashboardStats';
import type { DailyVetActivity, VetSummary } from '@/hooks/useVetAnalytics';

const formatCLP = (amount: number) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(amount);

interface BusinessTabProps {
  stats: ProviderDashboardStats;
  vetSummary: VetSummary | null;
  bookingsTimeline: DailyVetActivity[];
}

export function BusinessTab({ stats, vetSummary, bookingsTimeline }: BusinessTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      {/* Left: charts + revenue */}
      <div className="lg:col-span-3 space-y-4">
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
                      formatter={(v: number) => [v, 'Reservas']}
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

        {/* Revenue + clients summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingUp className="h-3.5 w-3.5 text-green-600" />
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
                  Ingresos
                </span>
              </div>
              <p className="text-lg font-bold text-green-700">
                {formatCLP(vetSummary?.revenue ?? stats.estimatedRevenue)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Users className="h-3.5 w-3.5 text-blue-600" />
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
                  Clientes
                </span>
              </div>
              <p className="text-lg font-bold">
                {vetSummary?.uniqueClients ?? stats.patientsThisMonth}
              </p>
            </CardContent>
          </Card>
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
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Mail className="h-3.5 w-3.5 text-pink-500" />
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
                  Resenas
                </span>
              </div>
              <p className="text-lg font-bold">{stats.reviewsThisMonth}</p>
              {stats.invitationsSent > 0 && (
                <p className="text-[10px] text-muted-foreground">
                  {stats.invitationsConverted}/{stats.invitationsSent} invitaciones usadas
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Service promotion */}
        <CreateServicePromotion />
      </div>

      {/* Right: profile + actions */}
      <div className="lg:col-span-2 space-y-4">
        <ProviderDirectoryCard />

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
