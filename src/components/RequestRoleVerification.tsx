import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  Loader2,
  Upload,
  FileCheck,
  Briefcase,
  Home,
  Stethoscope,
  GraduationCap,
  Scissors,
} from '@/lib/icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { logger } from '@/lib/logger';

type ServiceRole = 'dog_walker' | 'dogsitter' | 'veterinarian' | 'trainer' | 'groomer';

interface RoleRequestFormData {
  requested_role: ServiceRole;
  notes: string;
}

interface RequestRoleVerificationProps {
  defaultRole?: ServiceRole;
}

export const RequestRoleVerification = ({ defaultRole }: RequestRoleVerificationProps) => {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [documentUrls, setDocumentUrls] = useState<string[]>([]);
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<RoleRequestFormData>({
    defaultValues: {
      requested_role: defaultRole,
    },
  });

  const requestedRole = watch('requested_role');

  // Check existing requests
  const { data: existingRequest } = useQuery({
    queryKey: ['role-verification-request'],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      const { data } = await supabase
        .from('verification_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      return data;
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingDocument(true);
    try {
      const uploadedUrls: string[] = [];

      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('verification-docs')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from('verification-docs').getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
      }

      setDocumentUrls([...documentUrls, ...uploadedUrls]);
      toast.success('Documento(s) subido(s) correctamente');
    } catch (error) {
      logger.error('Error uploading document:', error);
      toast.error('Error al subir el documento');
    } finally {
      setUploadingDocument(false);
    }
  };

  const onSubmit = async (data: RoleRequestFormData) => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('No autenticado');

      // Require at least one document for roles that need verification
      const docRequiredRoles: Record<string, string> = {
        veterinarian: 'Los veterinarios deben subir su título profesional',
        trainer: 'Los entrenadores deben subir su certificación',
        groomer: 'Los peluqueros deben subir su certificación o acreditación',
        dog_walker: 'Los paseadores deben verificar su identidad (cédula o documento)',
        dogsitter: 'Los cuidadores deben verificar su identidad (cédula o documento)',
      };
      if (documentUrls.length === 0 && docRequiredRoles[data.requested_role]) {
        toast.error(docRequiredRoles[data.requested_role]);
        setLoading(false);
        return;
      }

      const { data: insertedRequest, error } = await supabase
        .from('verification_requests')
        .insert({
          user_id: user.id,
          requested_role: data.requested_role as Database['public']['Enums']['app_role'],
          notes: data.notes,
          document_urls: documentUrls,
          status: 'pendiente',
        })
        .select('id')
        .single();

      if (error) throw error;

      toast.success('Solicitud enviada. Verificando automáticamente...');
      setDocumentUrls([]);

      // Trigger AI auto-verification in background
      if (insertedRequest?.id) {
        supabase.functions
          .invoke('verify-service-provider', {
            body: { verification_request_id: insertedRequest.id },
          })
          .then(({ data: verifyResult }) => {
            if (verifyResult?.status === 'aprobado') {
              toast.success('¡Verificación aprobada! Ya puedes ofrecer tus servicios.');
            } else if (verifyResult?.status === 'rechazado') {
              const reason = verifyResult?.verification?.reason || 'Revisa tu perfil y documentos.';
              toast.info(`Tu solicitud necesita ajustes: ${reason}`);
            }
            // Refresh the existing request query
            queryClient.invalidateQueries({ queryKey: ['role-verification-request'] });
          })
          .catch(() => {
            // AI verification failed silently — request stays as 'pendiente' for manual review
            toast.info('La verificación automática no está disponible. Será revisada manualmente.');
          });
      }
    } catch (error) {
      logger.error('Error:', error);
      toast.error('Error al enviar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'dog_walker':
        return <Briefcase className="h-5 w-5" />;
      case 'dogsitter':
        return <Home className="h-5 w-5" />;
      case 'veterinarian':
        return <Stethoscope className="h-5 w-5" />;
      case 'trainer':
        return <GraduationCap className="h-5 w-5" />;
      case 'groomer':
        return <Scissors className="h-5 w-5" />;
      default:
        return null;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'dog_walker':
        return 'Paseador de Perros';
      case 'dogsitter':
        return 'Cuidador de Mascotas';
      case 'veterinarian':
        return 'Veterinario a Domicilio';
      case 'trainer':
        return 'Entrenador Canino';
      case 'groomer':
        return 'Peluquero de Mascotas';
      default:
        return role;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pendiente':
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
            Pendiente
          </Badge>
        );
      case 'aprobado':
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800">
            Aprobado
          </Badge>
        );
      case 'rechazado':
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800">
            Rechazado
          </Badge>
        );
      default:
        return null;
    }
  };

  if (existingRequest && existingRequest.status === 'pendiente') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Solicitud en Revisión</CardTitle>
          <CardDescription>Tu solicitud está siendo revisada por nuestro equipo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                {getRoleIcon(existingRequest.requested_role)}
                <div>
                  <p className="font-semibold">{getRoleLabel(existingRequest.requested_role)}</p>
                  <p className="text-sm text-muted-foreground">
                    Solicitado el {new Date(existingRequest.created_at).toLocaleDateString('es-CL')}
                  </p>
                </div>
              </div>
              {getStatusBadge(existingRequest.status)}
            </div>
            {existingRequest.notes && (
              <div>
                <Label>Notas adicionales:</Label>
                <p className="text-sm text-muted-foreground mt-1">{existingRequest.notes}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Solicitar Verificación Profesional</CardTitle>
        <CardDescription>Conviértete en proveedor de servicios verificado</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="requested_role">Tipo de Servicio</Label>
            <Select
              defaultValue={defaultRole}
              onValueChange={(value) =>
                setValue('requested_role', value as RoleRequestFormData['requested_role'])
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el tipo de servicio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dog_walker">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Paseador de Perros
                  </div>
                </SelectItem>
                <SelectItem value="dogsitter">
                  <div className="flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    Cuidador de Mascotas
                  </div>
                </SelectItem>
                <SelectItem value="veterinarian">
                  <div className="flex items-center gap-2">
                    <Stethoscope className="h-4 w-4" />
                    Veterinario a Domicilio
                  </div>
                </SelectItem>
                <SelectItem value="trainer">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    Entrenador Canino
                  </div>
                </SelectItem>
                <SelectItem value="groomer">
                  <div className="flex items-center gap-2">
                    <Scissors className="h-4 w-4" />
                    Peluquero de Mascotas
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {errors.requested_role && (
              <p className="text-sm text-red-500">Este campo es requerido</p>
            )}
          </div>

          {requestedRole && (
            <div className="space-y-2">
              <Label htmlFor="document-upload">
                {requestedRole === 'veterinarian'
                  ? 'Título Profesional (Requerido)'
                  : 'Documento de Identidad (Requerido)'}
              </Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <input
                  type="file"
                  id="document-upload"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png"
                  multiple
                  onChange={handleFileUpload}
                />
                <label htmlFor="document-upload" className="cursor-pointer">
                  {uploadingDocument ? (
                    <Loader2 className="h-10 w-10 mx-auto mb-3 animate-spin text-primary" />
                  ) : (
                    <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                  )}
                  <p className="text-sm font-medium mb-1">
                    {uploadingDocument
                      ? 'Subiendo...'
                      : requestedRole === 'veterinarian'
                        ? 'Sube tu título de veterinario'
                        : 'Sube tu cédula de identidad'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {requestedRole === 'veterinarian'
                      ? 'Foto o PDF de tu título universitario (para verificación automática usa JPG/PNG)'
                      : 'Foto de tu cédula (puedes tapar datos sensibles)'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">PDF, JPG o PNG (máx. 20MB)</p>
                </label>
              </div>
              {documentUrls.length > 0 && (
                <div className="space-y-2">
                  {documentUrls.map((url, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                      <FileCheck className="h-4 w-4 text-green-500" />
                      <span className="text-sm flex-1">Documento {index + 1}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setDocumentUrls(documentUrls.filter((_, i) => i !== index))}
                      >
                        Eliminar
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">
              Información Adicional
              {requestedRole !== 'veterinarian' && ' (Opcional)'}
            </Label>
            <Textarea
              id="notes"
              placeholder="Experiencia, certificaciones, referencias, etc."
              rows={4}
              {...register('notes', { required: requestedRole !== 'veterinarian' })}
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              'Enviar Solicitud'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
