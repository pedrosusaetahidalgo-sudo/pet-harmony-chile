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
  onSwitchTab?: (tab: string) => void;
}

export function VetActionsBar({
  petId,
  petName,
  petSpecies,
  providerId,
  shareTokenId,
  showRecorder = false,
  onRecorderChange,
  onSwitchTab,
}: VetActionsBarProps) {
  const [showNoteEditor, setShowNoteEditor] = useState(false);
  const recorderOpen = showRecorder;
  const setRecorderOpen = onRecorderChange ?? (() => {});

  const goToDocumentos = () => {
    if (onSwitchTab) {
      onSwitchTab('documentos');
    }
  };

  return (
    <>
      {/* Sticky bottom bar — SOLO mobile. En desktop VetActionsHeader ya tiene
          estos CTAs al alcance, asi que aca evitamos duplicar. En mobile el
          header se colapsa y esta bar es el acceso al alcance del pulgar. */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-white/20 bg-white/80 backdrop-blur-xl shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="container max-w-4xl mx-auto px-4 py-3 pb-[calc(0.75rem+var(--safe-area-bottom))]">
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-2 h-11 border-purple-200 text-purple-700 hover:bg-purple-50"
              onClick={() => setShowNoteEditor(true)}
            >
              <FileText className="h-4 w-4" />
              Nota
            </Button>
            <Button
              size="sm"
              className="flex-[1.2] gap-2 h-11 bg-purple-600 hover:bg-purple-700 text-white"
              onClick={() => setRecorderOpen(true)}
            >
              <Mic className="h-4 w-4" />
              Grabar
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-2 h-11 border-purple-200 text-purple-700 hover:bg-purple-50"
              onClick={goToDocumentos}
            >
              <Clipboard className="h-4 w-4" />
              Docs
            </Button>
          </div>
        </div>
      </div>

      {/* Spacer solo en mobile, para que el contenido no quede tapado por la bar */}
      <div className="h-20 md:hidden" />

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
      <ConsultationRecorderModal
        open={recorderOpen}
        onOpenChange={setRecorderOpen}
        shareTokenId={shareTokenId ?? undefined}
        providerId={providerId}
        petId={petId}
        petName={petName}
        petSpecies={petSpecies}
      />
    </>
  );
}
