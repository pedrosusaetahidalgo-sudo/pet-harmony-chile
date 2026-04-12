import { useState, useMemo } from 'react';
import { Clipboard, Clock, MapPin, Stethoscope, Calendar, UserCheck, Search } from '@/lib/icons';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMedicalRecords } from '@/hooks/useMedicalRecords';
import { useVetClinicalNotesByPet } from '@/hooks/useVetClinicalNotes';
import { formatDate } from '../helpers';
import { EmptyState, getRecordTypeBadgeClass, getRecordTypeIcon } from '../shared';

const RECORD_TYPE_LABELS: Record<string, string> = {
  vacuna: 'Vacuna',
  consulta: 'Consulta',
  consulta_general: 'Consulta general',
  control_sano: 'Control sano',
  seguimiento: 'Seguimiento',
  segunda_opinion: 'Segunda opinion',
  urgencia: 'Urgencia',
  emergencia: 'Emergencia',
  desparasitacion: 'Desparasitacion',
  antipulgas: 'Antipulgas',
  cirugia: 'Cirugia',
  esterilizacion: 'Esterilizacion',
  limpieza_dental: 'Limpieza dental',
  ecografia: 'Ecografia',
  rayos_x: 'Rayos X',
  examen_sangre: 'Examen de sangre',
  examen_orina: 'Examen de orina',
  examen: 'Examen',
  medicamento: 'Medicamento',
  tratamiento: 'Tratamiento',
  quimioterapia: 'Quimioterapia',
  rehabilitacion: 'Rehabilitacion',
  hospitalizacion: 'Hospitalizacion',
  alergia: 'Alergia',
  peso: 'Peso',
  microchip: 'Microchip',
};

export function TabHistorial({ petId }: { petId: string }) {
  const { records, isLoading } = useMedicalRecords(petId);
  const { data: vetNotes } = useVetClinicalNotesByPet(petId);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');

  const availableTypes = useMemo(() => {
    if (!records) return [];
    const types = [...new Set(records.map((r) => r.record_type))];
    return types.sort();
  }, [records]);

  const filteredRecords = useMemo(() => {
    if (!records) return [];
    const q = search.toLowerCase().trim();
    return records.filter((r) => {
      if (filterType !== 'all' && r.record_type !== filterType) return false;
      if (!q) return true;
      return (
        r.title?.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q) ||
        r.clinic_name?.toLowerCase().includes(q) ||
        r.veterinarian_name?.toLowerCase().includes(q) ||
        r.record_type?.toLowerCase().includes(q)
      );
    });
  }, [records, search, filterType]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
    );
  }

  if (!records || records.length === 0) {
    return (
      <EmptyState
        icon={Clipboard}
        title="Sin historial medico"
        description="Los registros de consultas, vacunas, examenes y tratamientos apareceran aqui."
      />
    );
  }

  const groupedByYear: Record<string, typeof records> = {};
  filteredRecords.forEach((record) => {
    const year = new Date(record.date).getFullYear().toString();
    if (!groupedByYear[year]) groupedByYear[year] = [];
    groupedByYear[year].push(record);
  });

  const sortedYears = Object.keys(groupedByYear).sort((a, b) => Number(b) - Number(a));

  return (
    <div className="space-y-8">
      {/* Busqueda y filtro */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por titulo, veterinario, clinica..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Tipo de registro" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            {availableTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {RECORD_TYPE_LABELS[type] || type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredRecords.length === 0 && (
        <p className="text-center text-muted-foreground py-8">
          No se encontraron registros con esos filtros.
        </p>
      )}
      {sortedYears.map((year) => (
        <div key={year} className="space-y-4">
          <h3 className="text-lg font-bold text-purple-600 sticky top-0 bg-background py-1 z-10">
            {year}
          </h3>
          <div className="relative space-y-4 pl-8 before:absolute before:left-3 before:top-0 before:bottom-0 before:w-0.5 before:bg-border">
            {groupedByYear[year].map((record) => (
              <div key={record.id} className="relative">
                <div
                  className={`absolute -left-8 top-4 w-7 h-7 rounded-full flex items-center justify-center text-xs ${getRecordTypeBadgeClass(record.record_type)}`}
                >
                  {getRecordTypeIcon(record.record_type)}
                </div>

                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-sm">{record.title}</p>
                          <Badge
                            variant="outline"
                            className={`text-xs capitalize ${getRecordTypeBadgeClass(record.record_type)}`}
                          >
                            {record.record_type}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(record.date)}
                        </p>
                      </div>
                    </div>

                    {record.description && (
                      <p className="text-sm text-muted-foreground mt-2">{record.description}</p>
                    )}

                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                      {record.clinic_name && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {record.clinic_name}
                        </span>
                      )}
                      {record.veterinarian_name && (
                        <span className="flex items-center gap-1">
                          <Stethoscope className="h-3 w-3" /> Dr. {record.veterinarian_name}
                        </span>
                      )}
                    </div>

                    {record.next_date && (
                      <div className="flex items-center gap-1.5 text-xs mt-2 p-2 bg-purple-50 rounded border border-primary/10">
                        <Calendar className="h-3 w-3 text-purple-600" />
                        <span className="font-medium text-purple-600">Proxima cita:</span>
                        <span>{formatDate(record.next_date)}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Notas de veterinarios — solo lectura para el dueno */}
      {vetNotes && vetNotes.length > 0 && (
        <Card className="border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-blue-600" />
              Notas de veterinarios
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {vetNotes.map((note) => (
              <div key={note.id} className="p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <p className="text-sm font-medium">{note.title}</p>
                  <Badge
                    variant="outline"
                    className="text-xs capitalize bg-blue-50 text-blue-700 border-blue-200"
                  >
                    {note.note_type}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="text-xs bg-white text-blue-600 border-blue-200"
                  >
                    <UserCheck className="h-3 w-3 mr-1" />
                    {note.provider_name}
                  </Badge>
                </div>
                {note.description && (
                  <p className="text-sm text-muted-foreground mt-1">{note.description}</p>
                )}
                {note.alternative_offered && (
                  <div className="mt-2 p-2 bg-green-50 rounded border border-green-200">
                    <p className="text-xs font-medium text-green-700 mb-0.5">
                      Alternativas discutidas
                    </p>
                    {note.alternatives_discussed && (
                      <p className="text-xs text-green-600">{note.alternatives_discussed}</p>
                    )}
                  </div>
                )}
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
                  <Clock className="h-3 w-3" />
                  {formatDate(note.created_at)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
