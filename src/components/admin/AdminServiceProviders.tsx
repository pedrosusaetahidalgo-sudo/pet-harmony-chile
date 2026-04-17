/**
 * Panel de administración para el sistema centralizado de proveedores
 *
 * FLUJO DE APROBACIÓN:
 * - No-vets (paseadores, cuidadores, entrenadores, groomers): auto-aprobados por trigger DB
 *   si tienen datos completos (nombre, comuna, bio 20+ chars, 1 servicio activo)
 * - Vets: requieren verificación Colmevet (manual o IA-assisted)
 * - Providers incompletos: quedan como 'pending' hasta completar perfil
 */

import { useState, useMemo } from 'react';
import {
  useAdminServiceProviders,
  SERVICE_TYPE_LABELS,
  SERVICE_TYPE_ICONS,
  type ServiceProvider,
  type ProviderStatus,
} from '@/hooks/useServiceProviders';
import { useAdminAudit } from '@/hooks/useAdminAudit';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  CheckCircle,
  XCircle,
  Eye,
  Search,
  Filter,
  Users,
  Clock,
  ShieldCheck,
  ShieldX,
  AlertCircle,
  Star,
  MapPin,
  Briefcase,
  ChevronLeft,
  ChevronRight,
} from '@/lib/icons';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

const STATUS_CONFIG: Record<
  ProviderStatus,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  approved: { label: 'Aprobado', variant: 'default' },
  pending: { label: 'Pendiente', variant: 'secondary' },
  rejected: { label: 'Rechazado', variant: 'destructive' },
  suspended: { label: 'Suspendido', variant: 'outline' },
};

const PAGE_SIZE = 20;

const AdminServiceProviders = () => {
  const { allProviders, isLoading, stats, updateProviderStatus, verifyProvider } =
    useAdminServiceProviders();
  const { logAction } = useAdminAudit();

  const [selectedProvider, setSelectedProvider] = useState<ServiceProvider | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(0);

  // Filtrar proveedores
  const filteredProviders = useMemo(
    () =>
      allProviders?.filter((provider) => {
        const matchesSearch =
          !searchTerm ||
          provider.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          provider.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          provider.commune?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || provider.status === statusFilter;

        const matchesService =
          serviceFilter === 'all' ||
          provider.services?.some((s) => s.service_type === serviceFilter);

        return matchesSearch && matchesStatus && matchesService;
      }) || [],
    [allProviders, searchTerm, statusFilter, serviceFilter]
  );

  // Pagination
  const totalPages = Math.ceil(filteredProviders.length / PAGE_SIZE);
  const paginatedProviders = filteredProviders.slice(
    currentPage * PAGE_SIZE,
    (currentPage + 1) * PAGE_SIZE
  );

  // Reset page when filters change
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(0);
  };
  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(0);
  };
  const handleServiceFilterChange = (value: string) => {
    setServiceFilter(value);
    setCurrentPage(0);
  };

  // Selection helpers
  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedProviders.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedProviders.map((p) => p.id)));
    }
  };

  const clearSelection = () => setSelectedIds(new Set());

  // Bulk actions
  const handleBulkApprove = async () => {
    const ids = Array.from(selectedIds);
    try {
      await Promise.all(
        ids.map((id) => updateProviderStatus.mutateAsync({ providerId: id, status: 'approved' }))
      );
      ids.forEach((id) =>
        logAction('provider.approve', 'provider', id, { new_status: 'approved', bulk: true })
      );
      toast.success(`${ids.length} proveedores aprobados`);
      clearSelection();
    } catch {
      toast.error('Error al aprobar proveedores');
    }
  };

  const handleBulkSuspend = async () => {
    const ids = Array.from(selectedIds);
    try {
      await Promise.all(
        ids.map((id) => updateProviderStatus.mutateAsync({ providerId: id, status: 'suspended' }))
      );
      ids.forEach((id) =>
        logAction('provider.suspend', 'provider', id, { new_status: 'suspended', bulk: true })
      );
      toast.success(`${ids.length} proveedores suspendidos`);
      clearSelection();
    } catch {
      toast.error('Error al suspender proveedores');
    }
  };

  const handleStatusChange = async (providerId: string, newStatus: ProviderStatus) => {
    if (newStatus === 'rejected' && !rejectionReason) {
      return;
    }

    await updateProviderStatus.mutateAsync({
      providerId,
      status: newStatus,
      rejectionReason: newStatus === 'rejected' ? rejectionReason : undefined,
    });

    logAction(
      `provider.${newStatus === 'approved' ? 'approve' : newStatus === 'rejected' ? 'reject' : 'suspend'}`,
      'provider',
      providerId,
      { new_status: newStatus }
    );

    setRejectionReason('');
    setSelectedProvider(null);
  };

  const handleVerify = async (providerId: string, verified: boolean) => {
    await verifyProvider.mutateAsync({ providerId, verified });
    logAction('provider.verify', 'provider', providerId, { verified });
  };

  if (isLoading) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-indigo-500/10">
              <Users className="h-7 w-7 text-indigo-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
              <p className="text-xs text-slate-400">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-500/10">
              <CheckCircle className="h-7 w-7 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.approved}</p>
              <p className="text-xs text-slate-400">Aprobados</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-yellow-500/10">
              <Clock className="h-7 w-7 text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.pending}</p>
              <p className="text-xs text-slate-400">Pendientes</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-red-500/10">
              <XCircle className="h-7 w-7 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.rejected}</p>
              <p className="text-xs text-slate-400">Rechazados</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-500/10">
              <ShieldCheck className="h-7 w-7 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.verified}</p>
              <p className="text-xs text-slate-400">Verificados</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Nota sobre flujo de aprobación */}
      <Card className="bg-indigo-950/30 border-indigo-500/30">
        <CardContent className="p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-indigo-400 mt-0.5" />
          <div>
            <p className="font-medium text-indigo-300">Aprobacion inteligente activa</p>
            <p className="text-sm text-indigo-300/80">
              Paseadores, cuidadores, entrenadores y groomers se auto-aprueban si tienen datos
              completos. Veterinarios requieren verificacion Colmevet. Proveedores incompletos
              quedan como pendientes.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Filtros y búsqueda */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Briefcase className="h-5 w-5 text-slate-400" />
            Proveedores de Servicios Centralizados
          </CardTitle>
          <CardDescription className="text-slate-400">
            Base unica de todos los proveedores de servicios en la plataforma
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Buscar por nombre, ciudad..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
            <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
              <SelectTrigger className="w-full md:w-[180px] bg-slate-800 border-slate-700 text-white">
                <Filter className="h-4 w-4 mr-2 text-slate-400" />
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="approved">Aprobados</SelectItem>
                <SelectItem value="pending">Pendientes</SelectItem>
                <SelectItem value="rejected">Rechazados</SelectItem>
                <SelectItem value="suspended">Suspendidos</SelectItem>
              </SelectContent>
            </Select>
            <Select value={serviceFilter} onValueChange={handleServiceFilterChange}>
              <SelectTrigger className="w-full md:w-[200px] bg-slate-800 border-slate-700 text-white">
                <SelectValue placeholder="Tipo de servicio" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all">Todos los servicios</SelectItem>
                <SelectItem value="dog_walker">Paseadores</SelectItem>
                <SelectItem value="dogsitter">Cuidadores</SelectItem>
                <SelectItem value="veterinarian">Veterinarios</SelectItem>
                <SelectItem value="trainer">Entrenadores</SelectItem>
                <SelectItem value="grooming">Grooming</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bulk actions bar */}
          {selectedIds.size > 0 && (
            <div className="sticky top-0 z-10 flex items-center gap-3 p-3 rounded-lg bg-indigo-950/60 border border-indigo-500/30">
              <span className="text-sm font-medium text-indigo-300">
                {selectedIds.size} seleccionados
              </span>
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={handleBulkApprove}
              >
                Aprobar seleccionados
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-800"
                onClick={handleBulkSuspend}
              >
                Suspender seleccionados
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-slate-400 hover:text-white"
                onClick={clearSelection}
              >
                Deseleccionar
              </Button>
            </div>
          )}

          {/* Tabla de proveedores */}
          <div className="rounded-lg border border-slate-800 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800 hover:bg-transparent">
                  <TableHead className="text-slate-400 uppercase text-xs font-semibold tracking-wider w-10">
                    <input
                      type="checkbox"
                      checked={
                        paginatedProviders.length > 0 &&
                        selectedIds.size === paginatedProviders.length
                      }
                      onChange={toggleSelectAll}
                      aria-label="Seleccionar todos los proveedores"
                      className="rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                    />
                  </TableHead>
                  <TableHead className="text-slate-400 uppercase text-xs font-semibold tracking-wider">
                    Proveedor
                  </TableHead>
                  <TableHead className="text-slate-400 uppercase text-xs font-semibold tracking-wider">
                    Servicios
                  </TableHead>
                  <TableHead className="text-slate-400 uppercase text-xs font-semibold tracking-wider">
                    Ubicacion
                  </TableHead>
                  <TableHead className="text-slate-400 uppercase text-xs font-semibold tracking-wider">
                    Rating
                  </TableHead>
                  <TableHead className="text-slate-400 uppercase text-xs font-semibold tracking-wider">
                    Estado
                  </TableHead>
                  <TableHead className="text-slate-400 uppercase text-xs font-semibold tracking-wider">
                    Verificado
                  </TableHead>
                  <TableHead className="text-slate-400 uppercase text-xs font-semibold tracking-wider">
                    Fecha
                  </TableHead>
                  <TableHead className="text-slate-400 uppercase text-xs font-semibold tracking-wider">
                    Acciones
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedProviders.length === 0 ? (
                  <TableRow className="border-slate-800">
                    <TableCell colSpan={9} className="text-center py-8 text-slate-500">
                      No se encontraron proveedores
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedProviders.map((provider, idx) => (
                    <TableRow
                      key={provider.id}
                      className={`border-slate-800 hover:bg-slate-800/50 transition-colors ${
                        idx % 2 === 1 ? 'bg-slate-900/50' : ''
                      } ${selectedIds.has(provider.id) ? 'bg-indigo-950/30' : ''}`}
                    >
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(provider.id)}
                          onChange={() => toggleSelection(provider.id)}
                          aria-label={`Seleccionar proveedor ${provider.display_name ?? provider.id}`}
                          className="rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border border-slate-700">
                            <AvatarImage src={provider.avatar_url || undefined} />
                            <AvatarFallback className="bg-slate-800 text-slate-300">
                              {provider.display_name?.charAt(0) || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-white">
                              {provider.display_name || 'Sin nombre'}
                            </p>
                            <p className="text-xs text-slate-500">
                              {provider.experience_years || 0} anos exp.
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {provider.services?.map((service) => (
                            <Badge
                              key={service.id}
                              variant="outline"
                              className="text-xs border-slate-700 text-slate-300"
                            >
                              {
                                SERVICE_TYPE_ICONS[
                                  service.service_type as keyof typeof SERVICE_TYPE_ICONS
                                ]
                              }
                              {service.is_active ? '' : ' (inactivo)'}
                            </Badge>
                          ))}
                          {(!provider.services || provider.services.length === 0) && (
                            <span className="text-xs text-slate-500">Sin servicios</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {provider.commune || provider.city ? (
                          <div className="flex items-center gap-1 text-sm text-slate-300">
                            <MapPin className="h-3 w-3 text-slate-500" />
                            {provider.commune || provider.city}
                          </div>
                        ) : (
                          <span className="text-slate-600 text-xs">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          <span className="text-white">{provider.rating?.toFixed(1) || '0.0'}</span>
                          <span className="text-xs text-slate-500">
                            ({provider.total_reviews || 0})
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            STATUS_CONFIG[provider.status as ProviderStatus]?.variant || 'secondary'
                          }
                        >
                          {STATUS_CONFIG[provider.status as ProviderStatus]?.label ||
                            provider.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {provider.is_verified ? (
                          <ShieldCheck className="h-5 w-5 text-green-400" />
                        ) : (
                          <ShieldX className="h-5 w-5 text-slate-600" />
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {format(new Date(provider.created_at), 'dd/MM/yy', { locale: es })}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
                            onClick={() => setSelectedProvider(provider)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {!provider.is_verified && provider.status === 'approved' && (
                            <Button
                              size="sm"
                              className="bg-indigo-600 hover:bg-indigo-700 text-white"
                              onClick={() => handleVerify(provider.id, true)}
                            >
                              <ShieldCheck className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-slate-500">
                Mostrando {currentPage * PAGE_SIZE + 1}-
                {Math.min((currentPage + 1) * PAGE_SIZE, filteredProviders.length)} de{' '}
                {filteredProviders.length}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-slate-700 text-slate-300 hover:bg-slate-800"
                  disabled={currentPage === 0}
                  onClick={() => setCurrentPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>
                <span className="text-sm text-slate-400">
                  {currentPage + 1} / {totalPages}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-slate-700 text-slate-300 hover:bg-slate-800"
                  disabled={currentPage >= totalPages - 1}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de detalles del proveedor */}
      <Dialog open={!!selectedProvider} onOpenChange={() => setSelectedProvider(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Detalles del Proveedor</DialogTitle>
          </DialogHeader>

          {selectedProvider && (
            <Tabs defaultValue="perfil" className="w-full">
              <TabsList className="bg-slate-800 w-full">
                <TabsTrigger
                  value="perfil"
                  className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400"
                >
                  Perfil
                </TabsTrigger>
                <TabsTrigger
                  value="servicios"
                  className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400"
                >
                  Servicios
                </TabsTrigger>
                <TabsTrigger
                  value="metricas"
                  className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400"
                >
                  Metricas
                </TabsTrigger>
              </TabsList>

              {/* Tab Perfil */}
              <TabsContent value="perfil" className="space-y-6 mt-4">
                {/* Información básica */}
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16 border border-slate-700">
                    <AvatarImage src={selectedProvider.avatar_url || undefined} />
                    <AvatarFallback className="text-xl bg-slate-800 text-slate-300">
                      {selectedProvider.display_name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white">
                      {selectedProvider.display_name || 'Sin nombre'}
                    </h3>
                    <p className="text-slate-400">{selectedProvider.bio || 'Sin descripcion'}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-slate-300">
                      {selectedProvider.city && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4 text-slate-500" />{' '}
                          {selectedProvider.commune || selectedProvider.city}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        {selectedProvider.rating?.toFixed(1)} ({selectedProvider.total_reviews}{' '}
                        resenas)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Gestión de estado */}
                <div className="border-t border-slate-800 pt-4 space-y-4">
                  <h4 className="font-medium text-white">Gestionar Proveedor</h4>

                  <div className="flex items-center gap-4">
                    <span className="text-sm text-slate-400">Estado actual:</span>
                    <Badge
                      variant={STATUS_CONFIG[selectedProvider.status as ProviderStatus]?.variant}
                    >
                      {STATUS_CONFIG[selectedProvider.status as ProviderStatus]?.label}
                    </Badge>
                  </div>

                  {selectedProvider.status === 'rejected' && selectedProvider.rejection_reason && (
                    <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-lg">
                      <p className="text-sm text-red-300">
                        <strong>Motivo de rechazo:</strong> {selectedProvider.rejection_reason}
                      </p>
                    </div>
                  )}

                  {selectedProvider.status !== 'rejected' && (
                    <div className="space-y-2">
                      <label htmlFor="rejection-reason" className="text-sm text-slate-400">
                        Motivo de rechazo (requerido para rechazar):
                      </label>
                      <Textarea
                        id="rejection-reason"
                        placeholder="Ingrese el motivo de rechazo..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                      />
                    </div>
                  )}
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2">
                  {selectedProvider.status !== 'approved' && (
                    <Button
                      onClick={() => handleStatusChange(selectedProvider.id, 'approved')}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Aprobar
                    </Button>
                  )}

                  {selectedProvider.status !== 'rejected' && (
                    <Button
                      variant="destructive"
                      onClick={() => handleStatusChange(selectedProvider.id, 'rejected')}
                      disabled={!rejectionReason}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Rechazar
                    </Button>
                  )}

                  {selectedProvider.status === 'approved' && (
                    <Button
                      variant="outline"
                      className="border-slate-700 text-slate-300 hover:bg-slate-800"
                      onClick={() => handleStatusChange(selectedProvider.id, 'suspended')}
                    >
                      Suspender
                    </Button>
                  )}

                  <Button
                    variant={selectedProvider.is_verified ? 'outline' : 'default'}
                    className={
                      selectedProvider.is_verified
                        ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }
                    onClick={() => handleVerify(selectedProvider.id, !selectedProvider.is_verified)}
                  >
                    {selectedProvider.is_verified ? (
                      <>
                        <ShieldX className="h-4 w-4 mr-2" />
                        Quitar verificacion
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="h-4 w-4 mr-2" />
                        Verificar
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </TabsContent>

              {/* Tab Servicios */}
              <TabsContent value="servicios" className="mt-4">
                <div className="grid gap-2">
                  {selectedProvider.services?.map((service) => (
                    <div
                      key={service.id}
                      className="flex items-center justify-between p-3 border border-slate-800 rounded-lg bg-slate-800/50"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xl">
                          {
                            SERVICE_TYPE_ICONS[
                              service.service_type as keyof typeof SERVICE_TYPE_ICONS
                            ]
                          }
                        </span>
                        <div>
                          <p className="font-medium text-white">
                            {
                              SERVICE_TYPE_LABELS[
                                service.service_type as keyof typeof SERVICE_TYPE_LABELS
                              ]
                            }
                          </p>
                          <p className="text-sm text-slate-400">
                            ${service.price_base.toLocaleString('es-CL')} / {service.price_unit}
                          </p>
                        </div>
                      </div>
                      <Badge variant={service.is_active ? 'default' : 'secondary'}>
                        {service.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                  ))}
                  {(!selectedProvider.services || selectedProvider.services.length === 0) && (
                    <p className="text-slate-500 text-center py-4">
                      Este proveedor no ha registrado servicios aun
                    </p>
                  )}
                </div>
              </TabsContent>

              {/* Tab Metricas */}
              <TabsContent value="metricas" className="mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 border border-slate-800 rounded-lg bg-slate-800/50">
                    <p className="text-3xl font-bold text-white">
                      {selectedProvider.total_services_completed || 0}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">Servicios completados</p>
                  </div>
                  <div className="text-center p-4 border border-slate-800 rounded-lg bg-slate-800/50">
                    <div className="flex items-center justify-center gap-1">
                      <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                      <p className="text-3xl font-bold text-white">
                        {selectedProvider.rating?.toFixed(1) || '0.0'}
                      </p>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Rating promedio</p>
                  </div>
                  <div className="text-center p-4 border border-slate-800 rounded-lg bg-slate-800/50">
                    <p className="text-3xl font-bold text-white">
                      {selectedProvider.total_reviews || 0}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">Resenas totales</p>
                  </div>
                  <div className="text-center p-4 border border-slate-800 rounded-lg bg-slate-800/50">
                    <p className="text-3xl font-bold text-white">
                      {selectedProvider.experience_years || 0}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">Anos de experiencia</p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminServiceProviders;
