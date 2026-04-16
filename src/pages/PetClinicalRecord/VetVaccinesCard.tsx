import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { differenceInDays, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Syringe, CheckCircle, AlertTriangle, Circle } from '@/lib/icons';

interface VaccineRecord {
  id: string;
  title: string;
  date: string;
  description: string | null;
}

interface VaccineStatus {
  name: string;
  lastDate: string | null;
  status: 'up_to_date' | 'overdue' | 'never';
  daysInfo: string;
}

interface VetVaccinesCardProps {
  petId: string;
  species: string;
}

const COMMON_VACCINES: Record<string, string[]> = {
  perro: ['Antirabica', 'Sextuple', 'Bordetella', 'Leptospira', 'Parvovirus'],
  gato: ['Antirabica', 'Triple felina', 'Leucemia felina'],
  default: ['Antirabica'],
};

export function VetVaccinesCard({ petId, species }: VetVaccinesCardProps) {
  const { data: vaccineRecords } = useQuery({
    queryKey: ['pet-vaccine-records', petId],
    queryFn: async () => {
      const { data } = await supabase
        .from('medical_records')
        .select('id, title, date, description')
        .eq('pet_id', petId)
        .eq('record_type', 'vacuna')
        .order('date', { ascending: false });
      return (data || []) as VaccineRecord[];
    },
    enabled: !!petId,
  });

  const vaccineStatuses = useMemo((): VaccineStatus[] => {
    const speciesKey = species?.toLowerCase().includes('gato') ? 'gato' : 'perro';
    const expectedVaccines = COMMON_VACCINES[speciesKey] || COMMON_VACCINES.default;

    // Map recorded vaccines by normalized name
    const recordMap = new Map<string, VaccineRecord>();
    for (const rec of vaccineRecords || []) {
      const normName = rec.title.toLowerCase().trim();
      for (const expected of expectedVaccines) {
        if (normName.includes(expected.toLowerCase())) {
          if (
            !recordMap.has(expected) ||
            new Date(rec.date) > new Date(recordMap.get(expected)!.date)
          ) {
            recordMap.set(expected, rec);
          }
        }
      }
    }

    return expectedVaccines.map((name) => {
      const record = recordMap.get(name);
      if (!record) {
        return { name, lastDate: null, status: 'never', daysInfo: 'Sin registro' };
      }

      const daysSince = differenceInDays(new Date(), new Date(record.date));
      const isOverdue = daysSince > 365; // Simple annual check

      return {
        name,
        lastDate: record.date,
        status: isOverdue ? 'overdue' : 'up_to_date',
        daysInfo: isOverdue
          ? `Vencida (${format(new Date(record.date), 'MMM yyyy', { locale: es })})`
          : format(new Date(record.date), 'd MMM yyyy', { locale: es }),
      };
    });
  }, [vaccineRecords, species]);

  // Also show any vaccines that were recorded but aren't in the "expected" list
  const extraVaccines = useMemo(() => {
    const speciesKey = species?.toLowerCase().includes('gato') ? 'gato' : 'perro';
    const expectedNames = (COMMON_VACCINES[speciesKey] || COMMON_VACCINES.default).map((n) =>
      n.toLowerCase()
    );

    const seen = new Set<string>();
    const extras: VaccineRecord[] = [];

    for (const rec of vaccineRecords || []) {
      const normName = rec.title.toLowerCase().trim();
      const isExpected = expectedNames.some((e) => normName.includes(e));
      if (!isExpected && !seen.has(normName)) {
        seen.add(normName);
        extras.push(rec);
      }
    }

    return extras;
  }, [vaccineRecords, species]);

  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Syringe className="h-4 w-4 text-green-600" />
          Vacunas
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="space-y-2">
          {vaccineStatuses.map((v) => (
            <div key={v.name} className="flex items-center gap-2.5">
              {v.status === 'up_to_date' && (
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
              )}
              {v.status === 'overdue' && (
                <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
              )}
              {v.status === 'never' && <Circle className="h-4 w-4 text-gray-300 flex-shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium">{v.name}</p>
                <p
                  className={`text-[10px] ${v.status === 'overdue' ? 'text-amber-600' : 'text-muted-foreground'}`}
                >
                  {v.daysInfo}
                </p>
              </div>
            </div>
          ))}

          {/* Extra vaccines not in standard list */}
          {extraVaccines.map((rec) => (
            <div key={rec.id} className="flex items-center gap-2.5">
              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium">{rec.title}</p>
                <p className="text-[10px] text-muted-foreground">
                  {format(new Date(rec.date), 'd MMM yyyy', { locale: es })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
