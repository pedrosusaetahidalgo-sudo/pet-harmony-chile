import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { FileText, Download, Upload, Trash2, UserCheck } from '@/lib/icons';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useMedicalDocuments, MedicalDocument } from '@/hooks/useMedicalDocuments';
import { UploadMedicalDocumentDialog } from '@/components/medical/UploadMedicalDocumentDialog';
import { downloadFile } from '@/lib/nativeDownload';
import { useAuth } from '@/hooks/useAuth';
import { formatShortDate } from '../helpers';
import { EmptyState } from '@/components/ui/EmptyState';
import { getDocTypeLabel } from '../shared';

interface TabDocumentosProps {
  petId: string;
  /** 'owner' (default) or 'vet' — determines uploaded_by_role for new uploads */
  viewMode?: 'owner' | 'vet';
  /** The pet owner's user ID — needed to allow the pet owner to delete vet-uploaded docs */
  petOwnerId?: string;
}

export function TabDocumentos({ petId, viewMode = 'owner', petOwnerId }: TabDocumentosProps) {
  const { user } = useAuth();
  const {
    documents,
    isLoading,
    getDownloadUrl,
    deleteDocument,
    isDeleting,
    downloadAllAsZip,
    isGeneratingZip,
  } = useMedicalDocuments(petId);
  const [uploadOpen, setUploadOpen] = useState(false);

  const handleDownload = useCallback(
    async (doc: MedicalDocument) => {
      try {
        const url = await getDownloadUrl(doc);
        await downloadFile(url, doc.title || 'documento');
      } catch {
        toast.error('Error al obtener el enlace de descarga');
      }
    },
    [getDownloadUrl]
  );

  const handleDelete = useCallback(
    async (doc: MedicalDocument) => {
      if (!confirm('¿Seguro que quieres eliminar este documento?')) return;
      try {
        await deleteDocument(doc.id, petOwnerId);
      } catch {
        // Error handled in hook
      }
    },
    [deleteDocument, petOwnerId]
  );

  /** Can the current user delete this document? */
  const canDelete = useCallback(
    (doc: MedicalDocument) => {
      if (!user) return false;
      // The uploader can always delete
      if (doc.owner_id === user.id) return true;
      // The pet owner can also delete vet-uploaded docs
      if (petOwnerId && petOwnerId === user.id) return true;
      return false;
    },
    [user, petOwnerId]
  );

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* CTA para subir documentos — siempre visible (owner y vet) */}
      <Card className="border-dashed border-purple-300 bg-purple-50/50">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
              <Upload className="h-5 w-5 text-purple-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-purple-800">
                Sube recetas, exámenes y carnets
              </p>
              <p className="text-xs text-muted-foreground">
                JPG, PNG, HEIC o PDF — máx. 10 MB por archivo
              </p>
            </div>
          </div>
          <Button
            onClick={() => setUploadOpen(true)}
            className="bg-purple-600 hover:bg-purple-700 flex-shrink-0"
            size="sm"
          >
            <Upload className="h-4 w-4 mr-1" />
            Subir documento
          </Button>
        </CardContent>
      </Card>

      {/* Descargar todos como ZIP */}
      {documents && documents.length > 1 && (
        <Button
          variant="outline"
          size="sm"
          onClick={async () => {
            try {
              const result = await downloadAllAsZip();
              if (result?.url) {
                await downloadFile(result.url, 'documentos-medicos.zip');
              }
            } catch {
              // Error handled in hook
            }
          }}
          disabled={isGeneratingZip}
          className="w-full"
        >
          <Download className="h-4 w-4 mr-2" />
          {isGeneratingZip ? 'Generando ZIP...' : 'Descargar todos como ZIP'}
        </Button>
      )}

      {/* Lista de documentos o empty state */}
      {!documents || documents.length === 0 ? (
        <EmptyState
          variant="card"
          icon={FileText}
          title="Sin documentos aún"
          description="Sube fotos de recetas, resultados de laboratorio y carnets de vacunación para tenerlos siempre a mano."
        />
      ) : (
        documents.map((doc) => (
          <Card key={doc.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                  <FileText className="h-4 w-4 text-purple-600" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium truncate">{doc.title}</p>
                    {doc.uploaded_by_role === 'vet' && (
                      <Badge
                        variant="outline"
                        className="text-xs bg-teal-50 text-teal-700 border-teal-200"
                      >
                        <UserCheck className="h-3 w-3 mr-1" />
                        Subido por vet
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-xs">
                      {getDocTypeLabel(doc.type)}
                    </Badge>
                    {doc.issued_at && <span>{formatShortDate(doc.issued_at)}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button variant="ghost" size="sm" onClick={() => handleDownload(doc)}>
                  <Download className="h-4 w-4" />
                </Button>
                {canDelete(doc) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(doc)}
                    disabled={isDeleting}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))
      )}

      {/* Dialog de subida — pass viewMode so it sets uploaded_by_role */}
      <UploadMedicalDocumentDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        petId={petId}
        uploadedByRole={viewMode}
      />
    </div>
  );
}
