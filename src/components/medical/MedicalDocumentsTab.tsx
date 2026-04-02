/**
 * Medical Documents Tab Component
 * Displays and manages medical documents for a pet
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Upload, 
  FileText, 
  Download, 
  Eye, 
  Trash2, 
  FileCheck, 
  FileImage, 
  FileX, 
  Pill,
  Calendar,
  MoreVertical,
  FileDown,
  Share2,
  Loader2
} from "lucide-react";
import { useMedicalDocuments, MedicalDocumentType } from "@/hooks/useMedicalDocuments";
import { useMedicalSharing } from "@/hooks/useMedicalSharing";
import { UploadMedicalDocumentDialog } from "./UploadMedicalDocumentDialog";
import { MedicalSummaryButton } from "./MedicalSummaryButton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface MedicalDocumentsTabProps {
  petId: string;
}

const DOCUMENT_TYPE_LABELS: Record<MedicalDocumentType, string> = {
  vaccine_card: 'Tarjeta de Vacunación',
  id_card: 'Carnet de Identidad',
  lab_result: 'Resultado de Laboratorio',
  xray: 'Radiografía / Imagen',
  prescription: 'Receta Médica',
  other: 'Otro',
};

const DOCUMENT_TYPE_ICONS: Record<MedicalDocumentType, any> = {
  vaccine_card: FileCheck,
  id_card: FileText,
  lab_result: FileText,
  xray: FileImage,
  prescription: Pill,
  other: FileText,
};

export const MedicalDocumentsTab = ({ petId }: MedicalDocumentsTabProps) => {
  const { toast } = useToast();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<{ url: string; title: string; mimeType: string } | null>(null);
  
  const {
    documents,
    documentsByType,
    isLoading,
    uploadDocument,
    isUploading,
    deleteDocument,
    isDeleting,
    getDownloadUrl,
    downloadAllAsZip,
    isGeneratingZip,
  } = useMedicalDocuments(petId);

  const {
    tokens,
    createShareToken,
    isCreating: isCreatingShare,
    getShareUrl,
    revokeToken,
  } = useMedicalSharing(petId);

  const handleDownload = async (document: any) => {
    try {
      const url = await getDownloadUrl(document);
      window.open(url, '_blank');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo descargar el documento",
      });
    }
  };

  const handleView = async (document: any) => {
    try {
      const url = await getDownloadUrl(document);
      setViewingDocument({
        url,
        title: document.title,
        mimeType: document.mime_type,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo abrir el documento",
      });
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este documento?')) return;
    
    try {
      await deleteDocument(documentId);
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleDownloadAll = async () => {
    try {
      const result = await downloadAllAsZip();
      if (result?.download_url) {
        window.open(result.download_url, '_blank');
      }
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleCreateShareLink = async () => {
    try {
      const token = await createShareToken(30);
      const shareUrl = getShareUrl(token.token);
      
      // Copy to clipboard
      await navigator.clipboard.writeText(shareUrl);
      
      toast({
        title: "Enlace copiado",
        description: "El enlace de compartir ha sido copiado al portapapeles",
      });
    } catch (error) {
      // Error handled in hook
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
        <div>
          <h3 className="text-lg font-semibold">Documentos Médicos</h3>
          <p className="text-sm text-muted-foreground">
            {documents?.length || 0} documento{documents?.length !== 1 ? 's' : ''} guardado{documents?.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          {documents && documents.length > 0 && (
            <>
              <Button
                variant="outline"
                onClick={handleDownloadAll}
                disabled={isGeneratingZip}
              >
                {isGeneratingZip ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <FileDown className="h-4 w-4 mr-2" />
                    Descargar Todo (ZIP)
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleCreateShareLink}
                disabled={isCreatingShare}
              >
                {isCreatingShare ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <Share2 className="h-4 w-4 mr-2" />
                    Compartir con Veterinario
                  </>
                )}
              </Button>
            </>
          )}
          <Button onClick={() => setUploadDialogOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Subir Documento
          </Button>
        </div>
      </div>

      {/* Documents List */}
      {!documents || documents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay documentos</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Sube documentos médicos como tarjetas de vacunación, resultados de laboratorio, radiografías, etc.
            </p>
            <Button onClick={() => setUploadDialogOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Subir Primer Documento
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue={Object.keys(documentsByType)[0] || 'all'}>
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
            <TabsTrigger value="all">Todos</TabsTrigger>
            {Object.keys(documentsByType).map((type) => (
              <TabsTrigger key={type} value={type}>
                {DOCUMENT_TYPE_LABELS[type as MedicalDocumentType]}
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.entries(documentsByType).map(([type, docs]) => (
            <TabsContent key={type} value={type} className="space-y-3">
              {docs.map((doc) => {
                const Icon = DOCUMENT_TYPE_ICONS[doc.type];
                return (
                  <Card key={doc.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-primary/10 rounded-lg">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold truncate">{doc.title}</h4>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <Badge variant="outline" className="text-xs">
                                  {DOCUMENT_TYPE_LABELS[doc.type]}
                                </Badge>
                                {doc.issued_at && (
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Calendar className="h-3 w-3" />
                                    {format(new Date(doc.issued_at), "d MMM yyyy", { locale: es })}
                                  </div>
                                )}
                                <span className="text-xs text-muted-foreground">
                                  {formatFileSize(doc.file_size)}
                                </span>
                              </div>
                              {doc.notes && (
                                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                  {doc.notes}
                                </p>
                              )}
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleView(doc)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Ver
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDownload(doc)}>
                                  <Download className="h-4 w-4 mr-2" />
                                  Descargar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDelete(doc.id)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Eliminar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </TabsContent>
          ))}

          <TabsContent value="all" className="space-y-3">
            {documents.map((doc) => {
              const Icon = DOCUMENT_TYPE_ICONS[doc.type];
              return (
                <Card key={doc.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold truncate">{doc.title}</h4>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <Badge variant="outline" className="text-xs">
                                {DOCUMENT_TYPE_LABELS[doc.type]}
                              </Badge>
                              {doc.issued_at && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Calendar className="h-3 w-3" />
                                  {format(new Date(doc.issued_at), "d MMM yyyy", { locale: es })}
                                </div>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {formatFileSize(doc.file_size)}
                              </span>
                            </div>
                            {doc.notes && (
                              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                {doc.notes}
                              </p>
                            )}
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleView(doc)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Ver
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDownload(doc)}>
                                <Download className="h-4 w-4 mr-2" />
                                Descargar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(doc.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>
        </Tabs>
      )}

      {/* Upload Dialog */}
      <UploadMedicalDocumentDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        petId={petId}
        onSuccess={() => setUploadDialogOpen(false)}
      />

      {/* Document Viewer Dialog */}
      <Dialog open={!!viewingDocument} onOpenChange={() => setViewingDocument(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{viewingDocument?.title}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {viewingDocument?.mimeType?.startsWith('image/') ? (
              <img
                src={viewingDocument.url}
                alt={viewingDocument.title}
                loading="lazy"
                className="w-full h-auto rounded-lg"
              />
            ) : (
              <iframe
                src={viewingDocument?.url}
                className="w-full h-[70vh] rounded-lg border"
                title={viewingDocument?.title}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

