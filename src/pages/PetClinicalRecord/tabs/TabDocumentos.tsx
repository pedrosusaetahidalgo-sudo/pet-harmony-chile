import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { FileText, Download, Upload } from '@/lib/icons';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useMedicalDocuments, MedicalDocument } from '@/hooks/useMedicalDocuments';
import { UploadMedicalDocumentDialog } from '@/components/medical/UploadMedicalDocumentDialog';
import { downloadFile } from '@/lib/nativeDownload';
import { formatShortDate } from '../helpers';
import { EmptyState, getDocTypeLabel } from '../shared';

export function TabDocumentos({ petId }: { petId: string }) {
  const { documents, isLoading, getDownloadUrl } = useMedicalDocuments(petId);
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
      {/* CTA para subir documentos — siempre visible */}
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

      {/* Lista de documentos o empty state */}
      {!documents || documents.length === 0 ? (
        <EmptyState
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
                  <p className="text-sm font-medium truncate">{doc.title}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-xs">
                      {getDocTypeLabel(doc.type)}
                    </Badge>
                    {doc.issued_at && <span>{formatShortDate(doc.issued_at)}</span>}
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDownload(doc)}
                className="flex-shrink-0"
              >
                <Download className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))
      )}

      {/* Dialog de subida */}
      <UploadMedicalDocumentDialog open={uploadOpen} onOpenChange={setUploadOpen} petId={petId} />
    </div>
  );
}
