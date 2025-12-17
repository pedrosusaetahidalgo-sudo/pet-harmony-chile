/**
 * Panel de administración para el sistema centralizado de proveedores
 * 
 * Este componente permite ver y gestionar todos los proveedores de servicios
 * desde una única interfaz, independientemente del tipo de servicio.
 * 
 * AUTO-APROBACIÓN ACTIVA: Actualmente todos los proveedores se aprueban automáticamente.
 * Para cambiar a aprobación manual:
 * 1. Modificar DEFAULT de columna status en service_providers a 'pending'
 * 2. Modificar función get_or_create_service_provider para usar 'pending'
 * 3. Los proveedores aparecerán aquí como "Pendiente" para revisión manual
 */

import { useState } from "react";
import { 
  useAdminServiceProviders, 
  SERVICE_TYPE_LABELS,
  SERVICE_TYPE_ICONS,
  type ServiceProvider,
  type ProviderStatus 
} from "@/hooks/useServiceProviders";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const STATUS_CONFIG: Record<ProviderStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  approved: { label: 'Aprobado', variant: 'default' },
  pending: { label: 'Pendiente', variant: 'secondary' },
  rejected: { label: 'Rechazado', variant: 'destructive' },
  suspended: { label: 'Suspendido', variant: 'outline' },
};

const AdminServiceProviders = () => {
  const { 
    allProviders, 
    isLoading, 
    stats, 
    updateProviderStatus, 
    verifyProvider 
  } = useAdminServiceProviders();
  
  const [selectedProvider, setSelectedProvider] = useState<ServiceProvider | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [serviceFilter, setServiceFilter] = useState<string>("all");
  const [rejectionReason, setRejectionReason] = useState("");

  // Filtrar proveedores
  const filteredProviders = allProviders?.filter(provider => {
    // Filtro de búsqueda
    const matchesSearch = !searchTerm || 
      provider.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      provider.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      provider.commune?.toLowerCase().includes(searchTerm.toLowerCase());

    // Filtro de estado
    const matchesStatus = statusFilter === "all" || provider.status === statusFilter;

    // Filtro de tipo de servicio
    const matchesService = serviceFilter === "all" || 
      provider.services?.some(s => s.service_type === serviceFilter);

    return matchesSearch && matchesStatus && matchesService;
  }) || [];

  const handleStatusChange = async (providerId: string, newStatus: ProviderStatus) => {
    if (newStatus === 'rejected' && !rejectionReason) {
      return;
    }
    
    await updateProviderStatus.mutateAsync({
      providerId,
      status: newStatus,
      rejectionReason: newStatus === 'rejected' ? rejectionReason : undefined,
    });
    
    setRejectionReason("");
    setSelectedProvider(null);
  };

  const handleVerify = async (providerId: string, verified: boolean) => {
    await verifyProvider.mutateAsync({ providerId, verified });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold">{stats.approved}</p>
              <p className="text-xs text-muted-foreground">Aprobados</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="h-8 w-8 text-yellow-500" />
            <div>
              <p className="text-2xl font-bold">{stats.pending}</p>
              <p className="text-xs text-muted-foreground">Pendientes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <XCircle className="h-8 w-8 text-red-500" />
            <div>
              <p className="text-2xl font-bold">{stats.rejected}</p>
              <p className="text-xs text-muted-foreground">Rechazados</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">{stats.verified}</p>
              <p className="text-xs text-muted-foreground">Verificados</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Nota sobre auto-aprobación */}
      <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950">
        <CardContent className="p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div>
            <p className="font-medium text-yellow-800 dark:text-yellow-200">Auto-aprobación activa</p>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              Actualmente todos los proveedores nuevos se aprueban automáticamente. 
              Para cambiar a aprobación manual, modificar el DEFAULT de la columna 'status' 
              en la tabla 'service_providers' de 'approved' a 'pending'.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Filtros y búsqueda */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Proveedores de Servicios Centralizados
          </CardTitle>
          <CardDescription>
            Base única de todos los proveedores de servicios en la plataforma
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, ciudad..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="approved">Aprobados</SelectItem>
                <SelectItem value="pending">Pendientes</SelectItem>
                <SelectItem value="rejected">Rechazados</SelectItem>
                <SelectItem value="suspended">Suspendidos</SelectItem>
              </SelectContent>
            </Select>
            <Select value={serviceFilter} onValueChange={setServiceFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Tipo de servicio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los servicios</SelectItem>
                <SelectItem value="dog_walker">🐕 Paseadores</SelectItem>
                <SelectItem value="dogsitter">🏠 Cuidadores</SelectItem>
                <SelectItem value="veterinarian">🩺 Veterinarios</SelectItem>
                <SelectItem value="trainer">🎓 Entrenadores</SelectItem>
                <SelectItem value="grooming">✂️ Grooming</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tabla de proveedores */}
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Servicios</TableHead>
                  <TableHead>Ubicación</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Verificado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProviders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No se encontraron proveedores
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProviders.map((provider) => (
                    <TableRow key={provider.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={provider.avatar_url || undefined} />
                            <AvatarFallback>
                              {provider.display_name?.charAt(0) || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{provider.display_name || 'Sin nombre'}</p>
                            <p className="text-xs text-muted-foreground">
                              {provider.experience_years || 0} años exp.
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {provider.services?.map((service) => (
                            <Badge key={service.id} variant="outline" className="text-xs">
                              {SERVICE_TYPE_ICONS[service.service_type as keyof typeof SERVICE_TYPE_ICONS]} 
                              {service.is_active ? '' : ' (inactivo)'}
                            </Badge>
                          ))}
                          {(!provider.services || provider.services.length === 0) && (
                            <span className="text-xs text-muted-foreground">Sin servicios</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {provider.commune || provider.city ? (
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="h-3 w-3" />
                            {provider.commune || provider.city}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          <span>{provider.rating?.toFixed(1) || '0.0'}</span>
                          <span className="text-xs text-muted-foreground">
                            ({provider.total_reviews || 0})
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_CONFIG[provider.status as ProviderStatus]?.variant || 'secondary'}>
                          {STATUS_CONFIG[provider.status as ProviderStatus]?.label || provider.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {provider.is_verified ? (
                          <ShieldCheck className="h-5 w-5 text-green-500" />
                        ) : (
                          <ShieldX className="h-5 w-5 text-muted-foreground" />
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {format(new Date(provider.created_at), 'dd/MM/yy', { locale: es })}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedProvider(provider)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {!provider.is_verified && provider.status === 'approved' && (
                            <Button
                              size="sm"
                              variant="default"
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
        </CardContent>
      </Card>

      {/* Dialog de detalles del proveedor */}
      <Dialog open={!!selectedProvider} onOpenChange={() => setSelectedProvider(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles del Proveedor</DialogTitle>
          </DialogHeader>
          
          {selectedProvider && (
            <div className="space-y-6">
              {/* Información básica */}
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedProvider.avatar_url || undefined} />
                  <AvatarFallback className="text-xl">
                    {selectedProvider.display_name?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{selectedProvider.display_name || 'Sin nombre'}</h3>
                  <p className="text-muted-foreground">{selectedProvider.bio || 'Sin descripción'}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    {selectedProvider.city && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" /> {selectedProvider.commune || selectedProvider.city}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500" /> 
                      {selectedProvider.rating?.toFixed(1)} ({selectedProvider.total_reviews} reseñas)
                    </span>
                  </div>
                </div>
              </div>

              {/* Servicios ofrecidos */}
              <div>
                <h4 className="font-medium mb-2">Servicios Ofrecidos</h4>
                <div className="grid gap-2">
                  {selectedProvider.services?.map((service) => (
                    <div key={service.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">
                          {SERVICE_TYPE_ICONS[service.service_type as keyof typeof SERVICE_TYPE_ICONS]}
                        </span>
                        <div>
                          <p className="font-medium">
                            {SERVICE_TYPE_LABELS[service.service_type as keyof typeof SERVICE_TYPE_LABELS]}
                          </p>
                          <p className="text-sm text-muted-foreground">
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
                    <p className="text-muted-foreground text-center py-4">
                      Este proveedor no ha registrado servicios aún
                    </p>
                  )}
                </div>
              </div>

              {/* Estadísticas */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 border rounded-lg">
                  <p className="text-2xl font-bold">{selectedProvider.experience_years || 0}</p>
                  <p className="text-xs text-muted-foreground">Años de experiencia</p>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <p className="text-2xl font-bold">{selectedProvider.total_services_completed || 0}</p>
                  <p className="text-xs text-muted-foreground">Servicios completados</p>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <p className="text-2xl font-bold">{selectedProvider.coverage_radius_km || 10} km</p>
                  <p className="text-xs text-muted-foreground">Radio de cobertura</p>
                </div>
              </div>

              {/* Gestión de estado */}
              <div className="border-t pt-4 space-y-4">
                <h4 className="font-medium">Gestionar Proveedor</h4>
                
                <div className="flex items-center gap-4">
                  <span className="text-sm">Estado actual:</span>
                  <Badge variant={STATUS_CONFIG[selectedProvider.status as ProviderStatus]?.variant}>
                    {STATUS_CONFIG[selectedProvider.status as ProviderStatus]?.label}
                  </Badge>
                </div>

                {selectedProvider.status === 'rejected' && selectedProvider.rejection_reason && (
                  <div className="p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                    <p className="text-sm text-red-700 dark:text-red-300">
                      <strong>Motivo de rechazo:</strong> {selectedProvider.rejection_reason}
                    </p>
                  </div>
                )}

                {/* Campo para motivo de rechazo */}
                {selectedProvider.status !== 'rejected' && (
                  <div className="space-y-2">
                    <label className="text-sm">Motivo de rechazo (requerido para rechazar):</label>
                    <Textarea
                      placeholder="Ingrese el motivo de rechazo..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                    />
                  </div>
                )}
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2">
                {selectedProvider.status !== 'approved' && (
                  <Button
                    onClick={() => handleStatusChange(selectedProvider.id, 'approved')}
                    className="bg-green-600 hover:bg-green-700"
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
                    onClick={() => handleStatusChange(selectedProvider.id, 'suspended')}
                  >
                    Suspender
                  </Button>
                )}

                <Button
                  variant={selectedProvider.is_verified ? "outline" : "default"}
                  onClick={() => handleVerify(selectedProvider.id, !selectedProvider.is_verified)}
                >
                  {selectedProvider.is_verified ? (
                    <>
                      <ShieldX className="h-4 w-4 mr-2" />
                      Quitar verificación
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4 mr-2" />
                      Verificar
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminServiceProviders;
