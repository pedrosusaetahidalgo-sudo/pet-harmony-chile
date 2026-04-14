import { TodayAgendaCard } from '../TodayAgendaCard';
import { SharedFichasCard } from '../SharedFichasCard';
import { LinkedPatientsCard } from '../LinkedPatientsCard';
import { VetFollowupsCard } from '../VetFollowupsCard';

interface ClinicalTabProps {
  providerId: string | null;
}

export function ClinicalTab({ providerId }: ClinicalTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="space-y-4">
        <TodayAgendaCard />
        <SharedFichasCard providerId={providerId} />
      </div>
      <div className="space-y-4">
        <LinkedPatientsCard />
        <VetFollowupsCard />
      </div>
    </div>
  );
}
