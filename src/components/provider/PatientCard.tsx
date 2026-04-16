import { Link } from 'react-router-dom';
import { formatDistanceToNowStrict } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Mic,
  Pencil,
  Sparkles,
  FileText,
  AlertTriangle,
  Pill,
  Stethoscope,
  Calendar,
  Trash2,
} from '@/lib/icons';
import { LINKS } from '@/lib/links';
import { getPatientStatus, calculatePetAge } from '@/hooks/usePatientStatus';
import type { PatientStatusInfo } from '@/hooks/usePatientStatus';

export interface PatientCardData {
  pet_id: string;
  pet_name: string;
  species: string | null;
  breed: string | null;
  birth_date?: string | null;
  photo_url: string | null;
  owner_name: string | null;
  last_visit: string;
  first_visit?: string | null;
  followup_date?: string | null;
  followup_reason?: string | null;
  total_notes: number;
  allergies: string[];
  medications: string[];
  chronic_conditions: string[];
}

interface PatientCardProps {
  patient: PatientCardData;
  onRecord: () => void;
  onNote: () => void;
  onConsolidado: () => void;
  onDelete?: () => void;
}

export function PatientCard({
  patient,
  onRecord,
  onNote,
  onConsolidado,
  onDelete,
}: PatientCardProps) {
  const statusInfo: PatientStatusInfo = getPatientStatus(
    patient.last_visit,
    patient.followup_date ?? null,
    patient.first_visit
  );
  const age = calculatePetAge(patient.birth_date ?? null);
  const ago = formatDistanceToNowStrict(new Date(patient.last_visit), {
    locale: es,
    addSuffix: false,
  });

  const hasAlerts =
    patient.allergies.length > 0 ||
    patient.medications.length > 0 ||
    patient.chronic_conditions.length > 0;

  return (
    <Card className="hover:shadow-md transition-all">
      <CardContent className="p-4 space-y-3">
        {/* Row 1: Avatar + info + status dot */}
        <div className="flex items-start gap-3">
          <div className="relative">
            <Avatar className="h-11 w-11 flex-shrink-0">
              {patient.photo_url && <AvatarImage src={patient.photo_url} alt={patient.pet_name} />}
              <AvatarFallback className="bg-teal-100 text-teal-700 font-bold text-sm">
                {patient.pet_name[0]?.toUpperCase() || 'M'}
              </AvatarFallback>
            </Avatar>
            <span
              className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white ${statusInfo.dotClass}`}
              title={statusInfo.label}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold truncate">{patient.pet_name}</h3>
              {age && <span className="text-xs text-muted-foreground flex-shrink-0">{age}</span>}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {patient.species || 'Mascota'}
              {patient.breed ? ` · ${patient.breed}` : ''}
              {patient.owner_name ? ` · ${patient.owner_name}` : ''}
            </p>
          </div>
          <span className="text-[10px] text-muted-foreground flex-shrink-0 whitespace-nowrap">
            hace {ago}
          </span>
        </div>

        {/* Row 2: Alerts inline */}
        {hasAlerts && (
          <div className="flex flex-wrap gap-1.5">
            {patient.allergies.slice(0, 2).map((a) => (
              <Badge
                key={a}
                variant="outline"
                className="text-[10px] bg-red-50 text-red-700 border-red-200 gap-1"
              >
                <AlertTriangle className="h-2.5 w-2.5" />
                {a}
              </Badge>
            ))}
            {patient.medications.slice(0, 2).map((m) => (
              <Badge
                key={m}
                variant="outline"
                className="text-[10px] bg-blue-50 text-blue-700 border-blue-200 gap-1"
              >
                <Pill className="h-2.5 w-2.5" />
                {m}
              </Badge>
            ))}
            {patient.chronic_conditions.slice(0, 1).map((c) => (
              <Badge
                key={c}
                variant="outline"
                className="text-[10px] bg-orange-50 text-orange-700 border-orange-200 gap-1"
              >
                {c}
              </Badge>
            ))}
            {patient.allergies.length +
              patient.medications.length +
              patient.chronic_conditions.length >
              5 && (
              <Badge variant="outline" className="text-[10px] bg-gray-50 text-gray-500">
                +
                {patient.allergies.length +
                  patient.medications.length +
                  patient.chronic_conditions.length -
                  5}{' '}
                mas
              </Badge>
            )}
          </div>
        )}

        {/* Row 3: Followup + note count */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {patient.total_notes > 0 && (
            <span className="flex items-center gap-1">
              <Stethoscope className="h-3 w-3" />
              {patient.total_notes} nota{patient.total_notes !== 1 ? 's' : ''}
            </span>
          )}
          {patient.followup_date && (
            <span
              className={`flex items-center gap-1 ${
                statusInfo.status === 'followup_overdue'
                  ? 'text-red-600 font-medium'
                  : statusInfo.status === 'followup_soon'
                    ? 'text-amber-600 font-medium'
                    : ''
              }`}
            >
              <Calendar className="h-3 w-3" />
              Seguim:{' '}
              {new Date(patient.followup_date).toLocaleDateString('es-CL', {
                day: 'numeric',
                month: 'short',
              })}
              {patient.followup_reason && ` (${patient.followup_reason})`}
            </span>
          )}
        </div>

        {/* Row 4: Actions */}
        <div className="flex items-center gap-2 pt-1">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 h-8 gap-1.5 text-xs border-red-200 text-red-600 hover:bg-red-50"
            onClick={onRecord}
          >
            <Mic className="h-3.5 w-3.5" />
            Grabar
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 h-8 gap-1.5 text-xs border-teal-200 text-teal-700 hover:bg-teal-50"
            onClick={onNote}
          >
            <Pencil className="h-3.5 w-3.5" />
            Nota
          </Button>
          {patient.total_notes > 0 && (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-purple-600 hover:bg-purple-50"
              onClick={onConsolidado}
              title="Resumen IA"
            >
              <Sparkles className="h-3.5 w-3.5" />
            </Button>
          )}
          <Link to={LINKS.petClinicalVet(patient.pet_id)} className="flex-1">
            <Button size="sm" className="w-full h-8 gap-1.5 text-xs bg-teal-600 hover:bg-teal-700">
              <FileText className="h-3.5 w-3.5" />
              Ficha
            </Button>
          </Link>
          {onDelete && (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-red-600 hover:bg-red-50"
              onClick={onDelete}
              title="Desvincular paciente"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
