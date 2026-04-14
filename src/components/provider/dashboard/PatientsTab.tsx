import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, UserPlus } from '@/lib/icons';
import { VetPatientsList } from '../VetPatientsList';

interface PatientsTabProps {
  onNewPatient: () => void;
}

export function PatientsTab({ onNewPatient }: PatientsTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">Todos tus pacientes</h3>
        <Button
          size="sm"
          onClick={onNewPatient}
          className="gap-1.5 text-xs bg-purple-600 hover:bg-purple-700"
        >
          <UserPlus className="h-3.5 w-3.5" />
          Nuevo paciente
        </Button>
      </div>
      <VetPatientsList />
    </div>
  );
}
