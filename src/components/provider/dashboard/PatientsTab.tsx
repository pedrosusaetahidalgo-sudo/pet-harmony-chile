import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus, Upload } from '@/lib/icons';
import { VetPatientsList } from '../VetPatientsList';
import { ImportPatientsModal } from '../ImportPatientsModal';

interface PatientsTabProps {
  onNewPatient: () => void;
}

export function PatientsTab({ onNewPatient }: PatientsTabProps) {
  const [showImport, setShowImport] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">Todos tus pacientes</h3>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowImport(true)}
            className="gap-1.5 text-xs"
          >
            <Upload className="h-3.5 w-3.5" />
            Importar
          </Button>
          <Button
            size="sm"
            onClick={onNewPatient}
            className="gap-1.5 text-xs bg-purple-600 hover:bg-purple-700"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Nuevo paciente
          </Button>
        </div>
      </div>
      <VetPatientsList />

      <ImportPatientsModal
        open={showImport}
        onOpenChange={setShowImport}
        onComplete={() => {
          // VetPatientsList uses react-query, so invalidating will refresh
          // The modal handles this internally
        }}
      />
    </div>
  );
}
