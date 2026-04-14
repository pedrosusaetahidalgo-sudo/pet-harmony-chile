import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileText, Mic, Clipboard } from '@/lib/icons';
import { VetNoteEditor } from '@/components/provider/VetNoteEditor';
import { ConsultationRecorderModal } from '@/components/provider/ConsultationRecorderModal';

interface VetActionsBarProps {
  petId: string;
  petName: string;
  petSpecies?: string;
  providerId: string;
  shareTokenId?: string | null;
  showRecorder?: boolean;
  onRecorderChange?: (open: boolean) => void;
}

export function VetActionsBar({
  petId,
  petName,
  petSpecies,
  providerId,
  shareTokenId,
  showRecorder = false,
  onRecorderChange,
}: VetActionsBarProps) {
  const [showNoteEditor, setShowNoteEditor] = useState(false);
  const recorderOpen = showRecorder;
  const setRecorderOpen = onRecorderChange ?? (() => {});

  const goToDocumentos = () => {
    const tabTrigger = document.querySelector('[value="documentos"]') as HTMLButtonElement;
    tabTrigger?.click();
    // Scroll to top of tabs area
    tabTrigger?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/20 bg-white/80 backdrop-blur-xl shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="container max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-2 h-10 max-w-[180px] border-purple-200 text-purple-700 hover:bg-purple-50"
              onClick={() => setShowNoteEditor(true)}
            >
              <FileText className="h-4 w-4" />
              Nota clinica
            </Button>
            <Button
              size="sm"
              className="flex-1 gap-2 h-10 max-w-[180px] bg-purple-600 hover:bg-purple-700 text-white"
              onClick={() => setRecorderOpen(true)}
            >
              <Mic className="h-4 w-4" />
              Grabar consulta
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-2 h-10 max-w-[180px] border-purple-200 text-purple-700 hover:bg-purple-50"
              onClick={goToDocumentos}
            >
              <Clipboard className="h-4 w-4" />
              Documentos
            </Button>
          </div>
        </div>
      </div>

      {/* Spacer so content isn't hidden behind the bar */}
      <div className="h-20" />

      {/* VetNoteEditor Dialog */}
      <Dialog open={showNoteEditor} onOpenChange={setShowNoteEditor}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nota clinica — {petName}</DialogTitle>
          </DialogHeader>
          <VetNoteEditor
            petId={petId}
            petName={petName}
            providerId={providerId}
            shareTokenId={shareTokenId}
            onSaved={() => setShowNoteEditor(false)}
          />
        </DialogContent>
      </Dialog>

      {/* ConsultationRecorderModal */}
      {shareTokenId && (
        <ConsultationRecorderModal
          open={recorderOpen}
          onOpenChange={setRecorderOpen}
          shareTokenId={shareTokenId}
          providerId={providerId}
          petId={petId}
          petName={petName}
          petSpecies={petSpecies}
        />
      )}
    </>
  );
}
