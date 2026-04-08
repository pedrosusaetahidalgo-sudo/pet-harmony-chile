import { useCallback } from "react";
import { toast } from "sonner";
import { FileText, Download } from "@/lib/icons";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMedicalDocuments, MedicalDocument } from "@/hooks/useMedicalDocuments";
import { formatShortDate } from "../helpers";
import { EmptyState, getDocTypeLabel } from "../shared";

export function TabDocumentos({ petId }: { petId: string }) {
  const { documents, isLoading, getDownloadUrl } = useMedicalDocuments(petId);

  const handleDownload = useCallback(async (doc: MedicalDocument) => {
    try {
      const url = await getDownloadUrl(doc);
      window.open(url, "_blank");
    } catch {
      toast.error("Error al obtener el enlace de descarga");
    }
  }, [getDownloadUrl]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (!documents || documents.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="Sin documentos"
        description="Los documentos medicos como recetas, resultados de laboratorio y carnets de vacunacion apareceran aqui."
      />
    );
  }

  return (
    <div className="space-y-3">
      {documents.map((doc) => (
        <Card key={doc.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="p-2 bg-emerald-100 rounded-lg flex-shrink-0">
                <FileText className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{doc.title}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className="text-xs">
                    {getDocTypeLabel(doc.type)}
                  </Badge>
                  {doc.issued_at && (
                    <span>{formatShortDate(doc.issued_at)}</span>
                  )}
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
      ))}
    </div>
  );
}
