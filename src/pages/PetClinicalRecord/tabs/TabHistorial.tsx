import { Clipboard, Clock, MapPin, Stethoscope, Calendar } from "@/lib/icons";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useMedicalRecords } from "@/hooks/useMedicalRecords";
import { formatDate } from "../helpers";
import { EmptyState, getRecordTypeBadgeClass, getRecordTypeIcon } from "../shared";

export function TabHistorial({ petId }: { petId: string }) {
  const { records, isLoading } = useMedicalRecords(petId);

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
  records.forEach((record) => {
    const year = new Date(record.date).getFullYear().toString();
    if (!groupedByYear[year]) groupedByYear[year] = [];
    groupedByYear[year].push(record);
  });

  const sortedYears = Object.keys(groupedByYear).sort((a, b) => Number(b) - Number(a));

  return (
    <div className="space-y-8">
      {sortedYears.map((year) => (
        <div key={year} className="space-y-4">
          <h3 className="text-lg font-bold text-emerald-600 sticky top-0 bg-background py-1 z-10">
            {year}
          </h3>
          <div className="relative space-y-4 pl-8 before:absolute before:left-3 before:top-0 before:bottom-0 before:w-0.5 before:bg-border">
            {groupedByYear[year].map((record) => (
              <div key={record.id} className="relative">
                <div className={`absolute -left-8 top-4 w-7 h-7 rounded-full flex items-center justify-center text-xs ${getRecordTypeBadgeClass(record.record_type)}`}>
                  {getRecordTypeIcon(record.record_type)}
                </div>

                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-sm">{record.title}</p>
                          <Badge variant="outline" className={`text-xs capitalize ${getRecordTypeBadgeClass(record.record_type)}`}>
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
                      <div className="flex items-center gap-1.5 text-xs mt-2 p-2 bg-emerald-50 rounded border border-primary/10">
                        <Calendar className="h-3 w-3 text-emerald-600" />
                        <span className="font-medium text-emerald-600">Proxima cita:</span>
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
    </div>
  );
}
