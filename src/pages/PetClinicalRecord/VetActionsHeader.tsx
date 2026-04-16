import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Mic,
  FileText,
  Calendar,
  Download,
  Sparkles,
  MoreHorizontal,
  Heart,
  Syringe,
} from '@/lib/icons';
import { VetNoteEditor } from '@/components/provider/VetNoteEditor';
import { ConsultationRecorderModal } from '@/components/provider/ConsultationRecorderModal';
import { QuickScheduleForm } from '@/components/provider/QuickScheduleForm';
import { PatientConsolidatedSummary } from '@/components/provider/PatientConsolidatedSummary';

interface VetActionsHeaderProps {
  petId: string;
  petName: string;
  petSpecies?: string;
  providerId: string;
  shareTokenId?: string | null;
  onGeneratePDF: () => void;
  onScrollToVitals?: () => void;
}

export function VetActionsHeader({
  petId,
  petName,
  petSpecies,
  providerId,
  shareTokenId,
  onGeneratePDF,
  onScrollToVitals,
}: VetActionsHeaderProps) {
  const [showNoteEditor, setShowNoteEditor] = useState(false);
  const [showRecorder, setShowRecorder] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [showConsolidado, setShowConsolidado] = useState(false);

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        {/* Primary actions — always visible */}
        <Button
          size="sm"
          className="h-9 gap-2 bg-red-600 hover:bg-red-700 text-white"
          onClick={() => setShowRecorder(true)}
        >
          <Mic className="h-4 w-4" />
          <span className="hidden sm:inline">Grabar consulta</span>
          <span className="sm:hidden">Grabar</span>
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-9 gap-2 border-teal-200 text-teal-700 hover:bg-teal-50"
          onClick={() => setShowNoteEditor(true)}
        >
          <FileText className="h-4 w-4" />
          <span className="hidden sm:inline">Nota rapida</span>
          <span className="sm:hidden">Nota</span>
        </Button>

        {/* Secondary actions — visible on desktop, menu on mobile */}
        <Button
          size="sm"
          variant="outline"
          className="h-9 gap-2 hidden sm:flex"
          onClick={() => setShowSchedule(true)}
        >
          <Calendar className="h-4 w-4" />
          Agendar
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-9 gap-2 hidden sm:flex"
          onClick={() => setShowConsolidado(true)}
        >
          <Sparkles className="h-4 w-4" />
          Resumen IA
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-9 gap-2 hidden sm:flex"
          onClick={onGeneratePDF}
        >
          <Download className="h-4 w-4" />
          PDF
        </Button>

        {/* Mobile overflow menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline" className="h-9 w-9 p-0 sm:hidden">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setShowSchedule(true)}>
              <Calendar className="h-4 w-4 mr-2" />
              Agendar seguimiento
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowConsolidado(true)}>
              <Sparkles className="h-4 w-4 mr-2" />
              Resumen IA
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onGeneratePDF}>
              <Download className="h-4 w-4 mr-2" />
              Descargar PDF
            </DropdownMenuItem>
            {onScrollToVitals && (
              <DropdownMenuItem onClick={onScrollToVitals}>
                <Heart className="h-4 w-4 mr-2" />
                Signos vitales
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Note Editor Dialog */}
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

      {/* Recorder */}
      <ConsultationRecorderModal
        open={showRecorder}
        onOpenChange={setShowRecorder}
        shareTokenId={shareTokenId ?? undefined}
        providerId={providerId}
        petId={petId}
        petName={petName}
        petSpecies={petSpecies}
      />

      {/* Schedule Dialog */}
      <Dialog open={showSchedule} onOpenChange={setShowSchedule}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Agendar seguimiento — {petName}</DialogTitle>
          </DialogHeader>
          <QuickScheduleForm
            petId={petId}
            petName={petName}
            providerId={providerId}
            shareTokenId={shareTokenId}
            onSaved={() => setShowSchedule(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Consolidado IA */}
      <PatientConsolidatedSummary
        petId={petId}
        petName={petName}
        open={showConsolidado}
        onOpenChange={setShowConsolidado}
      />
    </>
  );
}
